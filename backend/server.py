# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any, Set
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from pymongo.errors import PyMongoError
import os
import logging
import bcrypt
import jwt
import secrets
import re



# MongoDB connection
mongo_url = os.environ['MONGO_URL']
# Bound database waits so a transient Atlas/DNS outage never leaves browser
# requests spinning indefinitely.
client = AsyncIOMotorClient(
    mongo_url,
    serverSelectionTimeoutMS=8000,
    connectTimeoutMS=8000,
    socketTimeoutMS=15000,
)
db = client[os.environ['DB_NAME']]

# JWT configuration
JWT_SECRET = os.environ.get("JWT_SECRET")
JWT_ALGORITHM = "HS256"

from contextlib import asynccontextmanager

# Initialize OpenAI Speech-to-Text
from openai import AsyncOpenAI
stt = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY", "dummy-key-for-now"))

def is_cookie_secure() -> bool:
    """Return True if cookies should require HTTPS."""
    return os.environ.get("COOKIE_SECURE", "").lower() in ("true", "1") or os.environ.get("FRONTEND_URL", "").startswith("https://")

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db_and_admin()
    yield
    client.close()

# Create the main app with lifespan management
app = FastAPI(lifespan=lifespan)
api_router = APIRouter(prefix="/api")

@app.exception_handler(PyMongoError)
async def mongodb_error_handler(request: Request, exc: PyMongoError):
    logger.error("MongoDB request failed: %s", exc)
    return Response(
        content='{"detail":"Database temporarily unavailable. Please try again shortly."}',
        status_code=503,
        media_type="application/json",
    )

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== PASSWORD & JWT UTILITIES ====================
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user.pop("_id", None)
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_roles(allowed_roles: Set[str]):
    """Return a dependency that authorizes using the role read from MongoDB.

    Roles are deliberately not taken from the JWT or any client request value so
    a role change takes effect immediately for already-issued access tokens.
    """
    async def role_guard(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(status_code=403, detail="You do not have permission to perform this action")
        return current_user
    return role_guard

require_admin = require_roles({"admin"})
require_municipal = require_roles({"municipal", "admin"})

async def require_admin_passkey(
    request: Request, current_user: dict = Depends(require_admin)
) -> dict:
    """Require a fresh server-side passkey confirmation for sensitive actions."""
    configured_passkey = os.environ.get("ADMIN_PASSKEY")
    submitted_passkey = request.headers.get("X-Admin-Passkey")
    if not configured_passkey:
        logger.error("ADMIN_PASSKEY is not configured")
        raise HTTPException(status_code=500, detail="Administrator passkey is not configured")
    if not submitted_passkey:
        raise HTTPException(status_code=401, detail={"code": "admin_passkey_required"})
    if not secrets.compare_digest(submitted_passkey, configured_passkey):
        raise HTTPException(status_code=403, detail="Invalid administrator passkey")
    return current_user

# ==================== MODELS ====================
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = Field(min_length=1, max_length=120)

class UserProfileUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    phone: Optional[str] = Field(default=None, max_length=25)
    avatar: Optional[str] = Field(default=None, max_length=3_000_000)
    remove_avatar: bool = False

class MunicipalWorkerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8)
    department: str = Field(min_length=1, max_length=50)

class MunicipalWorkerUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(default=None, min_length=8)
    department: Optional[str] = Field(default=None, min_length=1, max_length=50)

DEPARTMENTS = {"Roads", "Water", "Electrical", "Sanitation", "Parks", "Other"}

def serialize_user(user: dict) -> dict:
    """Return a user without password material or Mongo internals."""
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "department": user.get("department"),
        "phone": user.get("phone", ""),
        "avatar": user.get("avatar") or user.get("picture", ""),
        "points": user.get("points", 0),
        "badges": user.get("badges", []),
        "created_at": user.get("created_at").isoformat() if isinstance(user.get("created_at"), datetime) else user.get("created_at"),
        "updated_at": user.get("updated_at").isoformat() if isinstance(user.get("updated_at"), datetime) else user.get("updated_at"),
    }

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    # Provided only in the second step for administrator sign-in.
    admin_passkey: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    points: int = 0
    badges: List[str] = []
    created_at: str

class IssueCreate(BaseModel):
    title: str
    description: str
    category: str  # pothole, garbage, streetlight, sewage, water, electrical, etc.
    location: Dict[str, float]  # {lat: float, lng: float}
    address: str
    photo_url: Optional[str] = None
    photos: Optional[List[str]] = []  # Citizen-uploaded before images
    after_photos: Optional[List[str]] = []  # Officer-uploaded after/proof images

class StatusHistoryEntry(BaseModel):
    id: str
    status: str
    timestamp: str
    changed_by: str
    changed_by_name: str
    changed_by_role: str
    remark: str
    estimated_completion_date: Optional[str] = None

class IssueUpdate(BaseModel):
    status: Optional[str] = None
    remark: Optional[str] = ""
    assigned_to: Optional[str] = None
    estimated_completion_date: Optional[str] = None
    after_photos: Optional[List[str]] = None
    verification_status: Optional[str] = None

class IssueResponse(BaseModel):
    id: str
    title: str
    description: str
    category: str
    status: str
    location: Dict[str, float]
    address: str
    photo_url: Optional[str]
    photos: Optional[List[str]] = []
    after_photos: Optional[List[str]] = []
    created_by: str
    created_by_name: str
    assigned_to: Optional[str] = None
    estimated_completion_date: Optional[str] = None
    history: List[StatusHistoryEntry] = []
    created_at: str
    updated_at: str
    comments_count: int = 0

class CommentCreate(BaseModel):
    text: str

class CommentResponse(BaseModel):
    id: str
    issue_id: str
    user_id: str
    user_name: str
    text: str
    created_at: str

class LeaderboardEntry(BaseModel):
    user_id: str
    name: str
    points: int
    badges: List[str]
    issues_reported: int

class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    message: str
    issue_id: str
    issue_title: str
    read: bool
    created_at: str
    actor_id: Optional[str] = None
    actor_name: Optional[str] = None

# ==================== NOTIFICATIONS ====================
async def get_municipal_user_ids() -> List[str]:
    users = await db.users.find(
        {"role": {"$in": ["municipal", "admin"]}},
        {"_id": 0, "id": 1}
    ).to_list(200)
    return [u["id"] for u in users if u.get("id")]

async def create_notification(
    user_id: str,
    ntype: str,
    title: str,
    message: str,
    issue_id: str,
    issue_title: str,
    actor_id: Optional[str] = None,
    actor_name: Optional[str] = None,
):
    import uuid
    if not user_id:
        return
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": ntype,
        "title": title,
        "message": message,
        "issue_id": issue_id,
        "issue_title": issue_title,
        "read": False,
        "created_at": datetime.now(timezone.utc),
        "actor_id": actor_id,
        "actor_name": actor_name,
    }
    await db.notifications.insert_one(doc)

async def notify_issue_parties_for_update(
    existing_issue: dict,
    update: IssueUpdate,
    new_status: str,
    current_user: dict,
    is_municipal_or_admin: bool,
):
    old_status = existing_issue.get("status", "Submitted")
    old_assigned = existing_issue.get("assigned_to")
    issue_id = existing_issue["id"]
    issue_title = existing_issue.get("title", "Complaint")
    creator_id = existing_issue.get("created_by")
    actor_id = current_user["id"]
    actor_name = current_user["name"]

    async def notify_user(user_id: Optional[str], ntype: str, title: str, message: str):
        if user_id and user_id != actor_id:
            await create_notification(
                user_id, ntype, title, message, issue_id, issue_title, actor_id, actor_name
            )

    if update.assigned_to is not None and update.assigned_to != old_assigned and update.assigned_to:
        await notify_user(
            creator_id,
            "assignment",
            "Complaint assigned",
            f'"{issue_title}" was assigned to {update.assigned_to}.',
        )
        assignee = await db.users.find_one(
            {
                "name": {"$regex": f"^{re.escape(update.assigned_to)}$", "$options": "i"},
                "role": {"$in": ["municipal", "admin"]},
            },
            {"_id": 0, "id": 1},
        )
        if assignee:
            await notify_user(
                assignee["id"],
                "assignment",
                "Complaint assigned to you",
                f'You were assigned to "{issue_title}".',
            )

    if new_status != old_status:
        if new_status == "Citizen Verification Pending":
            await notify_user(
                creator_id,
                "verification_request",
                "Verification requested",
                f'Please verify the completed work on "{issue_title}".',
            )
        elif new_status == "Reopened":
            for municipal_id in await get_municipal_user_ids():
                await notify_user(
                    municipal_id,
                    "reopened",
                    "Complaint reopened",
                    f'"{issue_title}" was reopened and needs further action.',
                )
        elif is_municipal_or_admin:
            await notify_user(
                creator_id,
                "status_change",
                "Status updated",
                f'"{issue_title}" is now {new_status}.',
            )
        else:
            for municipal_id in await get_municipal_user_ids():
                await notify_user(
                    municipal_id,
                    "status_change",
                    "Status updated",
                    f'"{issue_title}" status changed to {new_status}.',
                )

# ==================== BRUTE FORCE PROTECTION ====================
async def check_brute_force(identifier: str):
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt["count"] >= 5:
        lockout_until = attempt["lockout_until"]
        if lockout_until > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")
        else:
            await db.login_attempts.delete_one({"identifier": identifier})

async def record_failed_login(identifier: str):
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt:
        count = attempt["count"] + 1
        lockout_until = datetime.now(timezone.utc) + timedelta(minutes=15) if count >= 5 else None
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$set": {"count": count, "lockout_until": lockout_until}}
        )
    else:
        await db.login_attempts.insert_one({
            "identifier": identifier,
            "count": 1,
            "lockout_until": None
        })

async def clear_failed_logins(identifier: str):
    await db.login_attempts.delete_one({"identifier": identifier})

# ==================== AUTH ENDPOINTS ====================
@api_router.post("/auth/register")
async def register(user: UserRegister, response: Response):
    import uuid
    email = user.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    # Public registration is intentionally citizen-only. The request model does
    # not expose role, preventing privilege escalation through crafted requests.
    user_doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(user.password),
        "name": user.name,
        "role": "citizen",
        "points": 0,
        "badges": [],
        "created_at": now,
        "updated_at": now,
    }
    result = await db.users.insert_one(user_doc)
    
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(
        key="access_token", value=access_token, httponly=True,
        secure=is_cookie_secure(), samesite="lax", max_age=900, path="/"
    )
    response.set_cookie(
        key="refresh_token", value=refresh_token, httponly=True,
        secure=is_cookie_secure(), samesite="lax", max_age=604800, path="/"
    )
    
    return {
        "id": user_id,
        "email": email,
        "name": user.name,
        "role": "citizen",
        "points": 0,
        "badges": [],
        "created_at": user_doc["created_at"].isoformat(),
        "updated_at": user_doc["updated_at"].isoformat(),
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin, request: Request, response: Response):
    email = credentials.email.lower()
    ip = request.client.host
    identifier = f"{ip}:{email}"
    
    await check_brute_force(identifier)
    
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        await record_failed_login(identifier)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # An administrator must complete an additional server-side passkey check.
    # The passkey is never returned to or stored by the frontend.
    if user.get("role") == "admin":
        configured_passkey = os.environ.get("ADMIN_PASSKEY")
        if not configured_passkey:
            logger.error("ADMIN_PASSKEY is not configured")
            raise HTTPException(status_code=500, detail="Administrator sign-in is not configured")
        if not credentials.admin_passkey:
            raise HTTPException(status_code=401, detail={"code": "admin_passkey_required"})
        if not secrets.compare_digest(credentials.admin_passkey, configured_passkey):
            await record_failed_login(identifier)
            raise HTTPException(status_code=401, detail="Invalid administrator passkey")
    
    await clear_failed_logins(identifier)
    
    user_id = user["id"]
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(
        key="access_token", value=access_token, httponly=True,
        secure=is_cookie_secure(), samesite="lax", max_age=900, path="/"
    )
    response.set_cookie(
        key="refresh_token", value=refresh_token, httponly=True,
        secure=is_cookie_secure(), samesite="lax", max_age=604800, path="/"
    )
    
    return serialize_user(user)

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return serialize_user(current_user)

@api_router.patch("/auth/profile")
async def update_profile(
    profile: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Allow a signed-in person to update only their own presentation details."""
    updates = {"updated_at": datetime.now(timezone.utc)}
    if profile.name is not None:
        updates["name"] = profile.name.strip()
    if profile.phone is not None:
        phone = profile.phone.strip()
        if phone and not re.fullmatch(r"[0-9+()\-\s]{7,25}", phone):
            raise HTTPException(status_code=422, detail="Enter a valid mobile number")
        updates["phone"] = phone
    if profile.remove_avatar:
        updates["avatar"] = ""
    elif profile.avatar is not None:
        # Only accept a browser image data URL or an existing HTTPS avatar URL.
        if not (profile.avatar.startswith("data:image/") or profile.avatar.startswith("https://")):
            raise HTTPException(status_code=422, detail="Profile image must be an image")
        updates["avatar"] = profile.avatar

    await db.users.update_one({"id": current_user["id"]}, {"$set": updates})
    updated_user = await db.users.find_one({"id": current_user["id"]})
    return serialize_user(updated_user)

@api_router.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id = payload["sub"]
        user = await db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        access_token = create_access_token(user_id, user["email"])
        response.set_cookie(
            key="access_token", value=access_token, httponly=True,
            secure=is_cookie_secure(), samesite="lax", max_age=900, path="/"
        )
        return {"message": "Token refreshed"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@api_router.post("/auth/google-session")
async def google_session(request: Request, response: Response):
    import httpx
    import uuid
    
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            session_data = resp.json()
            email = session_data["email"]
            name = session_data.get("name", email.split("@")[0])
            picture = session_data.get("picture", "")
            
            existing_user = await db.users.find_one({"email": email})
            
            if existing_user:
                if existing_user.get("role") == "admin":
                    raise HTTPException(status_code=403, detail="Administrator accounts must use email, password, and passkey sign-in")
                user_id = existing_user["id"]
                await db.users.update_one(
                    {"id": user_id},
                    {"$set": {"name": name, "picture": picture}}
                )
            else:
                user_id = str(uuid.uuid4())
                await db.users.insert_one({
                    "id": user_id,
                    "email": email,
                    "name": name,
                    "picture": picture,
                    "role": "citizen",
                    "points": 0,
                    "badges": [],
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc),
                })
            
            access_token = create_access_token(user_id, email)
            refresh_token = create_refresh_token(user_id)
            
            response.set_cookie(
                key="access_token", value=access_token, httponly=True,
                secure=is_cookie_secure(), samesite="lax", max_age=900, path="/"
            )
            response.set_cookie(
                key="refresh_token", value=refresh_token, httponly=True,
                secure=is_cookie_secure(), samesite="lax", max_age=604800, path="/"
            )
            
            user = await db.users.find_one({"id": user_id})
            return serialize_user(user)
            
    except Exception as e:
        logger.error(f"Google auth error: {str(e)}")
        raise HTTPException(status_code=500, detail="Authentication failed")

# ==================== ADMIN: MUNICIPAL WORKER MANAGEMENT ====================
@api_router.get("/admin/municipal-workers")
async def list_municipal_workers(current_user: dict = Depends(require_admin)):
    workers = await db.users.find({"role": "municipal"}).sort("created_at", -1).to_list(500)
    return [serialize_user(worker) for worker in workers]

@api_router.post("/admin/municipal-workers", status_code=201)
async def create_municipal_worker(worker: MunicipalWorkerCreate, current_user: dict = Depends(require_admin_passkey)):
    import uuid
    if worker.department not in DEPARTMENTS:
        raise HTTPException(status_code=422, detail="Invalid department")
    email = worker.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    now = datetime.now(timezone.utc)
    user_doc = {
        "id": str(uuid.uuid4()), "email": email, "name": worker.name.strip(),
        "password_hash": hash_password(worker.password), "role": "municipal",
        "department": worker.department, "points": 0, "badges": [],
        "created_at": now, "updated_at": now,
    }
    await db.users.insert_one(user_doc)
    return serialize_user(user_doc)

@api_router.patch("/admin/municipal-workers/{worker_id}")
async def update_municipal_worker(worker_id: str, worker: MunicipalWorkerUpdate, current_user: dict = Depends(require_admin)):
    existing = await db.users.find_one({"id": worker_id, "role": "municipal"})
    if not existing:
        raise HTTPException(status_code=404, detail="Municipal worker not found")
    updates = {"updated_at": datetime.now(timezone.utc)}
    if worker.name is not None:
        updates["name"] = worker.name.strip()
    if worker.department is not None:
        if worker.department not in DEPARTMENTS:
            raise HTTPException(status_code=422, detail="Invalid department")
        updates["department"] = worker.department
    if worker.email is not None:
        email = worker.email.lower()
        duplicate = await db.users.find_one({"email": email, "id": {"$ne": worker_id}})
        if duplicate:
            raise HTTPException(status_code=400, detail="Email already registered")
        updates["email"] = email
    if worker.password is not None:
        updates["password_hash"] = hash_password(worker.password)
    await db.users.update_one({"id": worker_id, "role": "municipal"}, {"$set": updates})
    updated = await db.users.find_one({"id": worker_id})
    return serialize_user(updated)

@api_router.delete("/admin/municipal-workers/{worker_id}")
async def delete_municipal_worker(worker_id: str, current_user: dict = Depends(require_admin)):
    result = await db.users.delete_one({"id": worker_id, "role": "municipal"})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Municipal worker not found")
    return {"message": "Municipal worker deleted successfully"}

# ==================== ISSUE ENDPOINTS ====================
@api_router.post("/issues")
async def create_issue(issue: IssueCreate, current_user: dict = Depends(get_current_user)):
    import uuid
    issue_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    initial_history_entry = {
        "id": str(uuid.uuid4()),
        "status": "Submitted",
        "timestamp": now_iso,
        "changed_by": current_user["id"],
        "changed_by_name": current_user["name"],
        "changed_by_role": current_user.get("role", "citizen"),
        "remark": "Complaint submitted by citizen",
        "estimated_completion_date": None
    }

    issue_doc = {
        "id": issue_id,
        "title": issue.title,
        "description": issue.description,
        "category": issue.category,
        "status": "Submitted",
        "location": issue.location,
        "address": issue.address,
        "photo_url": issue.photo_url,
        "photos": issue.photos or [],
        "after_photos": issue.after_photos or [],
        "created_by": current_user["id"],
        "created_by_name": current_user["name"],
        "assigned_to": None,
        "estimated_completion_date": None,
        "history": [initial_history_entry],
        "created_at": now,
        "updated_at": now,
        "verification_status": None
    }
    result = await db.issues.insert_one(issue_doc)
    
    # Award points to user
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$inc": {"points": 10}}
    )
    
    # Check for badges
    user_issues_count = await db.issues.count_documents({"created_by": current_user["id"]})
    badges = []
    if user_issues_count >= 1:
        badges.append("First Reporter")
    if user_issues_count >= 5:
        badges.append("Active Citizen")
    if user_issues_count >= 10:
        badges.append("Community Champion")
    
    if badges:
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$addToSet": {"badges": {"$each": badges}}}
        )
    
    issue_doc.pop("_id", None)
    return {
        **issue_doc,
        "created_at": issue_doc["created_at"].isoformat(),
        "updated_at": issue_doc["updated_at"].isoformat(),
        "comments_count": 0
    }

@api_router.get("/issues")
async def get_issues(
    status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    my_issues: bool = False,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if my_issues:
        query["created_by"] = current_user["id"]
    
    if status:
        if status == "pending":
            query["status"] = {"$in": ["pending", "Submitted", "Verified", "Assigned"]}
        elif status == "in-progress":
            query["status"] = {"$in": ["in-progress", "Inspection Scheduled", "Inspection Completed", "Work Started"]}
        elif status == "resolved":
            query["status"] = {"$in": ["resolved", "Work Completed", "Citizen Verification Pending", "Closed"]}
        else:
            query["status"] = status

    if category:
        query["category"] = category
    if search:
        safe_search = re.escape(search.strip())
        query["$or"] = [
            {"title": {"$regex": safe_search, "$options": "i"}},
            {"description": {"$regex": safe_search, "$options": "i"}},
            {"address": {"$regex": safe_search, "$options": "i"}}
        ]
    
    issues = await db.issues.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Bulk comment counts (O(1) database aggregation instead of N+1 count_documents queries)
    issue_ids = [issue.get("id") for issue in issues if issue.get("id")]
    comment_counts = {}
    if issue_ids and hasattr(db.comments, "aggregate"):
        try:
            cursor = db.comments.aggregate([
                {"$match": {"issue_id": {"$in": issue_ids}}},
                {"$group": {"_id": "$issue_id", "count": {"$sum": 1}}}
            ])
            async for doc in cursor:
                comment_counts[doc["_id"]] = doc["count"]
        except Exception:
            pass

    # Add comments count & fallback history
    for issue in issues:
        issue["comments_count"] = comment_counts.get(issue.get("id", ""), 0)
        # Ensure after_photos is always present
        if "after_photos" not in issue or issue["after_photos"] is None:
            issue["after_photos"] = []
        if isinstance(issue.get("created_at"), datetime):
            issue["created_at"] = issue["created_at"].isoformat()
        if isinstance(issue.get("updated_at"), datetime):
            issue["updated_at"] = issue["updated_at"].isoformat()

        # Fallback history for legacy issues
        if "history" not in issue or not issue["history"]:
            created_time_str = issue.get("created_at") or datetime.now(timezone.utc).isoformat()
            current_stat = issue.get("status", "Submitted")
            issue["history"] = [
                {
                    "id": f"synthetic-{issue.get('id')}-1",
                    "status": "Submitted",
                    "timestamp": created_time_str,
                    "changed_by": issue.get("created_by", ""),
                    "changed_by_name": issue.get("created_by_name", "Citizen"),
                    "changed_by_role": "citizen",
                    "remark": "Complaint registered",
                    "estimated_completion_date": None
                }
            ]
            if current_stat not in ["Submitted", "pending"]:
                issue["history"].append({
                    "id": f"synthetic-{issue.get('id')}-2",
                    "status": current_stat,
                    "timestamp": issue.get("updated_at") or created_time_str,
                    "changed_by": issue.get("assigned_to") or "Municipal Officer",
                    "changed_by_name": issue.get("assigned_to") or "Municipal Officer",
                    "changed_by_role": "municipal",
                    "remark": f"Status transitioned to {current_stat}",
                    "estimated_completion_date": issue.get("estimated_completion_date")
                })
    
    return issues

@api_router.patch("/issues/{issue_id}")
async def update_issue(issue_id: str, update: IssueUpdate, current_user: dict = Depends(get_current_user)):
    import uuid
    existing_issue = await db.issues.find_one({"id": issue_id})
    if not existing_issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    is_municipal_or_admin = current_user["role"] in ["municipal", "admin"]
    is_owner = existing_issue["created_by"] == current_user["id"]
    
    # Permission check: municipal/admin can update any status.
    # Citizens can ONLY modify their own complaint (strict BOLA defense).
    if not is_municipal_or_admin:
        if not is_owner:
            raise HTTPException(status_code=403, detail="You do not have permission to modify this complaint")
        allowed_citizen_statuses = {"Reopened"}
        if update.verification_status is None and update.status not in allowed_citizen_statuses:
            raise HTTPException(status_code=403, detail="Only municipal officers can perform this status transition")
    
    new_status = update.status or existing_issue.get("status", "Submitted")
    verification_status = update.verification_status or existing_issue.get("verification_status") or None

    if is_municipal_or_admin and update.status == "Work Completed":
        new_status = "Citizen Verification Pending"
        verification_status = "pending"
        remark_text = (update.remark or "Work completed and awaiting citizen verification.").strip()
    elif verification_status in {"verified", "rejected"}:
        if existing_issue.get("status") not in ["Work Completed", "Citizen Verification Pending"]:
            raise HTTPException(status_code=400, detail="Citizen verification is only available after completion work is marked complete")
        if verification_status == "verified":
            new_status = "Closed"
            remark_text = (update.remark or "Verified by citizen and closed permanently.").strip()
        else:
            new_status = "Reopened"
            remark_text = (update.remark or "Rejected by citizen and reopened for further work.").strip()
    else:
        remark_text = (update.remark or "").strip()
    if not remark_text:
        remark_text = f"Status updated to {new_status}"
    
    now_iso = datetime.now(timezone.utc).isoformat()
    est_date = update.estimated_completion_date or existing_issue.get("estimated_completion_date")

    history_entry = {
        "id": str(uuid.uuid4()),
        "status": new_status,
        "timestamp": now_iso,
        "changed_by": current_user["id"],
        "changed_by_name": current_user["name"],
        "changed_by_role": current_user.get("role", "citizen"),
        "remark": remark_text,
        "estimated_completion_date": est_date
    }
    
    update_data = {
        "status": new_status,
        "updated_at": datetime.now(timezone.utc),
        "verification_status": verification_status or existing_issue.get("verification_status") or "none"
    }
    if update.assigned_to is not None:
        update_data["assigned_to"] = update.assigned_to
    if update.estimated_completion_date is not None:
        update_data["estimated_completion_date"] = update.estimated_completion_date
    if update.after_photos is not None:
        update_data["after_photos"] = update.after_photos

    await db.issues.update_one(
        {"id": issue_id},
        {
            "$set": update_data,
            "$push": {"history": history_entry}
        }
    )

    await notify_issue_parties_for_update(
        existing_issue, update, new_status, current_user, is_municipal_or_admin
    )
    
    return {"message": "Issue status updated successfully", "status": new_status, "verification_status": update_data.get("verification_status")}

@api_router.delete("/issues/{issue_id}")
async def delete_issue(issue_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete issues")
    
    result = await db.issues.delete_one({"id": issue_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    return {"message": "Issue deleted successfully"}

# ==================== COMMENT ENDPOINTS ====================
@api_router.post("/issues/{issue_id}/comments")
async def create_comment(issue_id: str, comment: CommentCreate, current_user: dict = Depends(get_current_user)):
    import uuid
    
    # Verify issue exists
    existing_issue = await db.issues.find_one({"id": issue_id})
    if not existing_issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    comment_doc = {
        "id": str(uuid.uuid4()),
        "issue_id": issue_id,
        "user_id": current_user["id"],
        "user_name": current_user["name"],
        "text": comment.text,
        "created_at": datetime.now(timezone.utc)
    }
    await db.comments.insert_one(comment_doc)

    issue_title = existing_issue.get("title", "Complaint")
    recipients = set()
    if existing_issue.get("created_by"):
        recipients.add(existing_issue["created_by"])
    for municipal_id in await get_municipal_user_ids():
        recipients.add(municipal_id)
    recipients.discard(current_user["id"])
    preview = comment.text.strip()
    if len(preview) > 80:
        preview = preview[:77] + "..."
    for user_id in recipients:
        await create_notification(
            user_id,
            "comment",
            "New comment",
            f'{current_user["name"]} commented on "{issue_title}": {preview}',
            issue_id,
            issue_title,
            current_user["id"],
            current_user["name"],
        )
    
    comment_doc.pop("_id", None)
    return {
        **comment_doc,
        "created_at": comment_doc["created_at"].isoformat()
    }

@api_router.get("/issues/{issue_id}/comments")
async def get_comments(issue_id: str):
    comments = await db.comments.find({"issue_id": issue_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for comment in comments:
        if isinstance(comment.get("created_at"), datetime):
            comment["created_at"] = comment["created_at"].isoformat()
    return comments

# ==================== VOICE TRANSCRIPTION ====================
@api_router.post("/voice/transcribe")
async def transcribe_voice(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    try:
        audio_data = await file.read()
        
        # Create a temporary file-like object
        import io
        audio_file = io.BytesIO(audio_data)
        audio_file.name = file.filename
        
        response = await stt.audio.transcriptions.create(
            file=audio_file,
            model="whisper-1",
            response_format="json"
        )
        
        return {"text": response.text}
    except Exception as e:
        logger.error(f"Voice transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

# ==================== NOTIFICATION ENDPOINTS ====================
def serialize_notification(doc: dict) -> dict:
    created = doc.get("created_at")
    if isinstance(created, datetime):
        created = created.isoformat()
    return {
        "id": doc["id"],
        "type": doc["type"],
        "title": doc["title"],
        "message": doc["message"],
        "issue_id": doc["issue_id"],
        "issue_title": doc.get("issue_title", ""),
        "read": doc.get("read", False),
        "created_at": created,
        "actor_id": doc.get("actor_id"),
        "actor_name": doc.get("actor_name"),
    }

@api_router.get("/notifications")
async def list_notifications(
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
):
    limit = min(max(limit, 1), 100)
    cursor = db.notifications.find(
        {"user_id": current_user["id"]},
        {"_id": 0},
    ).sort("created_at", -1).limit(limit)
    items = await cursor.to_list(limit)
    return [serialize_notification(n) for n in items]

@api_router.get("/notifications/unread-count")
async def notifications_unread_count(current_user: dict = Depends(get_current_user)):
    count = await db.notifications.count_documents(
        {"user_id": current_user["id"], "read": False}
    )
    return {"count": count}

@api_router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
):
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user["id"]},
        {"$set": {"read": True}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Marked as read"}

@api_router.patch("/notifications/read-all")
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    await db.notifications.update_many(
        {"user_id": current_user["id"], "read": False},
        {"$set": {"read": True}},
    )
    return {"message": "All notifications marked as read"}

# ==================== GAMIFICATION ENDPOINTS ====================
@api_router.get("/gamification/leaderboard")
async def get_leaderboard():
    users = await db.users.find(
        {"role": "citizen"},
        {"_id": 0, "password_hash": 0}
    ).sort("points", -1).limit(50).to_list(50)
    
    user_ids = [u["id"] for u in users if u.get("id")]
    issue_counts = {}
    if user_ids and hasattr(db.issues, "aggregate"):
        try:
            cursor = db.issues.aggregate([
                {"$match": {"created_by": {"$in": user_ids}}},
                {"$group": {"_id": "$created_by", "count": {"$sum": 1}}}
            ])
            async for doc in cursor:
                issue_counts[doc["_id"]] = doc["count"]
        except Exception:
            pass

    leaderboard = []
    for user in users:
        leaderboard.append({
            "user_id": user["id"],
            "name": user["name"],
            "points": user.get("points", 0),
            "badges": user.get("badges", []),
            "issues_reported": issue_counts.get(user["id"], 0)
        })
    
    return leaderboard

@api_router.get("/analytics/summary")
async def get_analytics_summary():
    """Return platform analytics directly computed via database aggregations."""
    try:
        total_issues = await db.issues.count_documents({})
        status_counts = {}
        if hasattr(db.issues, "aggregate"):
            cursor = db.issues.aggregate([
                {"$group": {"_id": "$status", "count": {"$sum": 1}}}
            ])
            async for doc in cursor:
                status_counts[doc["_id"] or "Submitted"] = doc["count"]
        
        category_counts = {}
        if hasattr(db.issues, "aggregate"):
            cursor = db.issues.aggregate([
                {"$group": {"_id": "$category", "count": {"$sum": 1}}}
            ])
            async for doc in cursor:
                if doc["_id"]:
                    category_counts[doc["_id"]] = doc["count"]

        total_citizens = await db.users.count_documents({"role": "citizen"})
        return {
            "total_issues": total_issues,
            "status_distribution": status_counts,
            "category_distribution": category_counts,
            "total_citizens": total_citizens,
        }
    except Exception as e:
        logger.error(f"Analytics summary error: {e}")
        return {
            "total_issues": 0,
            "status_distribution": {},
            "category_distribution": {},
            "total_citizens": 0,
        }

@api_router.get("/gamification/my-stats")
async def get_my_stats(current_user: dict = Depends(get_current_user)):
    issues_count = await db.issues.count_documents({"created_by": current_user["id"]})
    resolved_count = await db.issues.count_documents({
        "created_by": current_user["id"],
        "status": "resolved"
    })
    
    return {
        "points": current_user.get("points", 0),
        "badges": current_user.get("badges", []),
        "issues_reported": issues_count,
        "issues_resolved": resolved_count
    }

# ==================== CATEGORIES ====================
@api_router.get("/categories")
async def get_categories():
    return [
        {"id": "pothole", "name": "Pothole", "icon": "RoadHorizon"},
        {"id": "garbage", "name": "Garbage", "icon": "Trash"},
        {"id": "streetlight", "name": "Street Light", "icon": "Lightbulb"},
        {"id": "sewage", "name": "Sewage", "icon": "Drop"},
        {"id": "water", "name": "Water Supply", "icon": "Drop"},
        {"id": "electrical", "name": "Electrical", "icon": "Lightning"},
        {"id": "road", "name": "Road Damage", "icon": "Warning"},
        {"id": "park", "name": "Park Maintenance", "icon": "Tree"},
        {"id": "noise", "name": "Noise Pollution", "icon": "SpeakerHigh"},
        {"id": "other", "name": "Other", "icon": "DotsThree"}
    ]

# ==================== ADMIN SEEDING & DATABASE INITIALIZATION ====================
async def init_db_and_admin():
    import uuid
    admin_name = os.environ.get("ADMIN_NAME")
    admin_email = os.environ.get("ADMIN_EMAIL")
    admin_password = os.environ.get("ADMIN_PASSWORD")

    try:
        existing_admin = await db.users.find_one({"role": "admin"})
        if existing_admin is None and all([admin_name, admin_email, admin_password]):
            if len(admin_password) >= 8 and not await db.users.find_one({"email": admin_email.lower()}):
                now = datetime.now(timezone.utc)
                await db.users.insert_one({
                    "id": str(uuid.uuid4()),
                    "email": admin_email.lower(),
                    "password_hash": hash_password(admin_password),
                    "name": admin_name,
                    "role": "admin",
                    "points": 0,
                    "badges": [],
                    "created_at": now,
                    "updated_at": now,
                })
                logger.info("Initial administrator account created")

        # Create/verify database indexes
        await db.users.create_index("email", unique=True)
        await db.users.create_index("role")
        await db.login_attempts.create_index("identifier")
        await db.notifications.create_index([("user_id", 1), ("created_at", -1)])
        await db.notifications.create_index([("user_id", 1), ("read", 1)])
        
        # Primary domain indexes on complaints & comments
        await db.issues.create_index("status")
        await db.issues.create_index("category")
        await db.issues.create_index("created_by")
        await db.issues.create_index([("created_at", -1)])
        await db.issues.create_index([("location.lat", 1), ("location.lng", 1)])
        await db.comments.create_index("issue_id")
        await db.comments.create_index([("issue_id", 1), ("created_at", -1)])
        logger.info("Database domain indexes created and verified")
    except Exception as e:
        logger.warning(f"Database initialization notice: {e}")

# Include router
app.include_router(api_router)

# CORS: accept both loopback aliases during local development.
frontend_origin = os.environ.get("FRONTEND_URL", "http://localhost:3000")
allowed_origins = list({
    frontend_origin,
    frontend_origin.replace("localhost", "127.0.0.1"),
    frontend_origin.replace("127.0.0.1", "localhost"),
})
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

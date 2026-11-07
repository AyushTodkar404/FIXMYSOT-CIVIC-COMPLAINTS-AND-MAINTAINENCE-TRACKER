# Fix My Spot — Civic Complaints & Maintenance Tracker

Fix My Spot is a modern, transparent civic engagement and municipal maintenance tracking system. It bridges the communication gap between citizens and municipal municipal departments by providing verified, geolocated issue reporting, automated speech-to-text transcription, real-time departmental dispatching, and two-way verified complaint resolution.

---

## Key Features

- **Geolocated Issue Reporting:** Citizens pin issues (potholes, garbage, broken streetlights, sewage, water supply, road damage) on an interactive Leaflet map with reverse geocoded street addresses.
- **Photo Evidence & Client Compression:** Before-and-after photo attachments with automatic client-side canvas downscaling (max 1280px, optimized JPEG) to ensure fast uploads and prevent database bloat.
- **AI Voice Reporting:** Instant voice transcription using OpenAI Whisper for rapid, accessible complaint submission.
- **Municipal Work Order Dispatching:** Municipal officers view tickets by status (`Submitted`, `Verified`, `Assigned`, `Inspection Scheduled`, `Work Started`, `Work Completed`, `Citizen Verification Pending`, `Closed`, `Reopened`), assign staff, and set estimated completion dates.
- **Citizen Verification Loop (OWASP BOLA-Hardened):** Officers submit photo proof when work is completed. Only the original complaint creator can verify the resolution or reopen the ticket with remarks.
- **Civic Gamification & Leaderboard:** Citizens earn points and achievement badges (`First Reporter`, `Active Citizen`, `Community Champion`) for verified submissions.
- **Public & Departmental Analytics:** Aggregated breakdown of open tickets, average resolution speed, and department performance with PDF and CSV export capabilities.
- **Multilingual Support:** Localized in English, Hindi, and Marathi.

---

## Tech Stack

- **Backend:** Python 3.12, FastAPI, Motor (Async MongoDB Driver), Pydantic v2, PyJWT, Bcrypt, Pytest & Pytest-Asyncio.
- **Frontend:** React 19, Tailwind CSS, React-Leaflet & Leaflet, Phosphor Icons (`@phosphor-icons/react`), Recharts, jsPDF & jsPDF-AutoTable.
- **Database:** MongoDB Atlas (with compound indexes on status, category, coordinates, created_at, and comments).

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- MongoDB Atlas cluster or local MongoDB instance

---

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Copy the environment configuration:
   ```bash
   cp .env.example .env
   ```
   Configure your `MONGO_URL`, `JWT_SECRET`, and initial `ADMIN_` credentials in `.env`.

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the backend server:
   ```bash
   uvicorn server:app --host 127.0.0.1 --port 8000 --reload
   ```

---

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Copy the environment configuration:
   ```bash
   cp .env.example .env
   ```

3. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

4. Start the frontend development server:
   ```bash
   npm start
   ```
   Open `http://localhost:3000` in your browser.

---

## Automated Testing

Run the backend test suite:
```bash
python -m pytest tests -v
```

The test suite validates:
- Citizen verification transitions to `Closed` or `Reopened`
- Municipal officer status transitions with photo proof
- OWASP A01 BOLA defense (verifying non-owners cannot modify or close other citizens' tickets)
- OWASP A03 Injection defense (verifying search queries escape regular expression characters against ReDoS)

---

## Security Architecture

- **Role-Based Access Control (RBAC):** Strict separation between `citizen`, `municipal`, and `admin` roles, verified on every database access.
- **Two-Step Admin Authentication:** Sensitive administrative actions require a server-verified passkey (`X-Admin-Passkey`).
- **Brute-Force Lockout:** IP and email login attempt tracking with automated 15-minute lockouts after 5 consecutive failures.
- **Query Escaping & Indexing:** All search strings are escaped via `re.escape()` to mitigate Regular Expression Denial of Service (ReDoS).

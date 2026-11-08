import os
import sys
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
import pytest
from fastapi import HTTPException

# Set test environment before importing server
os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "testdb")
os.environ.setdefault("JWT_SECRET", "test-secret-key-1234567890")

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import backend.server as server


def create_fake_db(issues_find_one=None, issues_find=None):
    """Helper to construct a fully mocked MongoDB client for unit testing."""
    find_cursor = SimpleNamespace(
        to_list=AsyncMock(return_value=[]),
        sort=MagicMock(return_value=SimpleNamespace(to_list=AsyncMock(return_value=[]))),
    )
    users_cursor = SimpleNamespace(
        to_list=AsyncMock(return_value=[{"id": "officer-1"}])
    )

    fake_issues = SimpleNamespace(
        find_one=AsyncMock(return_value=issues_find_one),
        update_one=AsyncMock(),
        insert_one=AsyncMock(),
        find=MagicMock(return_value=find_cursor),
        count_documents=AsyncMock(return_value=0),
        aggregate=MagicMock(return_value=AsyncMock()),
    )
    fake_users = SimpleNamespace(
        find_one=AsyncMock(return_value=None),
        update_one=AsyncMock(),
        insert_one=AsyncMock(),
        find=MagicMock(return_value=users_cursor),
        count_documents=AsyncMock(return_value=0),
    )
    fake_comments = SimpleNamespace(
        find=MagicMock(return_value=find_cursor),
        insert_one=AsyncMock(),
        count_documents=AsyncMock(return_value=0),
        aggregate=MagicMock(return_value=AsyncMock()),
    )
    fake_notifications = SimpleNamespace(
        insert_one=AsyncMock(),
        find=MagicMock(return_value=find_cursor),
        count_documents=AsyncMock(return_value=0),
    )

    return SimpleNamespace(
        issues=fake_issues,
        users=fake_users,
        comments=fake_comments,
        notifications=fake_notifications,
    )


@pytest.mark.asyncio
async def test_citizen_verification_transitions_to_closed_or_reopened(monkeypatch):
    existing_issue = {
        "id": "issue-2",
        "title": "Pothole in Main St",
        "status": "Work Completed",
        "created_by": "citizen-1",
        "photos": ["data:image/png;base64,before"],
        "after_photos": ["data:image/png;base64,after"],
        "history": [],
        "estimated_completion_date": None,
        "verification_status": None,
    }

    fake_db = create_fake_db(issues_find_one=existing_issue)
    monkeypatch.setattr(server, "db", fake_db)

    verified_result = await server.update_issue(
        "issue-2",
        server.IssueUpdate(status="Closed", remark="Verified", verification_status="verified"),
        current_user={"id": "citizen-1", "name": "Citizen", "role": "citizen"},
    )
    assert verified_result["status"] == "Closed"
    assert verified_result["verification_status"] == "verified"

    reopened_result = await server.update_issue(
        "issue-2",
        server.IssueUpdate(status="Reopened", remark="Needs more work", verification_status="rejected"),
        current_user={"id": "citizen-1", "name": "Citizen", "role": "citizen"},
    )
    assert reopened_result["status"] == "Reopened"
    assert reopened_result["verification_status"] == "rejected"


@pytest.mark.asyncio
async def test_update_issue_stores_after_photos_without_blocking_completion(monkeypatch):
    existing_issue = {
        "id": "issue-1",
        "title": "Streetlight off",
        "status": "Submitted",
        "created_by": "citizen-1",
        "photos": ["data:image/png;base64,before"],
        "history": [],
        "estimated_completion_date": None,
    }

    fake_db = create_fake_db(issues_find_one=existing_issue)
    monkeypatch.setattr(server, "db", fake_db)

    result = await server.update_issue(
        "issue-1",
        server.IssueUpdate(status="Work Completed", remark="All set", after_photos=["data:image/png;base64,after"]),
        current_user={"id": "officer-1", "name": "Officer", "role": "municipal"},
    )

    assert result["status"] == "Citizen Verification Pending"
    assert fake_db.issues.update_one.await_count == 1
    _, update_payload = fake_db.issues.update_one.await_args.args
    assert update_payload["$set"]["after_photos"] == ["data:image/png;base64,after"]


@pytest.mark.asyncio
async def test_bola_prevention_non_owner_cannot_verify_or_close_issue(monkeypatch):
    """OWASP A01 BOLA defense: a non-owner citizen must receive 403 Forbidden."""
    existing_issue = {
        "id": "issue-99",
        "title": "Garbage dump",
        "status": "Work Completed",
        "created_by": "legit-citizen",
        "photos": [],
        "after_photos": [],
        "history": [],
        "verification_status": "pending",
    }

    fake_db = create_fake_db(issues_find_one=existing_issue)
    monkeypatch.setattr(server, "db", fake_db)

    with pytest.raises(HTTPException) as exc_info:
        await server.update_issue(
            "issue-99",
            server.IssueUpdate(status="Closed", verification_status="verified"),
            current_user={"id": "attacker-citizen", "name": "Attacker", "role": "citizen"},
        )
    assert exc_info.value.status_code == 403
    assert "permission" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_search_sanitization_escapes_special_regex_characters(monkeypatch):
    """OWASP A03 Injection defense: special regex characters must not trigger ReDoS."""
    malicious_pattern = "((((a+)+)+)+)!"

    captured_query = {}

    class MockCursor:
        def sort(self, *args, **kwargs):
            return self
        async def to_list(self, limit):
            return []

    def mock_find(query, projection=None):
        nonlocal captured_query
        captured_query = query
        return MockCursor()

    fake_db = create_fake_db()
    fake_db.issues.find = mock_find
    monkeypatch.setattr(server, "db", fake_db)

    results = await server.get_issues(
        search=malicious_pattern,
        current_user={"id": "user-1", "role": "citizen"}
    )
    assert results == []
    # Verify that regex in query has escaped special characters (e.g. \( and \+)
    regex_used = captured_query["$or"][0]["title"]["$regex"]
    assert r"\(" in regex_used
    assert r"\+" in regex_used


@pytest.mark.asyncio
async def test_health_check_endpoint(monkeypatch):
    """Verify that /api/health queries Atlas admin ping and returns operational status."""
    fake_client = SimpleNamespace(
        admin=SimpleNamespace(
            command=AsyncMock(return_value={"ok": 1})
        )
    )
    monkeypatch.setattr(server, "client", fake_client)
    res = await server.health_check()
    assert res["status"] == "healthy"
    assert res["database"] == "connected"
    assert res["cluster"] == "MongoDB Atlas Cloud"
    assert "latency_ms" in res
    assert res["latency_ms"] >= 0


@pytest.mark.asyncio
async def test_database_diagnostics_staff_authorization(monkeypatch):
    """Staff roles (admin/municipal) can read DB diagnostics; citizens are forbidden."""
    fake_db = SimpleNamespace(
        command=AsyncMock(return_value={
            "db": "fixmyspot",
            "collections": 6,
            "objects": 94,
            "dataSize": 9600000,
            "storageSize": 18000000,
            "indexes": 22,
            "indexSize": 745000,
        })
    )
    monkeypatch.setattr(server, "db", fake_db)

    # 1. Citizen is denied
    with pytest.raises(HTTPException) as exc_info:
        await server.database_diagnostics(current_user={"id": "citizen-1", "role": "citizen"})
    assert exc_info.value.status_code == 403

    # 2. Admin is allowed
    admin_diag = await server.database_diagnostics(current_user={"id": "admin-1", "role": "admin"})
    assert admin_diag["status"] == "operational"
    assert admin_diag["collections"] == 6
    assert admin_diag["total_indexes"] == 22


@pytest.mark.asyncio
async def test_get_my_stats_counts_closed_and_resolved(monkeypatch):
    """Verify that get_my_stats counts Closed, resolved, and Work Completed issues."""
    fake_db = create_fake_db()
    # Mock count_documents: first call is total issues, second call is resolved issues
    call_counts = []
    async def mock_count_documents(query):
        call_counts.append(query)
        if "status" in query:
            return 3
        return 5

    fake_db.issues.count_documents = mock_count_documents
    monkeypatch.setattr(server, "db", fake_db)

    stats = await server.get_my_stats(
        current_user={"id": "citizen-1", "role": "citizen", "points": 50, "badges": ["Active Citizen"]}
    )
    assert stats["issues_reported"] == 5
    assert stats["issues_resolved"] == 3
    # Verify the status query used includes "Closed"
    assert "Closed" in call_counts[1]["status"]["$in"]


@pytest.mark.asyncio
async def test_require_admin_passkey_enforcement(monkeypatch):
    """Verify require_admin_passkey rejects requests without or with invalid passkey."""
    from starlette.requests import Request
    monkeypatch.setenv("ADMIN_PASSKEY", "secret-passkey-xyz")

    # Missing header
    req_missing = Request({"type": "http", "headers": []})
    with pytest.raises(HTTPException) as exc1:
        await server.require_admin_passkey(req_missing, current_user={"role": "admin"})
    assert exc1.value.status_code == 401

    # Wrong header
    req_wrong = Request({"type": "http", "headers": [(b"x-admin-passkey", b"wrong")]})
    with pytest.raises(HTTPException) as exc2:
        await server.require_admin_passkey(req_wrong, current_user={"role": "admin"})
    assert exc2.value.status_code == 403

    # Correct header
    req_valid = Request({"type": "http", "headers": [(b"x-admin-passkey", b"secret-passkey-xyz")]})
    result = await server.require_admin_passkey(req_valid, current_user={"role": "admin"})
    assert result["role"] == "admin"



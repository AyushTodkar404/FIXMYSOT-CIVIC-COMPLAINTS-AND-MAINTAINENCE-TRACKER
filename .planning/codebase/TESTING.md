# Testing & Verification Protocol: FixMySpot

## Backend Pytest Suite
```bash
cd E:\fix-my-spot
.\.venv\Scripts\python.exe -m pytest tests
```

### Coverage
- **BOLA Protection & Photo Resolution:** `tests/test_backend_photo_flow.py` verifies officer resolution photo submission, citizen verification gating, and rejection flows.
- **Async Database Mocking:** Uses unittest `AsyncMock` to isolate database transactions from external network dependencies.

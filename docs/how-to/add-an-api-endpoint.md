# Add a new API endpoint

This guide describes the standard pattern for adding a new endpoint to GNAT-gui. Every endpoint follows the same five-layer path: schema → facade → router → RBAC → audit.

---

## The pattern

```
HTTP request
    ↓
Router function           # FastAPI route handler
    ↓
Facade method             # RBAC check → GNAT core call → audit record
    ↓
gnat.analyst_services.*   # GNAT core library
    ↓
HTTP response
```

---

## Step-by-step example: add `GET /api/analysis/investigations/:id/timeline`

### 1. Define request/response schemas

Add Pydantic models in `backend/gnat_gui/schemas/`. Use `ConfigDict(strict=True)` on request bodies.

```python
# backend/gnat_gui/schemas/analysis.py

from pydantic import BaseModel, ConfigDict
from datetime import datetime

class TimelineEvent(BaseModel):
    timestamp: datetime
    event_type: str
    description: str
    node_id: str | None = None

class TimelineResponse(BaseModel):
    investigation_id: str
    events: list[TimelineEvent]
```

### 2. Add the facade method

The facade lives in `backend/gnat_gui/services/`. It is responsible for exactly three things: checking permissions, calling the GNAT core service, and recording an audit event. No business logic belongs here.

```python
# backend/gnat_gui/services/analysis_facade.py

from gnat_gui.rbac.permissions import Permission
from gnat_gui.schemas.analysis import TimelineResponse

class AnalysisFacade:
    # ... existing methods ...

    def get_timeline(self, investigation_id: str, user) -> TimelineResponse:
        self.rbac.check(user, Permission.INVESTIGATION_READ_OWN)

        # Call GNAT core
        from gnat.analyst_services import analysis as gnat_analysis
        raw = gnat_analysis.get_timeline(investigation_id)

        self.audit.record(
            AuditAction.INVESTIGATION_UPDATED,  # or a new action type if warranted
            user_id=user.id,
            target_id=investigation_id,
            target_type="investigation",
        )

        return TimelineResponse(
            investigation_id=investigation_id,
            events=[TimelineEvent(**e) for e in raw],
        )
```

If you need a new `AuditAction`, add it to `backend/gnat_gui/audit/events.py`.

### 3. Add the router endpoint

```python
# backend/gnat_gui/routers/analysis.py

from gnat_gui.schemas.analysis import TimelineResponse

@router.get("/investigations/{investigation_id}/timeline", response_model=TimelineResponse)
def get_investigation_timeline(
    investigation_id: str,
    current_user: CurrentUser,
    db: DB,
    audit: Audit,
) -> TimelineResponse:
    facade = AnalysisFacade(db, audit)
    return facade.get_timeline(investigation_id, current_user)
```

The `CurrentUser`, `DB`, and `Audit` dependencies are defined in `backend/gnat_gui/deps.py` and injected automatically by FastAPI.

### 4. Write a test

```python
# backend/tests/integration/test_analysis_flow.py

def test_get_timeline(client, seeded_db):
    # login
    r = client.post("/api/auth/login", json={"username": "analyst", "password": "analystpassword123"})
    assert r.status_code == 200

    # call endpoint (with mocked GNAT core)
    with patch("gnat.analyst_services.analysis.get_timeline", return_value=[]):
        r = client.get("/api/analysis/investigations/inv-123/timeline")
    assert r.status_code == 200
    assert r.json()["investigation_id"] == "inv-123"
```

### 5. Regenerate frontend types

With the backend running:

```bash
cd frontend
npm run generate-types
```

This fetches `/openapi.json` and rewrites `src/api/generated.ts`. The new endpoint schema is now available as a TypeScript type.

See [Keep API types in sync](generate-api-types.md) for more detail.

---

## Adding a new permission

If your endpoint needs a permission that does not exist yet:

1. Add the permission string to `Permission(StrEnum)` in `backend/gnat_gui/rbac/permissions.py`
2. Add it to the appropriate roles in `ROLE_PERMISSIONS`
3. Re-run `scripts/seed.py` to update the seeded roles (or write a migration if roles are stored in the database)

---

## Checklist

Before opening a PR for a new endpoint:

- [ ] Pydantic schema defined with `strict=True` on request body
- [ ] Facade method checks the correct permission
- [ ] Facade method records an audit event
- [ ] Router function delegates to the facade (no logic in the router)
- [ ] Integration test covers the happy path and at least one RBAC rejection
- [ ] `npm run generate-types` run and `generated.ts` changes committed (or noted as gitignored)

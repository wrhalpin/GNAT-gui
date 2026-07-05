"""Shared test fixtures.

Three things make the suite honest rather than vacuously green:

1. A fake `gnat` core is installed in sys.modules before gnat_gui is imported,
   so facade/job imports resolve without the (non-PyPI) real library.
2. Each test gets a fresh in-memory SQLite database via StaticPool, so there is
   no cross-test contamination and no leftover test.db file.
3. The client is CSRF-aware (echoes the csrftoken cookie as x-csrftoken on unsafe
   requests) and the login rate limiter is disabled, so tests exercise real RBAC
   instead of tripping over CSRF/429 first.
"""

import sys
import types
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool


# --- Install a fake gnat core before gnat_gui imports it -----------------------
def _install_fake_gnat() -> None:
    if "gnat" in sys.modules:
        return

    def _mod(name: str) -> types.ModuleType:
        m = types.ModuleType(name)
        sys.modules[name] = m
        return m

    def job(name):  # real no-op decorator (MagicMock would clobber handlers)
        def deco(fn):
            return fn

        return deco

    class _Job:
        id = "test-job-id"
        status = types.SimpleNamespace(value="pending")
        result = None
        error = None
        submitted_by = None
        events: list = []
        is_terminal = True

    class JobRunner:
        def __init__(self, *a, **k):
            pass

        def submit(self, *a, **k):
            return _Job()

    class JobStore:
        def get(self, job_id):
            return None

    gnat = _mod("gnat")
    jobs = _mod("gnat.jobs")
    jobs.job = job
    jobs.JobRunner = JobRunner
    store = _mod("gnat.jobs.store")
    store.JobStore = JobStore
    jobs.store = store
    gnat.jobs = jobs

    asvc = _mod("gnat.analyst_services")
    for sub, cls in (
        ("analysis", "AnalysisService"),
        ("rules", "RulesService"),
        ("investigations", "InvestigationsService"),
    ):
        sm = _mod(f"gnat.analyst_services.{sub}")
        setattr(sm, cls, MagicMock)
        setattr(asvc, sub, sm)
    gnat.analyst_services = asvc


_install_fake_gnat()

from gnat_gui.db.base import Base  # noqa: E402
from gnat_gui.db.session import get_db  # noqa: E402
from gnat_gui.main import create_app  # noqa: E402
from gnat_gui.rate_limit import limiter  # noqa: E402


class CSRFClient(TestClient):
    """TestClient that satisfies the double-submit CSRF check automatically."""

    _SAFE = {"GET", "HEAD", "OPTIONS", "TRACE"}

    def request(self, method, url, *args, **kwargs):
        if str(method).upper() not in self._SAFE:
            token = self.cookies.get("csrftoken")
            if token:
                headers = dict(kwargs.get("headers") or {})
                headers.setdefault("x-csrftoken", token)
                kwargs["headers"] = headers
        return super().request(method, url, *args, **kwargs)


@pytest.fixture(autouse=True)
def _disable_rate_limit():
    limiter.enabled = False
    yield
    limiter.enabled = True


@pytest.fixture
def db_engine():
    # One shared in-memory connection (StaticPool) so the test session and the
    # app's request sessions see each other's committed rows.
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    engine.dispose()


@pytest.fixture
def db(db_engine):
    Session = sessionmaker(bind=db_engine, autoflush=False, autocommit=False)
    session = Session()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_engine, db):
    app = create_app()
    Session = sessionmaker(bind=db_engine, autoflush=False, autocommit=False)

    def override_get_db():
        s = Session()
        try:
            yield s
            s.commit()
        except Exception:
            s.rollback()
            raise
        finally:
            s.close()

    app.dependency_overrides[get_db] = override_get_db
    return CSRFClient(app)


@pytest.fixture
def seeded_db(db):
    from gnat_gui.auth.password import hash_password
    from gnat_gui.db.models.role import Role
    from gnat_gui.db.models.user import User
    from gnat_gui.rbac.permissions import ROLE_PERMISSIONS

    for name, perms in ROLE_PERMISSIONS.items():
        db.add(Role(name=name, permissions=list(perms)))
    db.flush()

    roles = {r.name: r for r in db.query(Role).all()}
    users = {
        "admin": ("adminpassword123", "admin"),
        "analyst": ("analystpassword123", "analyst"),
        "senior": ("seniorpassword123", "senior_analyst"),
        "viewer": ("viewerpassword123", "viewer"),
    }
    created = {}
    for username, (password, role_name) in users.items():
        u = User(
            username=username,
            hashed_password=hash_password(password),
            role_id=roles[role_name].id,
        )
        db.add(u)
        created[username] = u
    db.commit()
    return created

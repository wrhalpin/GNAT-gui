import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from gnat_gui.db.base import Base
from gnat_gui.db.session import get_db
from gnat_gui.main import create_app

TEST_DB_URL = "sqlite:///./test.db"

engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture
def client(db):
    app = create_app()

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app, raise_server_exceptions=True)


@pytest.fixture
def seeded_db(db):
    from gnat_gui.db.models.role import Role
    from gnat_gui.db.models.user import User
    from gnat_gui.auth.password import hash_password
    from gnat_gui.rbac.permissions import ROLE_PERMISSIONS

    for name, perms in ROLE_PERMISSIONS.items():
        role = Role(name=name, permissions=perms)
        db.add(role)
    db.flush()

    admin_role = db.query(Role).filter_by(name="admin").first()
    analyst_role = db.query(Role).filter_by(name="analyst").first()

    admin = User(username="admin", hashed_password=hash_password("adminpassword123"), role_id=admin_role.id)
    analyst = User(username="analyst", hashed_password=hash_password("analystpassword123"), role_id=analyst_role.id)
    db.add_all([admin, analyst])
    db.commit()
    return {"admin": admin, "analyst": analyst}

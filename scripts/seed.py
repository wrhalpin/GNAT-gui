#!/usr/bin/env python3
"""Seed default roles, an admin user, and (optionally) demo users.

Always creates the four roles and an `admin` account. When SEED_DEMO_USERS is
truthy it also creates one account per non-admin role (analyst, senior_analyst,
viewer) sharing a single password — this is what the e2e suite logs in as. Demo
users are opt-in so they never land in a production database by accident.

Env:
  ADMIN_PASSWORD     admin account password (default: changeme-please-set-env)
  SEED_DEMO_USERS    if truthy, also create analyst/senior_analyst/viewer users
  DEMO_PASSWORD      demo users' password (default: same as ADMIN_PASSWORD)
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from gnat_gui.auth.password import hash_password
from gnat_gui.db.base import Base
from gnat_gui.db.models.role import Role
from gnat_gui.db.models.user import User
from gnat_gui.db.session import SessionLocal, engine
from gnat_gui.rbac.permissions import ROLE_PERMISSIONS

DEFAULT_PASSWORD = "changeme-please-set-env"


def _truthy(value: str | None) -> bool:
    return (value or "").strip().lower() in {"1", "true", "yes", "on"}


def _ensure_user(db, username: str, password: str, role: Role) -> None:
    if db.query(User).filter_by(username=username).first():
        return
    db.add(
        User(
            username=username,
            hashed_password=hash_password(password),
            role_id=role.id,
        )
    )
    print(f"Created user: {username} ({role.name})")


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for role_name, permissions in ROLE_PERMISSIONS.items():
            if not db.query(Role).filter_by(name=role_name).first():
                db.add(Role(name=role_name, permissions=list(permissions)))
                print(f"Created role: {role_name}")
        db.flush()

        roles = {r.name: r for r in db.query(Role).all()}

        admin_password = os.environ.get("ADMIN_PASSWORD", DEFAULT_PASSWORD)
        _ensure_user(db, "admin", admin_password, roles["admin"])

        if _truthy(os.environ.get("SEED_DEMO_USERS")):
            demo_password = os.environ.get("DEMO_PASSWORD", admin_password)
            for username, role_name in (
                ("analyst", "analyst"),
                ("senior", "senior_analyst"),
                ("viewer", "viewer"),
            ):
                _ensure_user(db, username, demo_password, roles[role_name])

        db.commit()
        print("Seed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    main()

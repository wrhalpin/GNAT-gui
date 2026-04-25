#!/usr/bin/env python3
"""Seed default roles and admin user."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from gnat_gui.auth.password import hash_password
from gnat_gui.db.base import Base
from gnat_gui.db.models.role import Role
from gnat_gui.db.models.user import User
from gnat_gui.db.session import SessionLocal, engine
from gnat_gui.rbac.permissions import ROLE_PERMISSIONS

Base.metadata.create_all(bind=engine)

db = SessionLocal()

for role_name, permissions in ROLE_PERMISSIONS.items():
    existing = db.query(Role).filter_by(name=role_name).first()
    if not existing:
        db.add(Role(name=role_name, permissions=permissions))
        print(f"Created role: {role_name}")

db.flush()

admin_role = db.query(Role).filter_by(name="admin").first()
if not db.query(User).filter_by(username="admin").first():
    admin_password = os.environ.get("ADMIN_PASSWORD", "changeme-please-set-env")
    db.add(User(username="admin", hashed_password=hash_password(admin_password), role_id=admin_role.id))
    print("Created admin user (set ADMIN_PASSWORD env var to override default)")

db.commit()
db.close()
print("Seed complete.")

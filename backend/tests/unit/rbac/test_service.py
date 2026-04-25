import pytest
from fastapi import HTTPException

from gnat_gui.rbac.permissions import ROLE_PERMISSIONS, Permission
from gnat_gui.rbac.service import RBACService


@pytest.fixture
def rbac():
    return RBACService()


def test_viewer_can_read(rbac):
    perms = ROLE_PERMISSIONS["viewer"]
    rbac.check(perms, Permission.INVESTIGATION_READ_ANY)


def test_viewer_cannot_create(rbac):
    perms = ROLE_PERMISSIONS["viewer"]
    with pytest.raises(HTTPException) as exc:
        rbac.check(perms, Permission.INVESTIGATION_CREATE)
    assert exc.value.status_code == 403


def test_analyst_can_create(rbac):
    perms = ROLE_PERMISSIONS["analyst"]
    rbac.check(perms, Permission.INVESTIGATION_CREATE)


def test_analyst_cannot_materialize(rbac):
    perms = ROLE_PERMISSIONS["analyst"]
    with pytest.raises(HTTPException):
        rbac.check(perms, Permission.INVESTIGATION_MATERIALIZE)


def test_senior_analyst_can_materialize(rbac):
    perms = ROLE_PERMISSIONS["senior_analyst"]
    rbac.check(perms, Permission.INVESTIGATION_MATERIALIZE)


def test_admin_has_all_permissions(rbac):
    perms = ROLE_PERMISSIONS["admin"]
    for p in Permission:
        rbac.check(perms, p)

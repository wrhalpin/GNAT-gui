"""Import every ORM model so SQLAlchemy can resolve string-based relationships.

Importing this package (``from gnat_gui.db import models``) is enough to register all
mappers — needed by ``Base.metadata.create_all``, Alembic autogenerate, and any code
(e.g. seed.py) that triggers mapper configuration via a query.
"""

from gnat_gui.db.models.audit import AuditEvent
from gnat_gui.db.models.investigation_owner import InvestigationOwner
from gnat_gui.db.models.role import Role
from gnat_gui.db.models.session import UserSession
from gnat_gui.db.models.ui_state import UIState
from gnat_gui.db.models.user import User

__all__ = [
    "AuditEvent",
    "InvestigationOwner",
    "Role",
    "UserSession",
    "UIState",
    "User",
]

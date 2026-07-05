import uuid
from typing import TYPE_CHECKING

from sqlalchemy import JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from gnat_gui.db.base import Base

if TYPE_CHECKING:
    from gnat_gui.db.models.user import User


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    permissions: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)

    users: Mapped[list["User"]] = relationship("User", back_populates="role")  # noqa: F821

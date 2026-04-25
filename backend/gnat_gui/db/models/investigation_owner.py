import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from gnat_gui.db.base import Base


class InvestigationOwner(Base):
    """GUI-side ownership and sharing record for a GNAT investigation."""

    __tablename__ = "investigation_owners"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    investigation_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    owner_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    shared_with: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

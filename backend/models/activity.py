"""
Activity Stack Log Database Model.
"""

from typing import Any, Dict
from sqlalchemy import JSON, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.db.base import Base, UUID7PrimaryKeyMixin, TimestampMixin


class ActivityStackLog(Base, UUID7PrimaryKeyMixin, TimestampMixin):
    """
    Persistent log representing the household's activity and undo stack.
    """
    __tablename__ = "activity_stack_logs"

    household_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("households.id", ondelete="CASCADE"), nullable=False, index=True
    )
    action_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    payload: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)

    # Relationships
    household: Mapped["Household"] = relationship("Household", back_populates="activity_logs")

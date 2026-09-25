"""
Chore Database Model.
"""

from typing import Optional
from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUID7PrimaryKeyMixin, TimestampMixin


class Chore(Base, UUID7PrimaryKeyMixin, TimestampMixin):
    """
    Chore entity managed by the Circular Queue Rotation Engine.
    """
    __tablename__ = "chores"

    household_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("households.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    current_assignee_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Relationships
    household: Mapped["Household"] = relationship("Household", back_populates="chores")
    current_assignee: Mapped[Optional["User"]] = relationship("User", back_populates="assigned_chores")

"""
Household and HouseholdMember Database Models.
"""

from typing import List
from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUID7PrimaryKeyMixin, TimestampMixin


class Household(Base, UUID7PrimaryKeyMixin, TimestampMixin):
    """
    Household entity representing an apartment or shared living room.
    """
    __tablename__ = "households"

    name: Mapped[str] = mapped_column(String(255), nullable=False)

    # Relationships
    members: Mapped[List["HouseholdMember"]] = relationship(
        "HouseholdMember", back_populates="household", cascade="all, delete-orphan",
        order_by="HouseholdMember.turn_order_index"
    )
    chores: Mapped[List["Chore"]] = relationship(
        "Chore", back_populates="household", cascade="all, delete-orphan"
    )
    expenses: Mapped[List["Expense"]] = relationship(
        "Expense", back_populates="household", cascade="all, delete-orphan"
    )
    activity_logs: Mapped[List["ActivityStackLog"]] = relationship(
        "ActivityStackLog", back_populates="household", cascade="all, delete-orphan",
        order_by="desc(ActivityStackLog.created_at)"
    )


class HouseholdMember(Base, UUID7PrimaryKeyMixin, TimestampMixin):
    """
    Junction record linking a User to a Household.
    `turn_order_index` maintains the sequence in the Chore Circular Queue.
    """
    __tablename__ = "household_members"
    __table_args__ = (
        UniqueConstraint("household_id", "user_id", name="uq_household_user"),
    )

    household_id: Mapped[str] = mapped_column(String(36), ForeignKey("households.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    turn_order_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    household: Mapped["Household"] = relationship("Household", back_populates="members")
    user: Mapped["User"] = relationship("User", back_populates="household_memberships")

"""
User Database Model.
"""

from typing import List, Optional
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUID7PrimaryKeyMixin, TimestampMixin


class User(Base, UUID7PrimaryKeyMixin, TimestampMixin):
    """
    User entity supporting standard email/password, Google OAuth2,
    and Ed25519 public key cryptographic signatures.
    """
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    google_sub_id: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True, index=True)
    ed25519_public_key: Mapped[Optional[str]] = mapped_column(String(128), unique=True, nullable=True, index=True)

    # Relationships
    household_memberships: Mapped[List["HouseholdMember"]] = relationship(
        "HouseholdMember", back_populates="user", cascade="all, delete-orphan"
    )
    expenses_paid: Mapped[List["Expense"]] = relationship(
        "Expense", back_populates="payer", cascade="all, delete-orphan"
    )
    expense_splits: Mapped[List["ExpenseSplit"]] = relationship(
        "ExpenseSplit", back_populates="user", cascade="all, delete-orphan"
    )
    assigned_chores: Mapped[List["Chore"]] = relationship(
        "Chore", back_populates="current_assignee"
    )

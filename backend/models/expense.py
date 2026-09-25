"""
Expense and ExpenseSplit Database Models.
"""

from typing import List
from sqlalchemy import Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.db.base import Base, UUID7PrimaryKeyMixin, TimestampMixin


class Expense(Base, UUID7PrimaryKeyMixin, TimestampMixin):
    """
    Shared expense logged in the household ledger.
    """
    __tablename__ = "expenses"

    household_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("households.id", ondelete="CASCADE"), nullable=False, index=True
    )
    payer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)

    # Relationships
    household: Mapped["Household"] = relationship("Household", back_populates="expenses")
    payer: Mapped["User"] = relationship("User", back_populates="expenses_paid")
    splits: Mapped[List["ExpenseSplit"]] = relationship(
        "ExpenseSplit", back_populates="expense", cascade="all, delete-orphan"
    )


class ExpenseSplit(Base, UUID7PrimaryKeyMixin, TimestampMixin):
    """
    Individual split portion of an expense allocated to a roommate.
    """
    __tablename__ = "expense_splits"

    expense_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("expenses.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    split_amount: Mapped[float] = mapped_column(Float, nullable=False)

    # Relationships
    expense: Mapped["Expense"] = relationship("Expense", back_populates="splits")
    user: Mapped["User"] = relationship("User", back_populates="expense_splits")

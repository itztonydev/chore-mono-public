"""
Pydantic Schemas for Expenses, Balances, Debt Simplification, and Undo Stack.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ExpenseSplitCreate(BaseModel):
    user_id: str = Field(..., description="UUID7 ID of participating roommate")
    split_amount: float = Field(..., gt=0, description="Portion of expense owed by user")


class ExpenseCreate(BaseModel):
    household_id: str = Field(..., description="Target Household UUID7")
    payer_id: str = Field(..., description="UUID7 of roommate who paid the bill")
    amount: float = Field(..., gt=0, description="Total amount paid")
    description: str = Field(..., min_length=1, max_length=255)
    splits: List[ExpenseSplitCreate] = Field(
        ..., min_items=1, description="List of participant splits"
    )


class ExpenseSplitResponse(BaseModel):
    id: str
    expense_id: str
    user_id: str
    user_name: Optional[str] = None
    split_amount: float

    class Config:
        from_attributes = True


class ExpenseResponse(BaseModel):
    id: str
    household_id: str
    payer_id: str
    payer_name: Optional[str] = None
    amount: float
    description: str
    created_at: datetime
    splits: List[ExpenseSplitResponse] = []

    class Config:
        from_attributes = True


class BalancesResponse(BaseModel):
    household_id: str
    net_balances: Dict[str, float] = Field(
        ..., description="Hash table mapping user_id to net balance (positive = owed money, negative = owes money)"
    )
    user_names: Dict[str, str] = Field(
        default_factory=dict, description="Hash table mapping user_id to user display name"
    )
    is_balanced: bool
    total_household_spend: float


class SimplifiedTransactionVector(BaseModel):
    from_user_id: str
    from_user_name: Optional[str] = None
    to_user_id: str
    to_user_name: Optional[str] = None
    amount: float


class SimplifiedDebtResponse(BaseModel):
    household_id: str
    net_balances: Dict[str, float]
    simplified_transactions: List[SimplifiedTransactionVector]
    original_transactions_count: int
    simplified_transactions_count: int
    transactions_eliminated: int
    efficiency_gain_percent: float
    algorithm_applied: str = "Min-Cash-Flow Greedy Directed Graph Reduction"


class UndoResponse(BaseModel):
    success: bool
    undone_action_type: Optional[str] = None
    message: str
    sarcastic_alert: Optional[str] = None
    remaining_stack_size: int

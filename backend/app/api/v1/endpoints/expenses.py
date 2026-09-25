"""
Expense & Debt Management API Endpoints:
- Record shared expenses & splits in Hash Tables
- Calculate net balance vector
- Run Directed Graph Min-Cash-Flow Debt Simplification
- Undo most recent household action (Stack LIFO Engine)
"""

from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from app.core.uuid7 import uuid7_str
from app.db.session import get_db
from app.dsa_engines.activity_stack import ActionType
from app.dsa_engines.graph_debt_simplifier import DebtSimplificationEngine
from app.dsa_engines.sarcastic_alerts import SarcasticAlertSystem
from app.models.activity import ActivityStackLog
from app.models.chore import Chore
from app.models.expense import Expense, ExpenseSplit
from app.models.household import Household, HouseholdMember
from app.models.user import User
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseResponse,
    ExpenseSplitResponse,
    BalancesResponse,
    SimplifiedDebtResponse,
    SimplifiedTransactionVector,
    UndoResponse,
)

router = APIRouter(prefix="/expenses", tags=["Expenses & Debt Simplification"])


@router.post("/", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(req: ExpenseCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a shared expense and allocate splits across roommates.
    Uses Hash Maps to track allocations and pushes mutation onto the Undo Stack.
    """
    # Verify Household
    h_res = await db.execute(select(Household).where(Household.id == req.household_id))
    if not h_res.scalars().first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found.")

    # Sarcastic Alert validation: $0 expense or splitting only with oneself
    if req.amount <= 0:
        alert = SarcasticAlertSystem.get_invalid_expense_alert(req.amount, "Zero or negative amount")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=alert)

    # Check if user is only splitting with themselves
    participant_ids = {s.user_id for s in req.splits}
    if len(participant_ids) == 1 and req.payer_id in participant_ids:
        alert = SarcasticAlertSystem.get_invalid_expense_alert(req.amount, "Self-owed split")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=alert)

    # Verify split amounts roughly match total
    total_split = sum(s.split_amount for s in req.splits)
    if abs(total_split - req.amount) > 0.05:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Split amounts sum (${total_split:.2f}) does not match expense amount (${req.amount:.2f}).",
        )

    # Create Expense Entity
    expense_id = uuid7_str()
    expense = Expense(
        id=expense_id,
        household_id=req.household_id,
        payer_id=req.payer_id,
        amount=req.amount,
        description=req.description,
    )
    db.add(expense)

    # Create Splits
    splits_models = []
    splits_payload = []
    for s in req.splits:
        split_id = uuid7_str()
        split_obj = ExpenseSplit(
            id=split_id,
            expense_id=expense_id,
            user_id=s.user_id,
            split_amount=s.split_amount,
        )
        splits_models.append(split_obj)
        db.add(split_obj)
        splits_payload.append({"id": split_id, "user_id": s.user_id, "split_amount": s.split_amount})

    # Record onto Activity Stack Log
    activity_log = ActivityStackLog(
        id=uuid7_str(),
        household_id=req.household_id,
        action_type=ActionType.CREATE_EXPENSE.value,
        payload={
            "expense_id": expense_id,
            "payer_id": req.payer_id,
            "amount": req.amount,
            "description": req.description,
            "splits": splits_payload,
        },
    )
    db.add(activity_log)

    await db.commit()
    await db.refresh(expense)

    # Fetch payer name & user names for response
    u_res = await db.execute(select(User).where(User.id == req.payer_id))
    payer = u_res.scalars().first()

    return ExpenseResponse(
        id=expense.id,
        household_id=expense.household_id,
        payer_id=expense.payer_id,
        payer_name=payer.full_name if payer else None,
        amount=expense.amount,
        description=expense.description,
        created_at=expense.created_at,
        splits=[
            ExpenseSplitResponse(
                id=s.id,
                expense_id=s.expense_id,
                user_id=s.user_id,
                split_amount=s.split_amount,
            )
            for s in splits_models
        ],
    )


@router.get("/{household_id}/balances", response_model=BalancesResponse)
async def get_household_balances(household_id: str, db: AsyncSession = Depends(get_db)):
    """
    Retrieve net balance vector using Hash Maps (Dictionaries).
    Returns net amount owed to or by each roommate.
    """
    # Fetch all members
    m_res = await db.execute(
        select(HouseholdMember)
        .options(selectinload(HouseholdMember.user))
        .where(HouseholdMember.household_id == household_id)
    )
    members = m_res.scalars().all()
    all_member_ids = [m.user_id for m in members]
    user_names = {m.user_id: m.user.full_name for m in members if m.user}

    # Fetch all expenses with splits
    e_res = await db.execute(
        select(Expense)
        .options(selectinload(Expense.splits))
        .where(Expense.household_id == household_id)
    )
    expenses = e_res.scalars().all()

    expenses_data = []
    total_spend = 0.0
    for exp in expenses:
        total_spend += exp.amount
        expenses_data.append(
            {
                "payer_id": exp.payer_id,
                "amount": exp.amount,
                "splits": [
                    {"user_id": s.user_id, "split_amount": s.split_amount}
                    for s in exp.splits
                ],
            }
        )

    net_balances = DebtSimplificationEngine.compute_net_balances(
        expenses_data, all_member_ids=all_member_ids
    )

    is_balanced = abs(sum(net_balances.values())) < 0.05

    return BalancesResponse(
        household_id=household_id,
        net_balances=net_balances,
        user_names=user_names,
        is_balanced=is_balanced,
        total_household_spend=round(total_spend, 2),
    )


@router.get("/{household_id}/simplify", response_model=SimplifiedDebtResponse)
async def simplify_household_debts(household_id: str, db: AsyncSession = Depends(get_db)):
    """
    Min-Cash-Flow Greedy Directed Graph Algorithm.
    Simplifies multi-party debt vectors into minimal settlement transactions.
    """
    # Fetch all members & expenses
    m_res = await db.execute(
        select(HouseholdMember)
        .options(selectinload(HouseholdMember.user))
        .where(HouseholdMember.household_id == household_id)
    )
    members = m_res.scalars().all()
    all_member_ids = [m.user_id for m in members]
    user_names = {m.user_id: m.user.full_name for m in members if m.user}

    e_res = await db.execute(
        select(Expense)
        .options(selectinload(Expense.splits))
        .where(Expense.household_id == household_id)
    )
    expenses = e_res.scalars().all()

    expenses_data = [
        {
            "payer_id": exp.payer_id,
            "amount": exp.amount,
            "splits": [
                {"user_id": s.user_id, "split_amount": s.split_amount}
                for s in exp.splits
            ],
        }
        for exp in expenses
    ]

    res = DebtSimplificationEngine.simplify_debts(expenses_data, all_member_ids)

    simplified_txs = [
        SimplifiedTransactionVector(
            from_user_id=t.from_user,
            from_user_name=user_names.get(t.from_user, "Roommate"),
            to_user_id=t.to_user,
            to_user_name=user_names.get(t.to_user, "Roommate"),
            amount=t.amount,
        )
        for t in res.simplified_transactions
    ]

    return SimplifiedDebtResponse(
        household_id=household_id,
        net_balances=res.net_balances,
        simplified_transactions=simplified_txs,
        original_transactions_count=res.original_transactions_count,
        simplified_transactions_count=res.simplified_transactions_count,
        transactions_eliminated=res.transactions_eliminated,
        efficiency_gain_percent=res.efficiency_gain_percent,
    )


@router.post("/{household_id}/undo", response_model=UndoResponse)
async def undo_last_activity(household_id: str, db: AsyncSession = Depends(get_db)):
    """
    Undo Engine: Pops the top item from the activity stack log (LIFO)
    and executes reversing mutations in the database.
    """
    # Query most recent activity log
    res = await db.execute(
        select(ActivityStackLog)
        .where(ActivityStackLog.household_id == household_id)
        .order_by(ActivityStackLog.created_at.desc())
    )
    top_log = res.scalars().first()

    if not top_log:
        sarcastic_msg = SarcasticAlertSystem.get_empty_undo_alert()
        return UndoResponse(
            success=False,
            undone_action_type=None,
            message="No recent actions available to undo.",
            sarcastic_alert=sarcastic_msg,
            remaining_stack_size=0,
        )

    action_type = top_log.action_type
    payload = top_log.payload

    if action_type == ActionType.CREATE_EXPENSE.value:
        expense_id = payload.get("expense_id")
        desc = payload.get("description", "Unknown Expense")
        amount = payload.get("amount", 0.0)

        if expense_id:
            await db.execute(delete(Expense).where(Expense.id == expense_id))
            message = f"Reversed creation of expense '{desc}' (${amount:.2f})."
        else:
            message = "Reversed expense entry."

    elif action_type == ActionType.ROTATE_CHORE.value:
        chore_id = payload.get("chore_id")
        prev_assignee = payload.get("previous_assignee_id")
        chore_title = payload.get("chore_title", "Chore")

        if chore_id and prev_assignee:
            c_res = await db.execute(select(Chore).where(Chore.id == chore_id))
            chore = c_res.scalars().first()
            if chore:
                chore.current_assignee_id = prev_assignee
            message = f"Reversed rotation of chore '{chore_title}'. Pointer returned to previous assignee."
        else:
            message = "Reversed chore rotation."
    else:
        message = f"Reversed action: {action_type}."

    # Pop from persistent stack log
    await db.delete(top_log)
    await db.commit()

    # Count remaining stack frames
    count_res = await db.execute(
        select(ActivityStackLog).where(ActivityStackLog.household_id == household_id)
    )
    remaining_count = len(count_res.scalars().all())

    return UndoResponse(
        success=True,
        undone_action_type=action_type,
        message=message,
        sarcastic_alert=None,
        remaining_stack_size=remaining_count,
    )


@router.get("/{household_id}/history", response_model=List[ExpenseResponse])
async def list_expenses_history(household_id: str, db: AsyncSession = Depends(get_db)):
    """
    List all recorded expenses and their splits for the household ledger.
    """
    res = await db.execute(
        select(Expense)
        .options(selectinload(Expense.splits), selectinload(Expense.payer))
        .where(Expense.household_id == household_id)
        .order_by(Expense.created_at.desc())
    )
    expenses = res.scalars().all()

    result = []
    for exp in expenses:
        result.append(
            ExpenseResponse(
                id=exp.id,
                household_id=exp.household_id,
                payer_id=exp.payer_id,
                payer_name=exp.payer.full_name if exp.payer else "Roommate",
                amount=exp.amount,
                description=exp.description,
                created_at=exp.created_at,
                splits=[
                    ExpenseSplitResponse(
                        id=s.id,
                        expense_id=s.expense_id,
                        user_id=s.user_id,
                        split_amount=s.split_amount,
                    )
                    for s in exp.splits
                ],
            )
        )
    return result


@router.get("/{household_id}/stack")
async def get_activity_stack(household_id: str, db: AsyncSession = Depends(get_db)):
    """
    Inspect raw LIFO activity stack frames for the household.
    """
    res = await db.execute(
        select(ActivityStackLog)
        .where(ActivityStackLog.household_id == household_id)
        .order_by(ActivityStackLog.created_at.desc())
    )
    logs = res.scalars().all()

    return {
        "household_id": household_id,
        "stack_size": len(logs),
        "frames": [
            {
                "id": l.id,
                "action_type": l.action_type,
                "payload": l.payload,
                "created_at": l.created_at.isoformat(),
            }
            for l in logs
        ],
    }

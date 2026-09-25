"""
Chore Management API Endpoints:
- List household chores & active assignees
- Create chore
- Circular Queue Rotation with Sarcastic Alert System
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from backend.core.uuid7 import uuid7_str
from backend.db.session import get_db
from backend.dsa_engines.circular_queue import ChoreCircularQueue
from backend.dsa_engines.sarcastic_alerts import SarcasticAlertSystem
from backend.dsa_engines.activity_stack import ActionType
from backend.models.activity import ActivityStackLog
from backend.models.chore import Chore
from backend.models.household import Household, HouseholdMember
from backend.models.user import User
from backend.schemas.chore import (
    ChoreCreate,
    ChoreResponse,
    ChoreRotateRequest,
    ChoreRotateResponse,
)

router = APIRouter(prefix="/chores", tags=["Chores & Circular Queue"])


@router.post("/", response_model=ChoreResponse, status_code=status.HTTP_201_CREATED)
async def create_chore(req: ChoreCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a new household chore and assign to starting roommate or circular queue head.
    """
    # Verify household exists
    hh_res = await db.execute(select(Household).where(Household.id == req.household_id))
    hh = hh_res.scalars().first()
    if not hh:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found.")

    assignee_id = req.initial_assignee_id
    if not assignee_id:
        # Default to first member in circular queue
        m_res = await db.execute(
            select(HouseholdMember)
            .where(HouseholdMember.household_id == req.household_id)
            .order_by(HouseholdMember.turn_order_index)
        )
        first_member = m_res.scalars().first()
        if first_member:
            assignee_id = first_member.user_id

    chore = Chore(
        id=uuid7_str(),
        household_id=req.household_id,
        title=req.title,
        description=req.description,
        current_assignee_id=assignee_id,
    )
    db.add(chore)
    await db.commit()
    await db.refresh(chore)

    # Fetch assignee name
    assignee_name = None
    if chore.current_assignee_id:
        u_res = await db.execute(select(User).where(User.id == chore.current_assignee_id))
        user = u_res.scalars().first()
        if user:
            assignee_name = user.full_name

    return ChoreResponse(
        id=chore.id,
        household_id=chore.household_id,
        title=chore.title,
        description=chore.description,
        current_assignee_id=chore.current_assignee_id,
        current_assignee_name=assignee_name,
        created_at=chore.created_at,
    )


@router.get("/{household_id}", response_model=List[ChoreResponse])
async def list_household_chores(household_id: str, db: AsyncSession = Depends(get_db)):
    """
    List all chores for a given household along with their current assignees.
    """
    result = await db.execute(
        select(Chore)
        .options(selectinload(Chore.current_assignee))
        .where(Chore.household_id == household_id)
        .order_by(Chore.created_at)
    )
    chores = result.scalars().all()

    response = []
    for c in chores:
        response.append(
            ChoreResponse(
                id=c.id,
                household_id=c.household_id,
                title=c.title,
                description=c.description,
                current_assignee_id=c.current_assignee_id,
                current_assignee_name=c.current_assignee.full_name if c.current_assignee else None,
                created_at=c.created_at,
            )
        )
    return response


@router.post("/{chore_id}/rotate", response_model=ChoreRotateResponse)
async def rotate_chore(
    chore_id: str,
    req: ChoreRotateRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Circular Queue Turn Rotation:
    - Advances pointer to next member in fair rotation order.
    - If user attempts to skip turn or marks chore incomplete, fires a sarcastic alert.
    - Commits operation to persistent ActivityStackLog for undo support.
    """
    # Load chore
    c_res = await db.execute(
        select(Chore)
        .options(selectinload(Chore.current_assignee))
        .where(Chore.id == chore_id)
    )
    chore = c_res.scalars().first()
    if not chore:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chore not found.")

    # Load household members in turn order
    m_res = await db.execute(
        select(HouseholdMember)
        .options(selectinload(HouseholdMember.user))
        .where(HouseholdMember.household_id == chore.household_id)
        .order_by(HouseholdMember.turn_order_index)
    )
    members = m_res.scalars().all()

    if not members:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Household has no registered members to rotate chores through.",
        )

    member_ids = [m.user_id for m in members]
    member_names = {m.user_id: m.user.full_name for m in members if m.user}

    # Initialize Circular Queue
    curr_idx = 0
    if chore.current_assignee_id and chore.current_assignee_id in member_ids:
        curr_idx = member_ids.index(chore.current_assignee_id)

    queue = ChoreCircularQueue(members=member_ids, current_index=curr_idx)

    previous_assignee_id = chore.current_assignee_id
    previous_assignee_name = member_names.get(previous_assignee_id, "Unknown Roommate")

    sarcastic_alert: str | None = None

    # Check for premature rotation / turn skip attempt
    if req.skip_turn or not req.completed:
        sarcastic_alert = SarcasticAlertSystem.get_premature_rotation_alert(
            chore_title=chore.title, user_name=previous_assignee_name
        )

    # Perform Circular Queue shift
    new_assignee_id, new_idx = queue.rotate_forward()
    new_assignee_name = member_names.get(new_assignee_id, "Unknown Roommate")

    # Update database record
    chore.current_assignee_id = new_assignee_id

    # Push to Activity Stack for Undo functionality
    activity_log = ActivityStackLog(
        id=uuid7_str(),
        household_id=chore.household_id,
        action_type=ActionType.ROTATE_CHORE.value,
        payload={
            "chore_id": chore.id,
            "chore_title": chore.title,
            "previous_assignee_id": previous_assignee_id,
            "new_assignee_id": new_assignee_id,
            "previous_index": curr_idx,
            "new_index": new_idx,
            "completed": req.completed,
            "skip_turn": req.skip_turn,
        },
    )
    db.add(activity_log)
    await db.commit()
    await db.refresh(chore)

    return ChoreRotateResponse(
        chore_id=chore.id,
        chore_title=chore.title,
        previous_assignee_id=previous_assignee_id,
        previous_assignee_name=previous_assignee_name,
        new_assignee_id=new_assignee_id,
        new_assignee_name=new_assignee_name,
        rotation_successful=True,
        sarcastic_alert=sarcastic_alert,
        queue_state=queue.to_dict(),
    )

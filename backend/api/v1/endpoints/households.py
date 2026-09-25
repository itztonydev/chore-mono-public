"""
Household & Membership API Endpoints.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from backend.core.uuid7 import uuid7_str
from backend.db.session import get_db
from backend.models.household import Household, HouseholdMember
from backend.models.user import User
from backend.schemas.household import (
    HouseholdCreate,
    HouseholdMemberAdd,
    HouseholdMemberResponse,
    HouseholdResponse,
)

router = APIRouter(prefix="/households", tags=["Households & Memberships"])


@router.post("/", response_model=HouseholdResponse, status_code=status.HTTP_201_CREATED)
async def create_household(req: HouseholdCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a new household / apartment group.
    """
    hh = Household(id=uuid7_str(), name=req.name)
    db.add(hh)
    await db.commit()
    await db.refresh(hh)

    return HouseholdResponse(
        id=hh.id,
        name=hh.name,
        created_at=hh.created_at,
        members=[],
    )


@router.get("/{household_id}", response_model=HouseholdResponse)
async def get_household(household_id: str, db: AsyncSession = Depends(get_db)):
    """
    Get household profile and members in turn order index.
    """
    res = await db.execute(
        select(Household)
        .options(
            selectinload(Household.members).selectinload(HouseholdMember.user)
        )
        .where(Household.id == household_id)
    )
    hh = res.scalars().first()
    if not hh:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found.")

    members_resp = [
        HouseholdMemberResponse(
            id=m.id,
            household_id=m.household_id,
            user_id=m.user_id,
            turn_order_index=m.turn_order_index,
            user_full_name=m.user.full_name if m.user else None,
            user_email=m.user.email if m.user else None,
        )
        for m in hh.members
    ]

    return HouseholdResponse(
        id=hh.id,
        name=hh.name,
        created_at=hh.created_at,
        members=members_resp,
    )


@router.post("/{household_id}/members", response_model=HouseholdMemberResponse, status_code=status.HTTP_201_CREATED)
async def add_household_member(
    household_id: str,
    req: HouseholdMemberAdd,
    db: AsyncSession = Depends(get_db),
):
    """
    Add a user to a household and assign next index in Circular Queue.
    """
    # Verify user & household
    u_res = await db.execute(select(User).where(User.id == req.user_id))
    user = u_res.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    h_res = await db.execute(select(Household).where(Household.id == household_id))
    hh = h_res.scalars().first()
    if not hh:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found.")

    # Check if already member
    ex_res = await db.execute(
        select(HouseholdMember).where(
            HouseholdMember.household_id == household_id,
            HouseholdMember.user_id == req.user_id,
        )
    )
    if ex_res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already a member of this household.",
        )

    # Compute next turn order index if not supplied
    if req.turn_order_index is None:
        count_res = await db.execute(
            select(HouseholdMember).where(HouseholdMember.household_id == household_id)
        )
        existing_count = len(count_res.scalars().all())
        order_idx = existing_count
    else:
        order_idx = req.turn_order_index

    member = HouseholdMember(
        id=uuid7_str(),
        household_id=household_id,
        user_id=req.user_id,
        turn_order_index=order_idx,
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)

    return HouseholdMemberResponse(
        id=member.id,
        household_id=member.household_id,
        user_id=member.user_id,
        turn_order_index=member.turn_order_index,
        user_full_name=user.full_name,
        user_email=user.email,
    )

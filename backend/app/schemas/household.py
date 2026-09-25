"""
Pydantic Schemas for Household and Member Management.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class HouseholdCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Apartment or house title")


class HouseholdMemberAdd(BaseModel):
    user_id: str = Field(..., description="UUID7 ID of user to add")
    turn_order_index: Optional[int] = Field(None, description="Position index in circular queue")


class HouseholdMemberResponse(BaseModel):
    id: str
    household_id: str
    user_id: str
    turn_order_index: int
    user_full_name: Optional[str] = None
    user_email: Optional[str] = None

    class Config:
        from_attributes = True


class HouseholdResponse(BaseModel):
    id: str
    name: str
    created_at: datetime
    members: List[HouseholdMemberResponse] = []

    class Config:
        from_attributes = True

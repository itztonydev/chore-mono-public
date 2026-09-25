"""
Pydantic Schemas for Chore Management and Circular Queue Operations.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ChoreCreate(BaseModel):
    household_id: str = Field(..., description="Target Household UUID7")
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    initial_assignee_id: Optional[str] = Field(None, description="Optional starting member UUID7")


class ChoreRotateRequest(BaseModel):
    completed: bool = Field(True, description="Whether current chore duty was satisfactorily completed")
    skip_turn: bool = Field(False, description="Whether the assignee attempted to skip their turn")
    notes: Optional[str] = None


class ChoreResponse(BaseModel):
    id: str
    household_id: str
    title: str
    description: Optional[str] = None
    current_assignee_id: Optional[str] = None
    current_assignee_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ChoreRotateResponse(BaseModel):
    chore_id: str
    chore_title: str
    previous_assignee_id: Optional[str] = None
    previous_assignee_name: Optional[str] = None
    new_assignee_id: Optional[str] = None
    new_assignee_name: Optional[str] = None
    rotation_successful: bool
    sarcastic_alert: Optional[str] = None
    queue_state: Dict[str, Any]

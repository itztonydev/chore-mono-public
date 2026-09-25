"""
API v1 Router Definition.
Aggregates Authentication, Chores, Expenses, and Households endpoints.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, chores, expenses, households

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(households.router)
api_router.include_router(chores.router)
api_router.include_router(expenses.router)

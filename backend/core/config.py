"""
Application Configuration and Environment Settings.
"""

from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    PROJECT_NAME: str = "Roommate Chore & Expense Roulette"
    API_V1_STR: str = "/api/v1"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = (
        "Production-ready FastAPI backend for roommate chore rotation (Circular Queue), "
        "expense ledger (Hash Tables), debt simplification (Directed Graph Min-Cash-Flow), "
        "and recent action undo stack with dynamic sarcastic alert responses."
    )

    # Security & JWT
    SECRET_KEY: str = Field(
        default="09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7",
        description="Cryptographic secret key for signing JWT tokens"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./roommate_roulette.db",
        description="Async SQLite database connection URL"
    )

    # Google OAuth
    GOOGLE_CLIENT_ID: str = Field(
        default="roommate-roulette-google-oauth-client.apps.googleusercontent.com",
        description="Google OAuth2 Client ID"
    )

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

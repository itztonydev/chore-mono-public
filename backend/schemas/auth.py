"""
Pydantic Schemas for Authentication and User Identity.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password with minimum 6 characters")
    full_name: str = Field(..., min_length=1, max_length=255)
    ed25519_public_key: Optional[str] = Field(None, description="Optional 32-byte Ed25519 public key in hex format")


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    credential_token: str = Field(..., description="Google ID Token or OAuth access token")
    email: Optional[EmailStr] = Field(None, description="Fallback email if validating in mock/dev mode")
    full_name: Optional[str] = Field(None, description="Display name for Google user")
    target_user_id: Optional[str] = Field(
        None,
        description="Optional existing user UUID7 to attach Google auth to as an alternative login method",
    )


class LinkGoogleAuthRequest(BaseModel):
    user_id: Optional[str] = Field(
        None,
        description="Target existing user UUID7 to link Google auth to (or resolved from Bearer token)",
    )
    credential_token: str = Field(
        ...,
        description="Google OAuth2 ID Token or credential exchange token",
    )
    email: Optional[EmailStr] = Field(
        None,
        description="Optional Google email address associated with the credential",
    )
    full_name: Optional[str] = Field(
        None,
        description="Optional Google account display name",
    )


class LinkGoogleAuthResponse(BaseModel):
    status: str = "success"
    message: str = "Google account successfully linked as an alternative login method."
    user_id: str
    email: str
    full_name: str
    google_sub_id: str
    available_login_methods: List[str]
    access_token: str
    token_type: str = "bearer"


class UnlinkGoogleAuthRequest(BaseModel):
    user_id: Optional[str] = Field(
        None,
        description="User UUID7 to unlink Google auth from (or resolved from Bearer token)",
    )


class AuthMethodsResponse(BaseModel):
    user_id: str
    email: str
    full_name: str
    has_password: bool
    has_ed25519: bool
    ed25519_public_key: Optional[str] = None
    has_google_auth: bool
    google_sub_id: Optional[str] = None
    available_login_methods: List[str]


class Ed25519ChallengeRequest(BaseModel):
    user_id: Optional[str] = None
    public_key: Optional[str] = Field(None, description="Hex encoded 32-byte Ed25519 public key")


class Ed25519ChallengeResponse(BaseModel):
    challenge: str
    message_to_sign: str
    expires_in_seconds: int = 300


class Ed25519LoginRequest(BaseModel):
    public_key: str = Field(..., description="Ed25519 public key in hex format (64 chars)")
    challenge: str = Field(..., description="Challenge string previously issued by server")
    signature: str = Field(..., description="Cryptographic signature in hex format (128 chars)")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    full_name: str
    ed25519_public_key: Optional[str] = None
    google_sub_id: Optional[str] = None
    available_login_methods: Optional[List[str]] = None


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    google_sub_id: Optional[str] = None
    ed25519_public_key: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

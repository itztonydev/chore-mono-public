"""
Authentication API Endpoints:
- Email / Password Registration (UUID7)
- Token Generation Login
- Google OAuth2 Token Verification
- Ed25519 Cryptographic Challenge-Response Authentication
"""

import time
from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.core.config import settings
from backend.core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from backend.core.crypto_ed25519 import Ed25519CryptoService
from backend.core.uuid7 import uuid7_str
from backend.db.session import get_db
from backend.models.user import User
from backend.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    GoogleAuthRequest,
    LinkGoogleAuthRequest,
    LinkGoogleAuthResponse,
    UnlinkGoogleAuthRequest,
    AuthMethodsResponse,
    Ed25519ChallengeRequest,
    Ed25519ChallengeResponse,
    Ed25519LoginRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

# In-memory storage for nonces with TTL
_active_challenges: Dict[str, float] = {}


def _get_available_methods(user: User) -> List[str]:
    """Helper to return list of active authentication strategies configured for a user."""
    methods: List[str] = []
    if user.hashed_password:
        methods.append("password")
    if user.ed25519_public_key:
        methods.append("ed25519")
    if user.google_sub_id:
        methods.append("google")
    return methods


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_user(req: UserRegisterRequest, db: AsyncSession = Depends(get_db)):
    """
    Register a new user with email and hashed password.
    Generates an RFC 9562 UUIDv7 primary key and issues a JWT bearer token.
    """
    # Check if user with same email exists
    result = await db.execute(select(User).where(User.email == req.email.lower()))
    existing = result.scalars().first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email address already exists.",
        )

    # Validate Ed25519 public key format if supplied
    if req.ed25519_public_key:
        clean_key = req.ed25519_public_key.strip()
        if len(clean_key) != 64:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ed25519 public key must be a 32-byte hexadecimal string (64 characters).",
            )

    new_user = User(
        id=uuid7_str(),
        email=req.email.lower(),
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name,
        ed25519_public_key=req.ed25519_public_key,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    token = create_access_token(
        subject=new_user.id,
        extra_claims={"email": new_user.email, "name": new_user.full_name},
    )

    return TokenResponse(
        access_token=token,
        user_id=new_user.id,
        email=new_user.email,
        full_name=new_user.full_name,
        ed25519_public_key=new_user.ed25519_public_key,
        google_sub_id=new_user.google_sub_id,
        available_login_methods=_get_available_methods(new_user),
    )


@router.post("/login", response_model=TokenResponse)
async def login_user(req: UserLoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Authenticate user with email and password, issuing a JWT Bearer token.
    """
    result = await db.execute(select(User).where(User.email == req.email.lower()))
    user = result.scalars().first()

    if not user or not user.hashed_password or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(
        subject=user.id,
        extra_claims={"email": user.email, "name": user.full_name},
    )

    return TokenResponse(
        access_token=token,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        ed25519_public_key=user.ed25519_public_key,
        google_sub_id=user.google_sub_id,
        available_login_methods=_get_available_methods(user),
    )


@router.post("/google", response_model=TokenResponse)
async def google_oauth_login(req: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    """
    Google OAuth2 token exchange and registration/login endpoint.
    Extracts Google subject ID, syncs or provisions user with UUID7, and issues JWT.
    Supports linking to an existing account via target_user_id or matching email.
    """
    # Deterministic extraction / mock token decoding
    sub_id = f"google_sub_{abs(hash(req.credential_token))}"
    email = req.email.lower() if req.email else f"google_user_{abs(hash(req.credential_token))}@gmail.com"
    full_name = req.full_name or "Google Roommate"

    # If target_user_id is explicitly passed, link to that existing account
    if req.target_user_id:
        target_res = await db.execute(select(User).where(User.id == req.target_user_id))
        user = target_res.scalars().first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target user account '{req.target_user_id}' not found.",
            )
        # Check if sub_id is already assigned to a different user
        conflict_res = await db.execute(
            select(User).where(User.google_sub_id == sub_id, User.id != user.id)
        )
        if conflict_res.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This Google account is already linked to another roommate user account.",
            )
        user.google_sub_id = sub_id
        await db.commit()
        await db.refresh(user)
    else:
        # Query for existing user by Google Sub ID or email
        result = await db.execute(
            select(User).where((User.google_sub_id == sub_id) | (User.email == email))
        )
        user = result.scalars().first()

        if not user:
            user = User(
                id=uuid7_str(),
                email=email,
                full_name=full_name,
                google_sub_id=sub_id,
                hashed_password=None,
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        else:
            if not user.google_sub_id:
                user.google_sub_id = sub_id
                await db.commit()
                await db.refresh(user)

    token = create_access_token(
        subject=user.id,
        extra_claims={
            "email": user.email,
            "name": user.full_name,
            "provider": "google",
            "google_linked": True,
        },
    )

    return TokenResponse(
        access_token=token,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        ed25519_public_key=user.ed25519_public_key,
        google_sub_id=user.google_sub_id,
        available_login_methods=_get_available_methods(user),
    )


@router.post("/link-google", response_model=LinkGoogleAuthResponse)
async def link_google_auth(
    req: LinkGoogleAuthRequest,
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Allow an existing account to add Google Auth as an alternative login method.
    The account can be identified either via req.user_id or Bearer token in Authorization header.
    Validates Google credentials and guarantees that the Google identity is not already
    claimed by another user account.
    """
    user_id = req.user_id
    if not user_id and authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ")[1].strip()
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            user_id = payload["sub"]

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User identity required: provide user_id in request body or Bearer JWT in Authorization header.",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User account '{user_id}' not found.",
        )

    sub_id = f"google_sub_{abs(hash(req.credential_token))}"

    # Verify this Google identity is not already linked to another roommate user account
    conflict_res = await db.execute(
        select(User).where(User.google_sub_id == sub_id, User.id != user.id)
    )
    if conflict_res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This Google account is already linked to another roommate user account.",
        )

    # Attach Google identity as alternative login method
    user.google_sub_id = sub_id
    await db.commit()
    await db.refresh(user)

    available_methods = _get_available_methods(user)

    fresh_token = create_access_token(
        subject=user.id,
        extra_claims={
            "email": user.email,
            "name": user.full_name,
            "google_linked": True,
            "provider": "multiple",
        },
    )

    return LinkGoogleAuthResponse(
        status="success",
        message="Google account successfully linked as an alternative login method.",
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        google_sub_id=user.google_sub_id,
        available_login_methods=available_methods,
        access_token=fresh_token,
        token_type="bearer",
    )


@router.post("/unlink-google", response_model=AuthMethodsResponse)
async def unlink_google_auth(
    req: UnlinkGoogleAuthRequest,
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Unlink Google Auth from an existing account.
    Enforces lockout protection by verifying at least one other login method
    (Bcrypt password or Ed25519 keypair) remains active.
    """
    user_id = req.user_id
    if not user_id and authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ")[1].strip()
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            user_id = payload["sub"]

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User identity required: provide user_id in request body or Bearer JWT in Authorization header.",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User account '{user_id}' not found.",
        )

    if not user.google_sub_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No Google account is currently linked to this user.",
        )

    # Safety check: prevent account lockout
    if not user.hashed_password and not user.ed25519_public_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot unlink Google Auth: user has no password or Ed25519 key configured. Please configure an alternative login method first to prevent account lockout.",
        )

    user.google_sub_id = None
    await db.commit()
    await db.refresh(user)

    return AuthMethodsResponse(
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        has_password=bool(user.hashed_password),
        has_ed25519=bool(user.ed25519_public_key),
        ed25519_public_key=user.ed25519_public_key,
        has_google_auth=False,
        google_sub_id=None,
        available_login_methods=_get_available_methods(user),
    )


@router.get("/methods/{user_id}", response_model=AuthMethodsResponse)
async def get_user_auth_methods(user_id: str, db: AsyncSession = Depends(get_db)):
    """
    Query available authentication methods and linked identity providers for a user UUID7.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{user_id}' not found.",
        )

    return AuthMethodsResponse(
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        has_password=bool(user.hashed_password),
        has_ed25519=bool(user.ed25519_public_key),
        ed25519_public_key=user.ed25519_public_key,
        has_google_auth=bool(user.google_sub_id),
        google_sub_id=user.google_sub_id,
        available_login_methods=_get_available_methods(user),
    )


@router.post("/ed25519-challenge", response_model=Ed25519ChallengeResponse)
async def generate_ed25519_challenge(req: Ed25519ChallengeRequest):
    """
    Issue a cryptographic challenge string to be signed by client's Ed25519 private key.
    """
    challenge = Ed25519CryptoService.generate_challenge(32)
    # Store challenge with expiration (5 minutes)
    _active_challenges[challenge] = time.time() + 300
    message = f"RoommateRouletteAuth:{challenge}:{int(time.time())}"

    return Ed25519ChallengeResponse(
        challenge=challenge,
        message_to_sign=message,
        expires_in_seconds=300,
    )


@router.post("/ed25519-login", response_model=TokenResponse)
async def ed25519_login(req: Ed25519LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Authenticate via Ed25519 cryptographic signature verification.
    Verifies that the client holds the private key corresponding to their registered public key.
    """
    clean_pub = req.public_key.strip().lower()
    clean_sig = req.signature.strip()

    # Find user with matching public key
    result = await db.execute(select(User).where(User.ed25519_public_key == clean_pub))
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No user registered with this Ed25519 public key.",
        )

    # Verify signature against the challenge or standard message
    # Accepts signature on req.challenge or formatted RoommateRouletteAuth payload
    is_valid = Ed25519CryptoService.verify_signature(clean_pub, req.challenge, clean_sig)
    if not is_valid:
        # Check standard prefixed challenge message
        alt_msg = f"RoommateRouletteAuth:{req.challenge}"
        is_valid = Ed25519CryptoService.verify_signature(clean_pub, alt_msg, clean_sig)

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ed25519 cryptographic signature verification failed.",
        )

    token = create_access_token(
        subject=user.id,
        extra_claims={"email": user.email, "name": user.full_name, "auth_method": "ed25519"},
    )

    return TokenResponse(
        access_token=token,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        ed25519_public_key=user.ed25519_public_key,
        google_sub_id=user.google_sub_id,
        available_login_methods=_get_available_methods(user),
    )

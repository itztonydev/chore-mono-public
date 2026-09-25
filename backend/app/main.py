"""
Roommate Chore & Expense Roulette - FastAPI Application Entrypoint.

Features:
- Circular Queue Chore Rotation Engine
- Directed Graph Min-Cash-Flow Debt Simplification Engine
- LIFO Activity & Undo Stack
- Dynamic Sarcastic Alert System
- RFC 9562 UUIDv7 Primary Keys
- Ed25519 Cryptographic Signatures & JWT Auth
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.db.session import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Initializes database tables on startup.
    """
    await init_db()
    yield


SWAGGER_UI_PARAMETERS = {
    "defaultModelsExpandDepth": 2,
    "defaultModelExpandDepth": 2,
    "displayRequestDuration": True,
    "docExpansion": "list",
    "filter": True,
    "showExtensions": True,
    "showCommonExtensions": True,
    "persistAuthorization": True,
    "tryItOutEnabled": True,
    "syntaxHighlight.theme": "monokai",
}

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="""
# 🎲 Roommate Chore & Expense Roulette API Documentation

A production-ready FastAPI backend designed by a Principal Backend Engineer.
Features specialized Data Structures & Algorithms (DSA), RFC 9562 UUIDv7 time-ordered identifiers,
Ed25519 Public Key Cryptography, and a Dynamic Sarcastic Alert System.

---

### 🏛 Algorithmic Guarantees & Complexity:
- **Chore Rotation**: **Circular Queue (Ring Buffer)** — $O(1)$ turn advancement via `(current_index + 1) % N`, rollback capability, and lookahead.
- **Expense Ledger**: **Hash Tables** — $O(1)$ net balance computations with strict zero-sum conservation ($\\sum balances = 0$).
- **Debt Simplification**: **Min-Cash-Flow Greedy Directed Graph Algorithm** — Compresses $O(N^2)$ pairwise debts into $\\le N - 1$ minimal settlement vectors.
- **Recent Actions**: **LIFO Stack** — $O(1)$ push and pop of mutation snapshots with reversible state rollback.
- **Sarcastic Alert System**: Dynamic humor matrices intercepting skipped chores, empty undo pops, and zero-dollar splits.
- **Identity & Keys**: RFC 9562 UUIDv7 millisecond time-ordered monotonic keys & Ed25519 asymmetric signatures.
""",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    swagger_ui_parameters=SWAGGER_UI_PARAMETERS,
    lifespan=lifespan,
    contact={
        "name": "Roommate Roulette Engineering Team",
        "email": "engineering@roommate-roulette.local",
        "url": "https://github.com/roommate-roulette",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
    openapi_tags=[
        {
            "name": "Authentication",
            "description": "Bcrypt password hashing, PyJWT bearer tokens, Google OAuth2, and Ed25519 public key cryptographic challenge-response authentication.",
        },
        {
            "name": "Households & Memberships",
            "description": "Household entity management and circular queue turn index registration for roommates.",
        },
        {
            "name": "Chores & Circular Queue",
            "description": "Deterministic circular queue ring buffer duty rotations, lookahead assignment prediction, and Sarcastic Alert triggers.",
        },
        {
            "name": "Expenses & Debt Simplification",
            "description": "Hash Table expense ledger, greedy directed graph debt simplification (Min-Cash-Flow), and LIFO activity undo stack.",
        },
        {
            "name": "Health",
            "description": "System liveness and readiness monitoring endpoints.",
        },
    ],
)


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    from fastapi.openapi.utils import get_openapi
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
        tags=app.openapi_tags,
        servers=[
            {"url": "http://localhost:8000", "description": "Local Development Server"},
            {"url": "https://api.roommate-roulette.local", "description": "Production API Gateway"},
        ],
    )

    # Security Schemes
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Enter PyJWT Bearer token returned by /api/v1/auth/login or /api/v1/auth/register",
        },
        "Ed25519Signature": {
            "type": "apiKey",
            "in": "header",
            "name": "X-Ed25519-Signature",
            "description": "64-byte Ed25519 cryptographic signature over server challenge nonce",
        },
        "Ed25519PublicKey": {
            "type": "apiKey",
            "in": "header",
            "name": "X-Ed25519-Public-Key",
            "description": "32-byte Ed25519 hex public key of the authenticated user",
        },
    }

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
async def health_check():
    """System health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }


@app.get("/", tags=["Root"])
async def root_info():
    """Root info endpoint directing to OpenAPI documentation."""
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "openapi_url": "/openapi.json",
        "dsa_features": [
            "Chore Circular Queue (Fair Ring Rotation)",
            "Expense Ledger Hash Tables (O(1) Net Balances)",
            "Min-Cash-Flow Directed Graph Debt Simplification (O(N log N))",
            "LIFO Activity & Undo Stack",
            "Sarcastic Alert System",
            "Ed25519 Public Key Cryptographic Signatures",
            "RFC 9562 UUIDv7 Primary Keys",
        ],
    }


# Include API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

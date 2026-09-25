# Roommate Roulette // Backend Service

Asynchronous Python / FastAPI backend engine powering chore distribution, graph debt simplification, cryptographic Ed25519 authentication, and activity history stack.

## Architecture & Core Modules

- **`backend/main.py`**: FastAPI application entry point, lifecycle events, and CORS routing.
- **`backend/api/v1/`**: RESTful API endpoints for `auth`, `households`, `chores`, and `expenses`.
- **`backend/dsa_engines/`**:
  - `circular_queue.py`: O(1) step round-robin chore distribution.
  - `graph_debt_simplifier.py`: Directed cash flow minimization algorithm.
  - `activity_stack.py`: LIFO undo/redo activity management.
  - `sarcastic_alerts.py`: Context-aware household alert generation.
- **`backend/core/`**: UUIDv7 generator, Ed25519 signature verification, JWT, and settings.
- **`backend/db/`**: SQLAlchemy 2.0 async engine and SQLite/PostgreSQL schema definitions.
- **`backend/models/` & `schemas/`**: Pydantic v2 validation models and ORM entities.
- **`backend/tests/`**: Comprehensive test suite for auth and DSA algorithms.

## Running Tests

```bash
python3 -m unittest discover -s backend/tests
```

## Running the Server Locally

```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

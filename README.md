# Monorepo: Roommate Roulette (Backend) & SIH Buddy (Frontend)

A structured monorepo separating the Python/FastAPI backend service and the React/Tailwind frontend platform, each equipped with its own dedicated configurations, dependencies, test suites, and build lifecycles.

---

## 📁 Monorepo Architecture

```
.
├── backend/                       # Python FastAPI Backend Service
│   ├── main.py                    # Application entry point, CORS, and router mount
│   ├── api/v1/                    # RESTful endpoints (auth, chores, expenses, households)
│   ├── core/                      # UUIDv7 generator, Ed25519 cryptography, security
│   ├── db/                        # SQLAlchemy async engine, base mixins, seeders
│   ├── dsa_engines/               # Circular Queue, Debt Simplifier, Activity Stack
│   ├── models/                    # SQLAlchemy database models
│   ├── schemas/                   # Pydantic v2 validation schemas
│   ├── tests/                     # Backend unit test suite (16 tests)
│   ├── requirements.txt           # Backend Python dependencies
│   ├── pyproject.toml             # Backend project & pytest configuration
│   ├── Dockerfile                 # Backend container definition
│   └── README.md                  # Backend architecture documentation
│
├── frontend/                      # React + Tailwind CSS Web Application
│   ├── index.html                 # HTML entry point with typography preconnects
│   ├── package.json               # Frontend package definition & dependencies
│   ├── tsconfig.json              # Frontend TypeScript configuration
│   ├── vite.config.ts             # Frontend Vite configuration
│   ├── tailwind.config.js         # Brutalist theme configuration & Tokyo Night tokens
│   ├── Dockerfile                 # Frontend container definition
│   ├── README.md                  # Frontend design & WCAG specifications
│   └── src/                       # Frontend Source Code
│       ├── main.tsx               # Client entry point
│       ├── App.tsx                # Main view router & state management
│       ├── index.css              # Global styles, fonts, and @theme configuration
│       ├── components/            # Brutalist SIH Buddy & interactive views
│       ├── data/                  # Problem statements & mock data
│       └── dsa/                   # TypeScript implementations of DSA engines
│
├── docker-compose.yml             # Orchestration for backend & frontend services
├── package.json                   # Root monorepo configuration & unified scripts
├── tsconfig.json                  # Root TypeScript configuration
├── vite.config.ts                 # Root Vite configuration delegating to frontend
├── .env.example                   # Environment variable template
└── README.md                      # Monorepo documentation
```

---

## ⚙️ Separate Configurations Overview

| Workspace | Key Config Files | Runtime / Toolchain |
|---|---|---|
| **Backend** | `backend/requirements.txt`, `backend/pyproject.toml`, `backend/Dockerfile` | Python 3.10+, FastAPI, Uvicorn, SQLAlchemy |
| **Frontend** | `frontend/package.json`, `frontend/tsconfig.json`, `frontend/vite.config.ts`, `frontend/tailwind.config.js` | React 19, TypeScript, Vite, Tailwind CSS v4 |
| **Monorepo Root** | `package.json`, `docker-compose.yml`, `tsconfig.json`, `vite.config.ts` | npm workspaces, Docker Compose |

---

## 🚀 Quick Start Commands

### Root Workspace Commands

```bash
# Run frontend dev server on port 3000
npm run dev

# Build frontend production bundle
npm run build

# Type check frontend
npm run lint

# Run all tests (Backend unit tests + Frontend type check)
npm run test

# Run backend unit tests only
npm run test:backend
```

### Backend Service (Independent)

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run unit tests
python3 -m unittest discover -s tests

# Start FastAPI server
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Service (Independent)

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Build production bundle
npm run build

# Type check
npm run lint
```

### Docker Compose (Multi-Service)

```bash
docker-compose up --build
```
- Backend runs at `http://localhost:8000` (Swagger docs at `/docs`)
- Frontend runs at `http://localhost:3000`

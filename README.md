# Smart Helpdesk with Agentic Triage

A production‑ready MERN application where users raise support tickets and an in‑node agent triages them by classifying, retrieving KB articles, drafting a reply, and deciding whether to auto‑resolve or assign to a human. Secure by default (HttpOnly cookies, input validation, rate limits) with real‑time notifications and full auditability.

## Architecture (ASCII) + Rationale

```
                               ┌──────────────────────────┐
                               │        Browser UI        │
                               │  React + Vite + TS       │
                               │  React Router            │
                               │  React Query             │
                               │  Cookie-based auth       │
                               └───────────┬──────────────┘
                                           │  HTTPS (withCredentials)
                                           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         Express API (TypeScript)                          │
│  - Auth (JWT access + refresh in HttpOnly cookies)                        │
│  - Tickets, KB, Config, Audit routes                                      │
│  - Zod validation, helmet, rate limits, CORS (narrow)                     │
│  - SSE notifications (/api/notifications)                                 │
│  - AgentService (plan → classify → retrieve → draft → decision)           │
│  - Unified traceId across triage + audit                                  │
│  - Optional Redis pub/sub for multi-instance notifications                 │
└───────────────┬──────────────────────────────┬────────────────────────────┘
                │                              │
                │ Mongoose                     │ Pub/Sub (optional)
                ▼                              ▼
        ┌──────────────┐                ┌──────────────┐
        │   MongoDB    │                │    Redis     │
        │ Users/Tickets│                │ notifications │
        │ Articles/Audit│               │ channel       │
        └──────────────┘                └──────────────┘
```

Why this architecture:
- HttpOnly cookies for access/refresh tokens prevent XSS token theft and simplify CORS with `withCredentials`.
- In-node AgentService keeps latency low; deterministic stub ensures zero external key dependency.
- SSE provides simple, resource-light real-time updates; Redis pub/sub enables horizontal scale.
- Zod validation, rate limits, helmet, and narrow CORS enforce secure defaults.

## Setup and Run

### Prerequisites
- Node.js 20+
- Docker Desktop with Compose

### 1) Clone
```bash
git clone <your-repo-url>
cd work
```

### 2) Environment
Create the following `.env` files (or export env vars).

api/.env
```env
NODE_ENV=development
PORT=8080
MONGO_URI=mongodb://localhost:27017/helpdesk

# Auth cookies
JWT_SECRET=change-me
REFRESH_JWT_SECRET=change-me-too
ACCESS_TOKEN_TTL_SEC=900         # 15 minutes
REFRESH_TOKEN_TTL_SEC=2592000    # 30 days
COOKIE_DOMAIN=localhost
COOKIE_SECURE=false

# CORS
CORS_ORIGIN=http://localhost:5173

# Agent
STUB_MODE=true
AUTO_CLOSE_ENABLED=true
CONFIDENCE_THRESHOLD=0.78

# Optional
REDIS_URL=
```

client/.env
```env
# For local dev use Vite proxy to /api; in Docker set to http://api:8080/api
VITE_API_URL=http://localhost:8080/api
```

### 3) Run with Docker (recommended)
```bash
# From repo root
docker compose -f compose.yml up -d --build
```
Services:
- Client: http://localhost:5173
- API: http://localhost:8080
- MongoDB: mongodb://localhost:27017

Seeding:
- A one-time seed runs after API is healthy (compose `seed` service).
- To seed manually:
  ```bash
  cd api && npm run build && node dist/seed.js
  ```

Default logins:
- Admin: `admin@example.com` / `admin123`
- Agent: `agent@example.com` / `agent123`
- User: `user@example.com` / `user123`

### 4) Local development (without Docker)
```bash
# Terminal A (API)
cd api
npm install
npm run dev

# Terminal B (Client)
cd client
npm install
npm run dev
```

## How the Agent Works + Guardrails

Pipeline:
1) Plan: deterministic state machine: classify → retrieve KB → draft → decision.
2) Classify: heuristics map keywords to {billing|tech|shipping|other}; returns confidence.
3) Retrieve KB: keyword search over articles; returns top 3 ids + scores.
4) Draft: templated reply with numbered citations of article titles.
5) Decision: if `autoCloseEnabled && confidence ≥ threshold` → store suggestion, create agent reply, mark ticket resolved, log AUTO_CLOSED; else mark `waiting_human` and assign.
6) Logging: every step appends `AuditLog` with consistent `traceId` (UUID) and metadata.

Guardrails and reliability:
- Input/output schemas validated with Zod.
- Timeouts and retry with backoff around agent operations.
- Idempotency key for triage jobs to avoid duplicate processing.
- Rate limits on auth and mutation endpoints; helmet security headers; CORS narrowed to dev origin.
- HttpOnly cookies for tokens; no tokens in `localStorage`.
- SSE + optional Redis pub/sub for scalable notifications.

## Testing & Coverage

Backend (Vitest + Supertest + mongodb-memory-server):
```bash
cd api
npm test
# or coverage
npx vitest run --coverage
```
Coverage targets (representative):
- Auth register/login, JWT validation
- KB search
- Ticket creation triggers triage
- Agent decision (auto-close vs waiting_human)
- Audit trail contains unified traceId

Frontend (Vitest + RTL + JSDOM):
```bash
cd client
npm test
# or coverage
npx vitest run --coverage
```
Coverage targets (representative):
- Rendering and role-guarded navigation
- Form validation (login, ticket creation)
- Tickets list interactions and filters

### Run tests via Docker

Use the test compose file to run API and Client tests inside Node 20 containers.

Run both suites sequentially (recommended):
```bash
sh scripts/test.sh
# or (PowerShell with Git Bash installed)
bash scripts/test.sh
```

Run individually:
```bash
# API tests
docker compose -f compose.test.yml up --build --abort-on-container-exit --exit-code-from api-tests api-tests

# Client tests
docker compose -f compose.test.yml up --build --abort-on-container-exit --exit-code-from client-tests client-tests

# Cleanup containers
docker compose -f compose.test.yml down -v
```

## API Surface (Summary)

Auth
- POST `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`, GET `/api/auth/me`

Knowledge Base
- GET `/api/kb?query=...` (staff), POST/PUT/DELETE `/api/kb` (admin), GET `/api/kb/:id`

Tickets
- POST `/api/tickets`, GET `/api/tickets?status=&assignedToMe=&my=1`, GET `/api/tickets/:id`
- POST `/api/tickets/:id/reply`, POST `/api/tickets/:id/assign`

Agent
- POST `/api/agent/triage`, GET `/api/agent/suggestion/:ticketId`

Config
- GET `/api/config`, PUT `/api/config` (admin)

Audit
- GET `/api/tickets/:id/audit`

Notifications
- GET `/api/notifications` (SSE stream)

## Deployment

Environment
- Set strong `JWT_SECRET`, `REFRESH_JWT_SECRET`, and production `MONGO_URI`.
- Set `CORS_ORIGIN` to your deployed client origin.
- Set `COOKIE_SECURE=true` and `COOKIE_DOMAIN` to your domain.

Build & run
```bash
docker compose -f compose.yml up -d --build
```

## Troubleshooting
- Client hits 5173 but API 8080 unreachable: ensure Vite proxy or `VITE_API_URL` matches API.
- Mongo connection refused in dev: API falls back to mongodb-memory-server (non-prod) if local Mongo not running.
- Infinite redirects/refreshes: using cookies, avoid manual 401 redirects in the client.


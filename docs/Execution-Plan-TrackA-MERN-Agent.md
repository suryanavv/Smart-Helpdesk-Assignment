## Step-by-Step Execution Plan — Track A (MERN Only)

This plan assumes heavy use of AI coding tools: Cursor (chat + edits), GitHub Copilot (inline), Lovable, and Bolt for quick scaffolds/snippets. Follow steps sequentially; each step is independently verifiable.

### 0) Repo & Tooling
- Initialize monorepo structure:
  - `client/` (Vite + React + TypeScript)
  - `api/` (Node 20 + Express + TypeScript + Mongoose)
  - `docker/` (compose files)
  - `scripts/` (seed, fixtures)
  - `docs/` (PRD, plan, README assets)
- Add baseline configs: ESLint, Prettier, tsconfig, EditorConfig, Husky + lint‑staged.
- Use Cursor to generate base configurations quickly; Copilot to fill boilerplate.

### 1) Data Models & Mongoose Schemas (api)
- Create models for `User`, `Article`, `Ticket`, `AgentSuggestion`, `AuditLog`, `Config` per PRD.
- Add indexes: articles (text index on title/body/tags), tickets (createdBy, status), audit (ticketId, traceId).
- Implement Zod or Joi validation schemas for all write routes.

### 2) Auth & Security
- Implement `POST /api/auth/register` and `POST /api/auth/login`.
- Hash passwords (bcrypt). JWT with expiry + refresh or short‑lived token + refresh endpoint.
- Middleware: `requireAuth`, `requireRole('admin'|'agent'|'user')`, CORS, rate‑limit auth & mutations.
- Central error handler; hide stack traces from clients.

### 3) KB APIs
- Endpoints: GET search, POST, PUT, DELETE with role checks.
- Implement keyword search (Mongo text index or simple regex fallback). Return top N hits with snippets.

### 4) Tickets APIs
- Endpoints: create, list (filters: status/my tickets), detail.
- Actions: `POST /:id/reply` (agent), `POST /:id/assign` (admin/agent).
- Emit `AuditLog` entries for ticket creation and actions.

### 5) Agentic Workflow in Node
- Define `LLMProvider` interface: `classify(text)`, `draft(text, articles)`.
- Implement `StubLLMProvider` honoring `STUB_MODE=true` with keyword heuristics and templated draft.
- Implement `AgentPlanner`: decide steps (classify → retrieve → draft → decision) and produce a `traceId`.
- Implement `AgentService.triage(ticketId)`:
  1. Start traceId, log `TICKET_RECEIVED`.
  2. Classify → log `AGENT_CLASSIFIED`.
  3. Retrieve KB → log `KB_RETRIEVED`.
  4. Draft → log `DRAFT_GENERATED`.
  5. Decision: if auto‑close conditions met → persist suggestion, create agent reply, set status `resolved`, log `AUTO_CLOSED`; else set `waiting_human`, assign to agent, log `ASSIGNED_TO_HUMAN`.
- Expose routes:
  - POST `/api/agent/triage` (internal) to trigger triage for a ticket.
  - GET `/api/agent/suggestion/:ticketId` to fetch last suggestion.
- Optional: BullMQ with Redis for background triage; otherwise in‑process queue.

### 6) Config & Settings
- Model and CRUD for `Config` (single document).
- GET/PUT `/api/config` restricted to admin.

### 7) Observability & Health
- Structured JSON logger (pino/winston) including `traceId`, `ticketId`, latency.
- Request logging middleware.
- `/healthz` and `/readyz` endpoints.

### 8) Client (Vite + React)
- Pages:
  - Auth: Login/Register
  - KB: List, Create/Edit (admin only)
  - Tickets: List (filters), Detail (conversation thread, suggestion, audit timeline)
  - Settings: Config (admin)
- Routing: React Router; state: Context/Zustand.
- Components: forms with validation, tables/lists with empty/error/loading states, toasts.
- Role‑based menus and route guards; persist token securely (httpOnly cookie or localStorage with care).
- Integrate API clients with fetch/axios, handle errors globally.

### 9) Realtime (Optional Stretch)
- SSE or WebSocket to push ticket status changes and audit events to Ticket Detail page.

### 10) DevOps
- Docker Compose services: `client`, `api`, `mongo` (and `redis` if using BullMQ).
- One‑command run: `docker compose up`.
- Seed script to insert users (admin/agent/user), KB, and tickets.

### 11) Testing
- Backend (Jest/Vitest):
  - Auth (register/login)
  - KB search
  - Ticket create
  - Agent triage decision
  - Audit logging
- Frontend (Vitest/RTL):
  - Renders pages and forms
  - Form validation
  - Role‑based guard behavior
- Fixtures for stub outputs and seed data.

### 12) AI‑Assisted Workflow (Cursor, Lovable, Bolt, Copilot)
- Cursor: Drive implementation via chat prompts per step; use “edit file” with tight instructions; ask for tests next.
- Copilot: Inline completions; accept only clear, typed code.
- Lovable/Bolt: Use to scaffold React components (forms, tables), API boilerplate, Docker compose template.
- PRs: Small commits; draft messages with AI; keep diffs focused.

### 13) Timeline (36–48 hours reference)
- Hour 0–2: Monorepo, Docker, configs, scaffolds.
- Hour 2–6: Models, auth, KB APIs.
- Hour 6–10: Tickets APIs, audit.
- Hour 10–16: Agentic workflow (planner, stub, triage routes).
- Hour 16–20: Client auth + layout + tickets list/detail.
- Hour 20–26: KB UI, settings.
- Hour 26–30: Tests backend/frontend, seed/fixtures.
- Hour 30–34: Polish UX states, logs, healthz/readyz.
- Hour 34–36+: README, Loom, deploy.

### 14) Deliverables Checklist
- Code repo; Docker Compose one‑command run.
- README with architecture diagram, setup, agent explanation, testing.
- Seed data and fixtures.
- Tests passing locally; CI checks.
- Short Loom demo.



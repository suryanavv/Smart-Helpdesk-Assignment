## PRD — Smart Helpdesk with Agentic Triage (Track A — MERN Only)

### 1. Overview
- **Goal**: Build an end‑to‑end helpdesk where users raise tickets and an in‑Node agent triages them by classifying, retrieving KB articles, drafting a reply, and auto‑closing when confident or routing to a human agent.
- **Scope**: MERN only (React + Node/Express + MongoDB). Agentic workflow implemented in Node; LLM usage optional via deterministic stub.
- **Primary Users**: End User, Support Agent, Admin.

### 2. Problem Statement & Objectives
- **Problem**: Support teams spend time manually classifying tickets, searching KB, and drafting responses.
- **Objectives**:
  - Automate ticket triage with traceable steps and safe defaults.
  - Provide a clean UI for users, agents, and admins.
  - Ship with deterministic behavior (no API keys required) via a stub provider.

### 3. In‑Scope (Functional Requirements)
1) **Auth & Roles**
   - JWT‑based auth (register, login) with roles: `admin`, `agent`, `user`.
2) **KB Management (Admin)**
   - CRUD articles: `title`, `body`, `tags[]`, `status` in {draft, published}.
   - Publish/unpublish.
3) **Ticket Lifecycle (User)**
   - Create tickets (`title`, `description`, optional `category`, attachments by URL).
   - View list/detail with timeline of actions.
4) **Agentic Triage (System)**
   - Steps: classify → retrieve KB → draft → decision.
   - Persist `AgentSuggestion` and `AuditLog` for each step with a single `traceId`.
5) **Agent Review (Support Agent)**
   - Review/edit draft, send reply, reopen/close ticket.
6) **Notifications**
   - In‑app notification and/or email stub on status changes.
7) **Config (Admin)**
   - Toggle `autoCloseEnabled`, set `confidenceThreshold`, `slaHours`.

### 4. Out of Scope (for initial release)
- External identity providers (OAuth).
- Rich attachments parsing beyond simple `.txt/.md` URL text extraction.
- Multi‑tenant orgs and SSO.

### 5. Data Model
- `User`: `_id`, `name`, `email` (unique), `passwordHash`, `role`, `createdAt`.
- `Article`: `_id`, `title`, `body`, `tags: string[]`, `status: 'draft'|'published'`, `updatedAt`.
- `Ticket`: `_id`, `title`, `description`, `category: 'billing'|'tech'|'shipping'|'other'`, `status: 'open'|'triaged'|'waiting_human'|'resolved'|'closed'`, `createdBy`, `assignee`, `agentSuggestionId?`, `createdAt`, `updatedAt`.
- `AgentSuggestion`: `_id`, `ticketId`, `predictedCategory`, `articleIds: string[]`, `draftReply`, `confidence: number`, `autoClosed: boolean`, `modelInfo` { `provider`, `model`, `promptVersion`, `latencyMs` }, `createdAt`.
- `AuditLog`: `_id`, `ticketId`, `traceId`, `actor: 'system'|'agent'|'user'`, `action`, `meta (JSON)`, `timestamp`.
- `Config`: `_id`, `autoCloseEnabled: boolean`, `confidenceThreshold: number`, `slaHours: number`.

### 6. API (Minimum)
- Auth
  - POST `/api/auth/register` → `{ token }`
  - POST `/api/auth/login` → `{ token }`
- KB
  - GET `/api/kb?query=...`
  - POST `/api/kb` (admin)
  - PUT `/api/kb/:id` (admin)
  - DELETE `/api/kb/:id` (admin)
- Tickets
  - POST `/api/tickets` (user)
  - GET `/api/tickets` (filters)
  - GET `/api/tickets/:id`
  - POST `/api/tickets/:id/reply` (agent)
  - POST `/api/tickets/:id/assign` (admin/agent)
- Agent
  - POST `/api/agent/triage` (internal) → enqueue/trigger triage for `ticketId`
  - GET `/api/agent/suggestion/:ticketId`
- Config
  - GET `/api/config` / PUT `/api/config` (admin)
- Audit
  - GET `/api/tickets/:id/audit`

### 7. Agentic Workflow (Required)
1) **Plan**: Hardcoded plan or simple state machine: classify → retrieve → draft → decision.
2) **Classify**: Heuristic stub using keywords:
   - billing: `refund`, `invoice`, `payment`, `charge`
   - tech: `error`, `bug`, `stack`, `crash`, `500`
   - shipping: `delivery`, `shipment`, `tracking`, `package`
   - else: other.
   - Output: `{ predictedCategory, confidence }` where confidence reflects keyword match strength.
3) **Retrieve KB**: Keyword search over title/body/tags. Return top 3 article IDs with snippet scores.
4) **Draft Reply**: Template‑based reply with numbered citations to selected KB articles.
   - Output: `{ draftReply, citations: [articleId...] }`.
5) **Decision**: If `autoCloseEnabled` and `confidence ≥ threshold`, create agent reply, mark ticket `resolved`, set `autoClosed=true`; else set `waiting_human`, assign to agent.
6) **Logging**: Append `AuditLog` events for each step using a consistent `traceId` (UUID) for the pipeline.

### 8. UX Requirements
- Pages: Login/Register; KB List+Editor (admin); Ticket List; Ticket Detail (conversation + suggestion + audit timeline); Settings (config).
- State: Persist JWT securely; role‑based navigation/guards.
- UX Craft: Clear CTAs, accessible components (keyboard + ARIA), loading skeletons, error toasts, responsive layout.
- Nice‑to‑have: Filters/search, optimistic updates, realtime (SSE/WebSocket) for ticket updates.

### 9. Non‑Functional Requirements
- **Security**: Input validation (Zod/Joi), rate limit auth/mutations, narrow CORS, hide stack traces, do not log secrets, JWT expiry + refresh strategy.
- **Reliability**: Timeouts for agent calls, retries with backoff, idempotency keys for triage jobs.
- **Observability**: Structured JSON logs including `traceId`, `ticketId`, latency; request logging middleware; `/healthz` and `/readyz` endpoints.
- **Performance**: P95 API latency ≤ 200ms for non‑agent endpoints; triage end‑to‑end ≤ 2s in stub mode.
- **DevOps**: Docker Compose for `client`, `api`, `mongo` (and `redis` if BullMQ used). One‑command run.

### 10. LLM Usage & Deterministic Stub
- Implement `LLMProvider` interface in Node with `classify(text)` and `draft(text, articles)`.
- `STUB_MODE=true` enables deterministic heuristic behavior without external keys.
- If keys exist, allow switching to real provider via env; prompts checked into repo or `.prompt.md`.

### 11. Acceptance Criteria
1) Register/login and create a ticket as a normal user.
2) Ticket creation triggers triage and persists an `AgentSuggestion`.
3) If confidence ≥ threshold and auto‑close on, ticket is resolved with reply visible to user.
4) Else ticket is `waiting_human`; an agent can review, edit, and send reply.
5) Audit timeline shows ordered steps with timestamps and `traceId`.
6) KB search returns relevant articles for simple queries.
7) App runs with `STUB_MODE=true` and no external keys.
8) `docker compose up` runs the stack; README includes envs and seed steps.

### 12. Risks & Mitigations
- Misclassification by stub → Make thresholds configurable; enable manual override by agent.
- Long triage path → Use timeouts + retries and surface progress logs in UI.
- Data integrity (audit) → Append‑only events; never mutate past events; consistent `traceId`.
- Security pitfalls → Centralized validation & error handler; rate limits; secure cookie options when applicable.

### 13. Rollout & DevX
- Seed script to create sample users (admin/agent/user), KB, and tickets.
- Automated tests: Backend (Jest/Vitest ≥5), Frontend (Vitest/RTL ≥3).
- CI checks: lint, typecheck, test.
- Short Loom demo (≤5 min): KB add → ticket create → triage → auto‑close/human review.



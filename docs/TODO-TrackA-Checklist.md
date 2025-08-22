## TODO — Track A (MERN Only) Build Checklist

- [x] Init repo and folders: `client/`, `api/`, `docker/`, `scripts/`, `docs/`
- [x] Add base configs: ESLint, Prettier, tsconfig, EditorConfig, Husky + lint-staged
- [x] Docker Compose (client, api, mongo) one-command run

### Backend (api)
- [x] Express + TypeScript bootstrap, env loader, CORS, rate limit, error handler
- [x] Mongo connection, healthz/readyz endpoints
- [x] Mongoose models: `User`, `Article`, `Ticket`, `AgentSuggestion`, `AuditLog`, `Config`
- [x] Indexes: articles text index; tickets status/createdBy; audit ticketId/traceId
- [x] Validation (Zod/Joi) for all POST/PUT

Auth
- [x] POST /api/auth/register (bcrypt hash, JWT issue)
- [x] POST /api/auth/login (JWT)
- [x] Middlewares: `requireAuth`, `requireRole`, request logging

KB
- [x] GET /api/kb?query=...
- [x] POST /api/kb (admin)
- [x] PUT /api/kb/:id (admin)
- [x] DELETE /api/kb/:id (admin)

Tickets
- [x] POST /api/tickets (user) → create AuditLog: TICKET_CREATED
- [x] GET /api/tickets (filters)
- [x] GET /api/tickets/:id
- [x] POST /api/tickets/:id/reply (agent) → AuditLog: REPLY_SENT
- [x] POST /api/tickets/:id/assign (admin/agent) → AuditLog: ASSIGNED

Agent
- [x] Interface `LLMProvider`: classify(text), draft(text, articles)
- [x] StubLLMProvider (STUB_MODE=true): keyword heuristics, templated draft
- [x] AgentPlanner: plan steps, create `traceId`
- [x] AgentService.triage(ticketId): classify → retrieve → draft → decision
- [x] POST /api/agent/triage (internal)
- [x] GET /api/agent/suggestion/:ticketId
- [x] Audit logs per step with consistent `traceId`

Config
- [x] Model + GET/PUT /api/config (admin)

Observability
- [x] Structured logs (traceId, ticketId, latency)
- [x] Timeouts/retries for agent steps

### Frontend (client)
- [x] Vite + React + TypeScript + Router + Context
- [x] Auth pages: Login/Register
- [x] KB pages: List + Editor (admin only)
- [x] Tickets pages: List (basic create/list), Detail (suggestion + audit timeline)
- [x] Settings page: Config (admin)
- [x] Role-based menus/guards; token storage; loading states

### Seed & Fixtures
- [x] Seed users (admin/agent/user), articles, tickets
- [x] JSON fixtures for stub outputs

### Testing
- [x] Backend test setup with Vitest + MongoDB Memory Server
- [x] Frontend test setup with Vitest + React Testing Library
- [x] Test files created: auth, kb, tickets, agent, audit, config, integration
- [x] Fix MongoDB download issue in tests (resolved by caching binaries; single-thread Vitest config avoids repeated downloads per spec)
- [x] Run and verify all tests pass
- [x] Backend tests (≥5): auth, KB search, ticket create, triage decision, audit logging
- [x] Frontend tests (≥3): render + form validation + guard behavior

### Deliverables
- [x] README (arch diagram, setup, agent design, tests)
- [x] Production Docker Compose setup
- [x] Deployment scripts
- [x] Fix test MongoDB download issue
- [ ] Loom demo (≤5 min): KB add → ticket create → triage → auto-close/human review
- [ ] Deploy public URL

### Current Issues
- None. Previous MongoDB Memory Server repeated download issue has been resolved via cached binaries and Vitest single-thread configuration; all tests pass locally.



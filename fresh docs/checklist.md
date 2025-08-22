# Track A MERN Smart Helpdesk - Complete Implementation Checklist

## Implementation Status (Summary)
- [x] Monorepo with `client/`, `api/`, root `compose.yml`; one-command `docker compose up`
- [x] Backend: Node 20 + Express + Mongoose; models for User, Article, Ticket, AgentSuggestion, AuditLog, Config
- [x] Auth: JWT access + refresh (HttpOnly cookies), RBAC, Zod validation, rate-limit, helmet, CORS (narrow)
- [x] APIs: Auth, KB (admin CRUD, staff read), Tickets, Agent (triage + suggestion), Config, Audit
- [x] Agentic workflow: plan → classify → retrieve → draft → decision; deterministic stub; full audit with unified traceId
- [x] Frontend: Login/Register, Tickets list + filters, Ticket detail (conversation + suggestion + audit), KB admin, Settings
- [x] UX: Role-based menus, toasts, loading skeletons, form validation, responsive layout, ARIA labels
- [x] Tests: Backend and frontend tests passing locally; builds succeed
- [x] Seed data: admin/agent/user + KB + tickets


## 🏗️ **Project Structure & Setup**

### Core Structure
- [ ] Project organized as: `client/`, `server/`, `docker-compose.yml`, `README.md`, `.env.example`
- [ ] Node.js 20+ with Express backend
- [ ] React + Vite frontend with TypeScript
- [ ] MongoDB (Atlas or local) with Mongoose
- [ ] Redis for BullMQ (optional but recommended)

### Environment Configuration
- [ ] `.env.example` with all required variables
- [ ] `PORT=8080`
- [ ] `MONGO_URI=mongodb://mongo:27017/helpdesk`
- [ ] `JWT_SECRET=change-me`
- [ ] `AUTO_CLOSE_ENABLED=true`
- [ ] `CONFIDENCE_THRESHOLD=0.78`
- [ ] `STUB_MODE=true`
- [ ] `OPENAI_API_KEY=` (optional)

---

## 📊 **Data Models (Mongoose)**

### User Model
- [ ] `_id`, `name`, `email` (unique), `password_hash`
- [ ] `role` enum: `{admin, agent, user}`
- [ ] `createdAt` timestamp
- [ ] Password hashing with bcrypt
- [ ] Email validation

### Article (KB) Model
- [ ] `_id`, `title`, `body`, `tags: [String]`
- [ ] `status` enum: `{draft, published}`
- [ ] `updatedAt` timestamp
- [ ] Text indexing for search

### Ticket Model
- [ ] `_id`, `title`, `description`
- [ ] `category` enum: `{billing, tech, shipping, other}`
- [ ] `status` enum: `{open, triaged, waiting_human, resolved, closed}`
- [ ] `createdBy` (User reference), `assignee` (User reference)
- [ ] `agentSuggestionId` (AgentSuggestion reference)
- [ ] `createdAt`, `updatedAt` timestamps

### AgentSuggestion Model
- [ ] `_id`, `ticketId`, `predictedCategory`
- [ ] `articleIds: [String]`, `draftReply`, `confidence: Number`
- [ ] `autoClosed: Boolean`
- [ ] `modelInfo` object: `{provider, model, promptVersion, latencyMs}`
- [ ] `createdAt` timestamp

### AuditLog Model
- [ ] `_id`, `ticketId`, `traceId`
- [ ] `actor` enum: `{system, agent, user}`
- [ ] `action` (e.g., `TICKET_CREATED`, `AGENT_CLASSIFIED`, `AUTO_CLOSED`)
- [ ] `meta` (JSON object), `timestamp`

### Config Model
- [ ] `_id`, `autoCloseEnabled: Boolean`
- [ ] `confidenceThreshold: Number` (0-1)
- [ ] `slaHours: Number`

---

## 🔐 **Authentication & Authorization**

### JWT Implementation
- [ ] JWT token generation with expiry
- [ ] JWT middleware for route protection
- [ ] Refresh token mechanism (optional but recommended)
- [ ] Secure token storage on frontend

### Role-Based Access Control
- [ ] Admin: Full access to KB, config, user management
- [ ] Agent: Access to tickets, can edit/send replies, view KB
- [ ] User: Create tickets, view own tickets only
- [ ] Middleware to enforce role-based permissions

### Security Measures
- [ ] Password hashing with bcrypt (min 10 rounds)
- [ ] Input validation with Zod/Joi on all POST/PUT
- [ ] Rate limiting on auth endpoints
- [ ] CORS configured properly
- [ ] Helmet for security headers

---

## 🛠️ **API Endpoints (RESTful)**

### Auth Endpoints
- [ ] `POST /api/auth/register` → `{token, user}`
- [ ] `POST /api/auth/login` → `{token, user}`
- [ ] `POST /api/auth/refresh` → `{token}` (optional)
- [ ] Proper HTTP status codes (201, 400, 401, etc.)

### KB Endpoints
- [ ] `GET /api/kb?query=...` (search title/body/tags)
- [ ] `GET /api/kb?category=...` (filter by category)
- [ ] `POST /api/kb` (admin only) - create article
- [ ] `PUT /api/kb/:id` (admin only) - update article
- [ ] `DELETE /api/kb/:id` (admin only) - delete article
- [ ] `GET /api/kb/:id` - get single article

### Ticket Endpoints
- [ ] `POST /api/tickets` (user) - create ticket
- [ ] `GET /api/tickets` - list tickets (filtered by role)
- [ ] `GET /api/tickets?status=open` - filter by status
- [ ] `GET /api/tickets?my=true` - user's own tickets
- [ ] `GET /api/tickets/:id` - single ticket with full details
- [ ] `POST /api/tickets/:id/reply` (agent) - send reply & change status
- [ ] `POST /api/tickets/:id/assign` (admin/agent) - assign ticket

### Agent Endpoints
- [ ] `POST /api/agent/triage` (internal) - enqueue triage job
- [ ] `GET /api/agent/suggestion/:ticketId` - get AI suggestion

### Config Endpoints
- [ ] `GET /api/config` - get configuration
- [ ] `PUT /api/config` (admin only) - update configuration

### Audit Endpoints
- [ ] `GET /api/tickets/:id/audit` - get audit trail for ticket

---

## 🤖 **Agentic Workflow (Core Requirement)**

### LLM Provider Interface
- [ ] Abstract `LLMProvider` class with methods:
  - [ ] `classify(text)` → `{predictedCategory, confidence}`
  - [ ] `draft(text, articles)` → `{draftReply, citations}`
- [ ] `STUB_MODE=true` environment variable support

### Deterministic Stub Implementation
- [ ] **Classification Logic:**
  - [ ] Keywords: "refund/invoice" → billing
  - [ ] Keywords: "error/bug/stack" → tech  
  - [ ] Keywords: "delivery/shipment" → shipping
  - [ ] Default: other
  - [ ] Confidence based on keyword matches
- [ ] **Draft Reply Logic:**
  - [ ] Template-based response generation
  - [ ] Insert KB article titles/snippets
  - [ ] Numbered references to articles
  - [ ] Professional closing

### Workflow Steps (Required)
1. [ ] **Plan:** State machine deciding steps (classification → retrieval → drafting → decision)
2. [ ] **Classify:** Use stub or LLM, output schema validation
3. [ ] **Retrieve KB:** Keyword search (regex/BM25/TF-IDF), return top 3 articles with scores
4. [ ] **Draft Reply:** Compose answer with numbered KB references
5. [ ] **Decision:** Auto-close if `autoCloseEnabled && confidence >= threshold`
6. [ ] **Logging:** Every step creates AuditLog with consistent `traceId`

### Queue Integration (BullMQ)
- [ ] Redis connection setup
- [ ] Triage job queue with BullMQ
- [ ] Background processing of triage jobs
- [ ] Job retry mechanism with exponential backoff
- [ ] Dead letter queue for failed jobs

---

## 🎨 **Frontend Implementation**

### Tech Stack
- [ ] React 18+ with Vite
- [ ] React Router for navigation
- [ ] State management (Context/Zustand/Redux)
- [ ] Tailwind CSS (optional but recommended)

### Core Pages
- [ ] **Login/Register Page:**
  - [ ] Form validation
  - [ ] Error handling
  - [ ] Loading states
- [ ] **Dashboard/Tickets List:**
  - [ ] Role-based filtering
  - [ ] Search and filters
  - [ ] Status indicators
  - [ ] Create ticket button (users)
- [ ] **Ticket Detail Page:**
  - [ ] Conversation thread
  - [ ] Agent suggestion display (agents only)
  - [ ] Audit timeline
  - [ ] Reply functionality
- [ ] **KB Management (Admin only):**
  - [ ] Article list with search
  - [ ] CRUD operations
  - [ ] Rich text editor
  - [ ] Publish/unpublish toggle
- [ ] **Settings Page (Admin):**
  - [ ] Config management
  - [ ] Auto-close toggle
  - [ ] Confidence threshold slider

### UX Requirements
- [ ] Clear CTAs and navigation
- [ ] Loading skeletons/spinners
- [ ] Error toast notifications
- [ ] Form validation with helpful messages
- [ ] Responsive layout (mobile-friendly)
- [ ] Empty states (no tickets, no KB articles)
- [ ] Proper error boundaries

### Accessibility
- [ ] Keyboard navigation support
- [ ] ARIA labels on interactive elements
- [ ] Proper color contrast
- [ ] Screen reader friendly
- [ ] Focus management

---

## 🧪 **Testing Requirements**

### Backend Tests (Jest/Vitest - Minimum 5)
- [ ] **Auth Test:** Registration, login, JWT validation
- [ ] **KB Search Test:** Keyword search functionality
- [ ] **Ticket Create Test:** Ticket creation triggers triage
- [ ] **Agent Triage Test:** Decision logic (auto-close vs assign)
- [ ] **Audit Logging Test:** All steps logged with traceId

### Frontend Tests (Vitest/RTL - Minimum 3)
- [ ] **Rendering Test:** Components render without crashing
- [ ] **Form Validation Test:** Login/ticket creation forms
- [ ] **User Interaction Test:** Button clicks, navigation

### Test Data
- [ ] JSON fixtures for stubbed LLM outputs
- [ ] Seed data fixtures (users, articles, tickets)
- [ ] Mock data for testing different scenarios

### Optional (Postman/Thunder)
- [ ] API collection with example requests
- [ ] Environment variables for testing
- [ ] Test scenarios for all endpoints

---

## 🔒 **Security & Reliability**

### Security Checklist
- [ ] Never log secrets or sensitive data
- [ ] No stack traces returned to clients
- [ ] Input validation on all POST/PUT endpoints
- [ ] Rate limiting on auth and mutation endpoints
- [ ] JWT with reasonable expiry times
- [ ] CORS configured narrowly (not wildcard in production)

### Reliability Features
- [ ] Timeout handling for all external calls
- [ ] Retry logic with exponential backoff
- [ ] Idempotency keys for triage jobs
- [ ] Graceful error handling
- [ ] Database connection retry logic

### Error Handling
- [ ] Global error handler middleware
- [ ] Structured error responses
- [ ] Proper HTTP status codes
- [ ] User-friendly error messages
- [ ] Error logging for debugging

---

## 📊 **Observability**

### Logging
- [ ] Structured JSON logs
- [ ] `traceId` in all triage-related logs
- [ ] `ticketId` in ticket-related logs
- [ ] Request logging middleware (method, path, latency, status)
- [ ] Error logging with stack traces (server-side only)

### Health Checks
- [ ] `GET /healthz` - basic health check
- [ ] `GET /readyz` - readiness check (DB connection, etc.)
- [ ] Service status monitoring

### Performance
- [ ] Database query optimization
- [ ] Proper indexing on search fields
- [ ] Response time monitoring
- [ ] Memory usage monitoring

---

## 🐳 **DevOps & Deployment**

### Docker Setup
- [ ] `Dockerfile` for client (multi-stage build)
- [ ] `Dockerfile` for server (Node.js optimization)
- [ ] `docker-compose.yml` with services:
  - [ ] `client` service
  - [ ] `api` service  
  - [ ] `mongo` service
  - [ ] `redis` service (if using BullMQ)
- [ ] **One-command setup:** `docker compose up` works completely

### Database Initialization
- [ ] Seed script: `npm run seed` or similar
- [ ] Sample users (admin, agent, user)
- [ ] Sample KB articles for each category
- [ ] Sample tickets for testing

### Environment Management
- [ ] Production-ready environment variables
- [ ] Secrets management
- [ ] Build optimization for production

---

## ✅ **Acceptance Criteria Verification**

### Core Functionality Tests
1. [ ] **User Registration/Login:** Can register and login as normal user
2. [ ] **Ticket Creation:** Creating ticket triggers triage automatically
3. [ ] **Agent Suggestion:** AgentSuggestion is persisted in database
4. [ ] **Auto-Close Logic:** If confidence ≥ threshold and auto-close ON → ticket resolved with agent reply
5. [ ] **Human Assignment:** If below threshold → ticket becomes `waiting_human`, agent can review/edit/send
6. [ ] **Audit Trail:** Ordered timeline with timestamps and consistent `traceId`
7. [ ] **KB Search:** Returns relevant articles for queries
8. [ ] **Stub Mode:** App runs with `STUB_MODE=true` without external API keys
9. [ ] **Docker:** `docker compose up` brings up complete stack

### User Story Validation
- [ ] **End User:** Can create tickets, view status, see agent replies
- [ ] **Support Agent:** Can review triage, edit drafts, send final replies, resolve tickets
- [ ] **Admin:** Can manage KB articles, set agent thresholds, configure auto-close

---

## 📚 **Documentation Requirements**

### README.md Content
- [ ] **Architecture Diagram:** System components and data flow
- [ ] **Setup Instructions:** Step-by-step local development setup
- [ ] **Environment Variables:** Complete list with descriptions
- [ ] **Docker Instructions:** How to run with Docker
- [ ] **Seed Data:** How to populate initial data
- [ ] **Agent Workflow:** How the AI agent works (plan, prompts, tools)
- [ ] **Testing Instructions:** How to run tests
- [ ] **API Documentation:** Endpoint descriptions
- [ ] **Deployment Guide:** Production deployment steps

### Code Documentation
- [ ] Inline comments for complex logic
- [ ] Function/method documentation
- [ ] API endpoint documentation
- [ ] Database schema documentation

---

## 🎥 **Final Deliverables**

### Video Demo (≤5 min Loom)
- [ ] KB article creation (admin view)
- [ ] Ticket creation (user view)
- [ ] Triage process demonstration
- [ ] Agent review and resolution
- [ ] Audit trail showcase

### Repository
- [ ] Public/private GitHub repository
- [ ] Clean commit history showing development progress
- [ ] No committed secrets or sensitive data
- [ ] Proper `.gitignore` files

### Deployment
- [ ] Public URL deployed on cloud platform (Vercel, Netlify, Railway, etc.)
- [ ] Working application accessible online
- [ ] Database and Redis hosted appropriately

---

## 📈 **Scoring Rubric Alignment**

### Core Functionality (30 points)
- [ ] All user stories implemented
- [ ] Agentic workflow complete
- [ ] Auto-close and human assignment logic
- [ ] Complete CRUD operations

### Code Quality (15 points)  
- [ ] Clean, readable code structure
- [ ] Meaningful variable/function names
- [ ] Proper separation of concerns
- [ ] DRY principles followed

### Data Modeling & API (10 points)
- [ ] Proper MongoDB schema design
- [ ] RESTful API endpoints
- [ ] Appropriate HTTP status codes
- [ ] Data validation

### UI/UX (10 points)
- [ ] Intuitive user interface
- [ ] Proper loading/error states
- [ ] Responsive design
- [ ] Accessibility basics

### Testing (10 points)
- [ ] Meaningful test coverage
- [ ] Both frontend and backend tests
- [ ] Integration test scenarios
- [ ] Test fixtures and mocks

### Agentic Workflow (15 points)
- [ ] Planning and tool selection
- [ ] Safe prompting with guardrails
- [ ] Fallback mechanisms
- [ ] Comprehensive logging

### Security & Reliability (5 points)
- [ ] Input validation
- [ ] Authentication/authorization
- [ ] Error handling
- [ ] Rate limiting

### DevOps & DX (5 points)
- [ ] Docker setup working
- [ ] Clear documentation
- [ ] Easy local development setup
- [ ] Deployment ready

---

## ⚠️ **Disqualifier Checklist (Must Avoid)**

- [ ] ❌ **NO** committed secrets in repository
- [ ] ❌ **NO** failing builds or broken functionality  
- [ ] ❌ **NO** inability to run locally
- [ ] ❌ **NO** missing README.md
- [ ] ❌ **NO** broken Docker setup
- [ ] ❌ **NO** missing core functionality

---

## 🚀 **Final Pre-Submission Checklist**

- [ ] All acceptance criteria pass
- [ ] Video demo recorded and uploaded
- [ ] README.md complete and accurate
- [ ] Code repository cleaned up
- [ ] Application deployed publicly
- [ ] Docker setup tested on fresh machine
- [ ] All tests passing
- [ ] No console errors in browser
- [ ] Mobile responsiveness verified
- [ ] All user roles tested thoroughly

---

**Total Estimated Time: 36-48 hours**
**Confidence Level: Ready for submission ✅**
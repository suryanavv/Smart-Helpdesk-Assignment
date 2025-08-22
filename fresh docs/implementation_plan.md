# Smart Helpdesk with Agentic Triage - Implementation Plan

## Project Overview
Build an end-to-end web application where users raise support tickets and an AI agent triages them by classifying, fetching KB articles, drafting replies, and either auto-resolving or assigning to humans.

**Tech Stack Decision: Track A (MERN Only)**
- Frontend: React + Vite + Zustand + React Router + Tailwind
- Backend: Node.js + Express + MongoDB + BullMQ (Redis)
- Agent: In-process Node.js implementation

---

## Phase 1: Project Setup & Infrastructure (2-3 hours)

### Step 1.1: Initialize Project Structure
```
helpdesk/
├── client/          # React frontend
├── server/          # Node.js backend
├── docker-compose.yml
├── README.md
└── .env.example
```

**Tools to use:** Cursor/VSCode for project setup

### Step 1.2: Backend Setup
1. **Initialize Node.js project**
   ```bash
   cd server
   npm init -y
   npm install express mongoose cors helmet morgan bcryptjs jsonwebtoken
   npm install zod express-rate-limit bull bullmq ioredis
   npm install -D nodemon jest supertest
   ```

2. **Create core server structure**
   ```
   server/
   ├── src/
   │   ├── config/
   │   ├── models/
   │   ├── routes/
   │   ├── middleware/
   │   ├── services/
   │   ├── utils/
   │   └── app.js
   ├── tests/
   └── package.json
   ```

### Step 1.3: Frontend Setup
1. **Initialize React project**
   ```bash
   npm create vite@latest client -- --template react-ts
   cd client
   npm install zustand react-router-dom @heroicons/react
   npm install tailwindcss @tailwindcss/forms
   npm install -D @testing-library/react @testing-library/jest-dom vitest
   ```

2. **Setup Tailwind CSS**
   - Configure tailwind.config.js
   - Add to index.css

### Step 1.4: Docker & Database Setup
1. **Create docker-compose.yml**
   ```yaml
   version: '3.8'
   services:
     mongo:
       image: mongo:6
       ports:
         - "27017:27017"
     redis:
       image: redis:7-alpine
       ports:
         - "6379:6379"
     api:
       build: ./server
       ports:
         - "8080:8080"
       depends_on: [mongo, redis]
     client:
       build: ./client
       ports:
         - "3000:3000"
   ```

**Deliverable:** Running development environment with all services

---

## Phase 2: Data Models & Database Layer (1-2 hours)

### Step 2.1: Define MongoDB Schemas
Create Mongoose models for:

1. **User Model** (`models/User.js`)
   ```javascript
   {
     name: String,
     email: String (unique),
     password_hash: String,
     role: {admin, agent, user},
     createdAt: Date
   }
   ```

2. **Article Model** (`models/Article.js`)
   ```javascript
   {
     title: String,
     body: String,
     tags: [String],
     status: {draft, published},
     updatedAt: Date
   }
   ```

3. **Ticket Model** (`models/Ticket.js`)
   ```javascript
   {
     title: String,
     description: String,
     category: {billing, tech, shipping, other},
     status: {open, triaged, waiting_human, resolved, closed},
     createdBy: ObjectId,
     assignee: ObjectId,
     agentSuggestionId: ObjectId,
     createdAt: Date,
     updatedAt: Date
   }
   ```

4. **AgentSuggestion Model** (`models/AgentSuggestion.js`)
5. **AuditLog Model** (`models/AuditLog.js`)
6. **Config Model** (`models/Config.js`)

### Step 2.2: Database Connection & Seed Script
1. **Setup MongoDB connection** (`config/database.js`)
2. **Create seed script** (`scripts/seed.js`)
   - Sample users (admin, agent, user)
   - KB articles for billing, tech, shipping
   - Sample tickets

**Tools:** Use Cursor AI to generate Mongoose schemas and seed data

**Deliverable:** Database models with seed data working

---

## Phase 3: Authentication & Authorization (2-3 hours)

### Step 3.1: Backend Auth System
1. **JWT utilities** (`utils/jwt.js`)
2. **Auth middleware** (`middleware/auth.js`)
3. **Role-based access** (`middleware/rbac.js`)
4. **Auth routes** (`routes/auth.js`)
   - POST /api/auth/register
   - POST /api/auth/login
   - POST /api/auth/refresh

### Step 3.2: Frontend Auth System
1. **Zustand auth store** (`stores/authStore.js`)
2. **Auth context and hooks**
3. **Protected route wrapper**
4. **Login/Register pages**

### Step 3.3: Input Validation
1. **Zod schemas for validation** (`schemas/`)
2. **Validation middleware**

**Tools:** Use Bolt.new or Lovable for rapid UI prototyping of auth pages

**Deliverable:** Complete auth system with JWT tokens and role-based access

---

## Phase 4: Core API Endpoints (3-4 hours)

### Step 4.1: Knowledge Base API
1. **KB routes** (`routes/kb.js`)
   - GET /api/kb (search with query param)
   - POST /api/kb (admin only)
   - PUT /api/kb/:id (admin only)
   - DELETE /api/kb/:id (admin only)

2. **KB service layer** (`services/kbService.js`)
   - Keyword search implementation
   - TF-IDF scoring (optional)

### Step 4.2: Tickets API  
1. **Ticket routes** (`routes/tickets.js`)
   - POST /api/tickets (create ticket)
   - GET /api/tickets (list with filters)
   - GET /api/tickets/:id (single ticket)
   - POST /api/tickets/:id/reply (agent reply)
   - POST /api/tickets/:id/assign

2. **Ticket service layer** (`services/ticketService.js`)

### Step 4.3: Agent & Config APIs
1. **Agent routes** (`routes/agent.js`)
   - POST /api/agent/triage (internal)
   - GET /api/agent/suggestion/:ticketId

2. **Config routes** (`routes/config.js`)
3. **Audit routes** (`routes/audit.js`)

**Tools:** Use Cursor AI for generating boilerplate API routes and services

**Deliverable:** Complete REST API with all endpoints functional

---

## Phase 5: Agentic Workflow Implementation (4-5 hours)

### Step 5.1: LLM Provider Interface
1. **Create LLMProvider class** (`services/llmProvider.js`)
   ```javascript
   class LLMProvider {
     async classify(text) { /* */ }
     async draft(text, articles) { /* */ }
   }
   ```

2. **Deterministic stub implementation**
   ```javascript
   class StubLLMProvider extends LLMProvider {
     classify(text) {
       // Keyword-based classification
       // Return {predictedCategory, confidence}
     }
     draft(text, articles) {
       // Template-based reply generation
       // Return {draftReply, citations}
     }
   }
   ```

### Step 5.2: Agent Workflow Engine
1. **Agent planner** (`services/agentPlanner.js`)
   - State machine for triage steps
   - Step orchestration

2. **Triage service** (`services/triageService.js`)
   ```javascript
   async function triageTicket(ticketId) {
     const traceId = generateUUID();
     
     // Step 1: Classify
     const classification = await llmProvider.classify(ticket.description);
     await auditLog.log(ticketId, traceId, 'AGENT_CLASSIFIED', classification);
     
     // Step 2: Retrieve KB articles
     const articles = await kbService.search(ticket.description, classification.predictedCategory);
     await auditLog.log(ticketId, traceId, 'KB_RETRIEVED', {articleIds: articles.map(a => a._id)});
     
     // Step 3: Draft reply
     const draft = await llmProvider.draft(ticket.description, articles);
     await auditLog.log(ticketId, traceId, 'DRAFT_GENERATED', draft);
     
     // Step 4: Make decision
     const suggestion = await AgentSuggestion.create({...});
     
     if (config.autoCloseEnabled && classification.confidence >= config.confidenceThreshold) {
       // Auto-close logic
       await auditLog.log(ticketId, traceId, 'AUTO_CLOSED');
     } else {
       // Assign to human logic  
       await auditLog.log(ticketId, traceId, 'ASSIGNED_TO_HUMAN');
     }
   }
   ```

### Step 5.3: Queue Integration
1. **Setup BullMQ** (`services/queueService.js`)
2. **Triage job processor**
3. **Queue monitoring endpoints**

**Tools:** Use Cursor with AI assistance to implement the complex workflow logic

**Deliverable:** Complete agentic workflow with deterministic stub working

---

## Phase 6: Frontend Implementation (4-5 hours)

### Step 6.1: UI Components & Layout
1. **Base components** (using Tailwind)
   - Button, Input, Modal, Toast, Loading Spinner
   - Layout with navigation
   - Role-based menu rendering

2. **State management setup** (Zustand stores)
   - authStore
   - ticketsStore  
   - kbStore
   - configStore

### Step 6.2: Core Pages
1. **Dashboard/Tickets List** (`pages/TicketsPage.jsx`)
   - Filter by status, category
   - Role-based views (user sees own, agent sees assigned)
   - Create new ticket button

2. **Ticket Detail Page** (`pages/TicketDetailPage.jsx`)
   - Conversation thread
   - Agent suggestion display
   - Audit timeline
   - Reply functionality (agents only)

3. **Knowledge Base Pages** (`pages/KnowledgeBasePage.jsx`)
   - Article list with search
   - CRUD operations (admin only)
   - Rich text editor for articles

4. **Admin Settings** (`pages/SettingsPage.jsx`)
   - Config management
   - User management

### Step 6.3: Real-time Features
1. **WebSocket integration** (optional)
2. **Optimistic updates**
3. **Auto-refresh for status changes**

**Tools:** Use Lovable or Bolt.new for rapid UI development, then refine with Cursor

**Deliverable:** Complete frontend with all user stories implemented

---

## Phase 7: Testing & Quality Assurance (2-3 hours)

### Step 7.1: Backend Tests
Write tests using Jest/Supertest:
1. **Auth tests** (`tests/auth.test.js`)
2. **KB search tests** (`tests/kb.test.js`)
3. **Ticket creation tests** (`tests/tickets.test.js`)
4. **Agent triage tests** (`tests/agent.test.js`)
5. **Audit logging tests** (`tests/audit.test.js`)

### Step 7.2: Frontend Tests  
Write tests using Vitest/RTL:
1. **Component rendering tests**
2. **Form validation tests**
3. **User interaction tests**

### Step 7.3: Integration Testing
1. **End-to-end workflow tests**
2. **API integration tests**
3. **Error handling tests**

**Tools:** Use Cursor AI to generate test boilerplate and assertions

**Deliverable:** Test suite with meaningful coverage

---

## Phase 8: Security & Reliability (2-3 hours)

### Step 8.1: Security Hardening
1. **Input validation with Zod**
2. **Rate limiting on auth endpoints**
3. **CORS configuration**
4. **Security headers (helmet)**
5. **JWT security (short expiry, refresh tokens)**

### Step 8.2: Error Handling & Resilience
1. **Global error handler**
2. **Retry logic with exponential backoff**
3. **Timeout handling**
4. **Idempotency for triage jobs**
5. **Graceful degradation**

### Step 8.3: Observability
1. **Structured logging** (`utils/logger.js`)
2. **Request logging middleware**
3. **Health check endpoints** (/healthz, /readyz)
4. **Performance monitoring**

**Deliverable:** Production-ready security and reliability features

---

## Phase 9: DevOps & Documentation (2-3 hours)

### Step 9.1: Docker Configuration
1. **Dockerfiles for client and server**
2. **Docker Compose optimization**
3. **Environment variable management**
4. **One-command setup**

### Step 9.2: Documentation
1. **Comprehensive README.md**
   - Architecture diagram
   - Setup instructions
   - Environment variables
   - API documentation
   - Testing instructions

2. **Code documentation**
   - JSDoc comments
   - API endpoint documentation
   - Agent workflow documentation

### Step 9.3: Deployment Preparation
1. **Production environment config**
2. **Build optimization**
3. **Asset optimization**

**Tools:** Use Cursor for documentation generation and Docker optimization

**Deliverable:** Production-ready application with complete documentation

---

## Phase 10: Final Integration & Demo (1-2 hours)

### Step 10.1: End-to-End Testing
1. **Full workflow verification**
2. **All acceptance criteria validation**
3. **Edge case testing**
4. **Performance verification**

### Step 10.2: Demo Preparation
1. **Create demo script**
2. **Record Loom video (≤5 min)**
   - KB article creation
   - Ticket creation and triage
   - Agent review and resolution
3. **Deploy to cloud platform**

### Step 10.3: Final Code Review
1. **Code quality check**
2. **Security review**
3. **Documentation completeness**
4. **Commit history cleanup**

**Deliverable:** Complete, tested, documented application ready for submission

---

## Implementation Strategy for Vibe Coding Tools

### Cursor AI Usage
- **Code generation:** Models, API routes, services
- **Refactoring:** Clean up generated code
- **Testing:** Generate test cases and assertions
- **Documentation:** Auto-generate JSDoc comments

### Lovable/Bolt.new Usage  
- **UI prototyping:** Rapid frontend mockups
- **Component library:** Generate base components
- **Styling:** Tailwind class suggestions
- **Layout design:** Responsive designs

### GitHub Copilot Usage
- **Boilerplate reduction:** Repetitive code patterns
- **Error handling:** Exception handling patterns
- **TypeScript types:** Interface definitions
- **Utility functions:** Helper functions

---

## Risk Mitigation

### Technical Risks
1. **MongoDB connection issues** → Have local fallback
2. **Queue system complexity** → Start with in-memory queue
3. **LLM stub accuracy** → Test with diverse inputs
4. **Frontend state management** → Keep stores simple

### Time Management Risks
1. **Feature creep** → Stick to core requirements
2. **Perfect code syndrome** → Prioritize working over perfect
3. **Testing bottleneck** → Write tests as you go
4. **Documentation delay** → Document while building

---

## Success Metrics

### Core Functionality ✅
- [ ] User registration and authentication
- [ ] Ticket creation triggers triage
- [ ] Agent suggestions are generated and stored
- [ ] Auto-close logic works correctly
- [ ] Human agent can review and respond
- [ ] Audit trail is complete and visible
- [ ] KB search returns relevant results

### Quality Indicators ✅  
- [ ] All tests pass
- [ ] Docker setup works with one command
- [ ] STUB_MODE=true works without API keys
- [ ] Code is clean and well-structured
- [ ] Security best practices implemented
- [ ] Documentation is comprehensive

### Demo Requirements ✅
- [ ] 5-minute video walkthrough
- [ ] Public deployment URL
- [ ] GitHub repository with commit history
- [ ] README with setup instructions

---

This plan provides a comprehensive roadmap for building the Smart Helpdesk system efficiently using modern development tools and AI-powered coding assistants. Each phase builds upon the previous one, ensuring steady progress toward the final deliverable.
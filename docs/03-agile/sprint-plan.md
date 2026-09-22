# Sprint Plan — AI Financial Research Terminal

This roadmap breaks the project into 9 sequential, iterative sprints (Sprint 0 through Sprint 8). Each sprint produces a working, testable increment.

---

## Sprint Breakdown Summary

| Sprint | Name | Primary Objective | Key Deliverables | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Sprint 0** | **Planning & Architecture** | Complete system design, schemas, API contracts, Agile docs | Full `docs/` hierarchy, ER diagrams, ADRs, Swagger-like API docs | **Completed** |
| **Sprint 1** | **Express + PostgreSQL + Drizzle** | Core backend operational and connected to database | Node/Express scaffolding, Drizzle ORM schemas, migrations, health check | **Completed** |
| **Sprint 2** | **Authentication & Security** | Secure user identity & authorization | Registration, bcrypt hashing, JWT issuance, auth middleware, `/me` | **Completed** |
| **Sprint 3** | **Companies & Financials** | Deterministic financial engine & company APIs | Companies table, financial metrics table, ratio calculator (Margins, RoE, FCF) | **Completed** |
| **Sprint 4** | **React Frontend Terminal** | Modern, responsive dark-mode financial terminal | React/Vite/Tailwind setup, router, auth pages, company dashboard, Recharts | **Completed** |
| **Sprint 5** | **Python RAG & Ingestion** | Ingestion pipeline & pgvector embeddings | FastAPI app, PDF extractor, transcript speaker parser, chunking, pgvector indexing | **Completed** |
| **Sprint 6** | **AI Analyst & Grounded Chat** | End-to-end evidence-backed RAG with citations | Retrieval pipeline, Gemini 3.6 Flash, Local Extractive fallback, Chat UI, click-to-PDF | **Completed** |
| **Sprint 7** | **Advanced Terminal Features** | Real PDF financial extraction, watchlists & evaluation | PDF extractor (`extract_pdf_financials.py`) [DONE], Watchlist CRUD, comparison, eval | **In Progress** |
| **Sprint 8** | **Testing, Security & Deployment** | Production readiness, security audit & deployment | Test suites [PASSING], security hardening, non-Docker deployment guide | Planned |

---

## Detailed Sprint Specifications

### Sprint 0 — Planning & Architecture
* **Status**: **Completed**
* **Goal**: Establish the technical and architectural blueprint before writing code.
* **Scope**:
  - Write complete project overview, functional/non-functional requirements, user stories.
  - Formulate product backlog and sprint roadmap.
  - Design complete relational schema including pgvector embeddings.
  - Create visual Mermaid ER diagram.
  - Define complete REST API specifications for both Express and Python services.
  - Author Architecture Decision Records (ADRs) justifying all technical choices.
  - Establish Definition of Done and Risk Register.
* **Exit Criterion**: All planning documents reviewed and approved by developer.

### Sprint 1 — Express + PostgreSQL + Drizzle
* **Status**: **Completed**
* **Goal**: Working Express backend connected to PostgreSQL via Drizzle ORM.
* **Key Tasks**:
  - Initialize `backend/` with `npm init` and configure ES Modules (`"type": "module"`).
  - Install `express`, `drizzle-orm`, `postgres`, `dotenv`, `cors`.
  - Configure PostgreSQL connection pool.
  - Write Drizzle schemas (`users`, `companies`, `financial_metrics`, `documents`, `document_chunks`, `chat_sessions`, `chat_messages`, `watchlists`).
  - Run initial migration to instantiate database schema.
  - Build centralized error handling middleware and health check endpoint (`GET /api/health`).
* **Verification**: Running `npm run dev` boots Express; `/api/health` returns `{ "status": "ok", "db": "connected" }`.

### Sprint 2 — Authentication
* **Status**: **Completed**
* **Goal**: Secure registration and token-based authentication.
* **Key Tasks**:
  - Implement password hashing with `bcrypt` (salt rounds = 10).
  - Implement `POST /api/auth/register` with validation.
  - Implement `POST /api/auth/login` returning signed JWT with 24h expiry.
  - Implement `authMiddleware` extracting and validating Bearer tokens.
  - Implement `GET /api/auth/me` returning sanitized user profile.
  - Implement `POST /api/auth/logout`.
* **Verification**: Automated test suite (`tests/api.test.js`) validates register, login, duplicate handling, and protected `/me` access.

### Sprint 3 — Companies & Financial Data
* **Status**: **Completed**
* **Goal**: Structured financial data engine with deterministic ratio calculations.
* **Key Tasks**:
  - Implement company controller and service (`GET /api/companies`, `GET /api/companies/:ticker`).
  - Seed historical financials for **ITC Limited**.
  - Implement deterministic calculation service for Gross/Operating/Net Margins, RoE, Debt/Equity, Free Cash Flow.
  - Implement `GET /api/companies/:ticker/financials`.
* **Verification**: Automated test suite (`tests/financials.test.js`) verifies all 6 ratio formulas and endpoint responses.

### Sprint 4 — React Frontend
* **Status**: **Completed**
* **Goal**: High-fidelity terminal UI connected to Express API.
* **Key Tasks**:
  - Initialize `frontend/` using Vite with React 18 and JavaScript (ESM).
  - Install and configure Tailwind CSS with custom institutional dark-theme palette.
  - Build dark-mode institutional layout (Header, Nav, Terminal status bar with API latency).
  - Build AuthContext, Login, and Register views with error states.
  - Build Company Search bar with autocomplete and Company Overview page (`/company/:ticker`).
  - Build Financials view with interactive Recharts (Revenue, EBITDA, Margins) and multi-period statement tables.
* **Verification**: Browser UI renders responsive charts, statement tables, and auth flows connected to backend.

### Sprint 5 — Python RAG & Document Ingestion
* **Status**: **Completed**
* **Goal**: Python service parsing filings/transcripts and writing vector embeddings to PostgreSQL.
* **Key Tasks**:
  - Scaffold `rag-service/` with FastAPI, Uvicorn, and `psycopg2`.
  - Enable `pgvector` in PostgreSQL.
  - Implement PDF text extractor with page tracking (`pdf_parser.py`).
  - Implement conference call transcript parser detecting speakers (e.g., Sanjiv Puri, CFO, Analysts) and sections (Prepared Remarks vs Q&A).
  - Implement chunker (500 tokens, 60 token sliding overlap) preserving metadata (`chunker.py`).
  - Generate dense 384-d embeddings using SentenceTransformers (`all-MiniLM-L6-v2`) and write to `document_chunks` table (`embedder.py`, `pipeline.py`).
* **Verification**: `pytest tests/` passes 5/5; 1,679 chunks indexed in PostgreSQL.

### Sprint 6 — AI Analyst
* **Status**: **Completed**
* **Goal**: End-to-end evidence-grounded AI research assistant with citations.
* **Key Tasks**:
  - Implement `/query` in FastAPI: query embedding -> pgvector similarity search -> financial domain re-ranking -> prompt construction -> LLM response.
  - Implement strict grounding prompt: attribute management statements, distinguish analyst queries, emit structured citations.
  - Integrate **Google Gemini API** (`gemini-3.6-flash`, `gemini-flash-latest`) with resilient fallback chain.
  - Implement **Local Extractive Synthesis Engine** for 100% offline, zero-network fallback.
  - Implement Express `/api/chat` orchestrator forwarding prompts to Python service.
  - Store chat history in `chat_sessions` and `chat_messages`.
  - Build frontend AI Analyst panel with clickable citations, evidence preview drawer, live LLM Diagnostics modal, and direct PDF streaming (`/documents/:id/pdf#page=X`).
* **Verification**: Natural language queries return structured equity research synthesis attributed to source pages and conference call speakers.

### Sprint 7 — Advanced Features & Automation
* **Status**: **In Progress**
* **Goal**: Comparison tools, watchlists, automated document extraction, and RAG evaluation.
* **Key Tasks**:
  - [x] Implement **Real PDF Financial Statement Extractor** (`extract_pdf_financials.py`) to parse balance sheets and income statements directly from uploaded filings, replacing mock data.
  - [x] Implement **Filings & Transcripts Management Hub** with openable original PDFs.
  - [ ] Implement Watchlist backend and UI widgets.
  - [ ] Implement side-by-side Company Comparison table.
  - [ ] Implement automated RAG evaluation suite calculating Faithfulness, Recall, and Precision against ground-truth queries.
* **Verification**: PDF extractor compiles multi-year financial statements dynamically; watchlist and comparison features in development.

### Sprint 8 — Testing, Security & Deployment
* **Status**: **Planned / Partial Baseline Complete**
* **Goal**: Production readiness, automated test coverage, and deployment blueprints.
* **Key Tasks**:
  - [x] Node.js test suite for Express API & financial math passing (8/8).
  - [x] Pytest suite for Python transcript parsing & ingestion passing (5/5).
  - [x] Frontend production bundle builds cleanly (`vite build` in 1.9s).
  - [ ] Security audit: rate limiting, helmet, input validation hardening.
  - [ ] Non-Docker production deployment runbook (Render/Railway/Vercel/Supabase).
* **Verification**: All automated test suites pass; production deployment verified without containerization.

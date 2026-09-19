# Sprint Plan — AI Financial Research Terminal

This roadmap breaks the project into 9 sequential, iterative sprints (Sprint 0 through Sprint 8). Each sprint produces a working, testable increment.

---

## Sprint Breakdown Summary

| Sprint | Name | Primary Objective | Key Deliverables |
| :--- | :--- | :--- | :--- |
| **Sprint 0** | **Planning & Architecture** | Complete system design, schemas, API contracts, Agile docs | Full `docs/` hierarchy, ER diagrams, ADRs, Swagger-like API docs |
| **Sprint 1** | **Express + PostgreSQL + Drizzle** | Core backend operational and connected to database | Node/Express scaffolding, Drizzle ORM schemas, migrations, health check |
| **Sprint 2** | **Authentication & Security** | Secure user identity & authorization | Registration, bcrypt hashing, JWT issuance, auth middleware, `/me` |
| **Sprint 3** | **Companies & Financials** | Deterministic financial engine & company APIs | Companies table, financial metrics table, ITC seed data, deterministic ratio calculator |
| **Sprint 4** | **React Frontend Terminal** | Modern, responsive dark-mode financial terminal | React/Vite/Tailwind setup, router, auth pages, company dashboard, Recharts |
| **Sprint 5** | **Python RAG & Ingestion** | Ingestion pipeline & pgvector embeddings | FastAPI app, PDF extractor, transcript speaker parser, chunking, pgvector indexing |
| **Sprint 6** | **AI Analyst & Grounded Chat** | End-to-end evidence-backed RAG with citations | Retrieval pipeline, reranking, prompt synthesis, Express-Python bridge, Chat UI |
| **Sprint 7** | **Advanced Terminal Features** | Comparisons, watchlists & RAG evaluation | Watchlist CRUD, company comparison, RAG metrics (Faithfulness/Recall) |
| **Sprint 8** | **Testing, Security & Deployment** | Production readiness, security audit & deployment | Integration test suite, security hardening, non-Docker deployment guide |

---

## Detailed Sprint Specifications

### Sprint 0 — Planning & Architecture
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
* **Goal**: Secure registration and token-based authentication.
* **Key Tasks**:
  - Implement password hashing with `bcrypt` (salt rounds = 10).
  - Implement `POST /api/auth/register` with validation.
  - Implement `POST /api/auth/login` returning signed JWT with 24h expiry.
  - Implement `authMiddleware` extracting and validating Bearer tokens.
  - Implement `GET /api/auth/me` returning sanitized user profile.
  - Implement `POST /api/auth/logout`.
* **Verification**: Postman/curl requests register, login, and access protected routes.

### Sprint 3 — Companies & Financial Data
* **Goal**: Structured financial data engine with deterministic ratio calculations.
* **Key Tasks**:
  - Implement company controller and service (`GET /api/companies`, `GET /api/companies/:ticker`).
  - Seed historical financials for **ITC Limited** (FY2021 to FY2025).
  - Implement deterministic calculation service for Gross/Operating/Net Margins, RoE, Debt/Equity.
  - Implement `GET /api/companies/:ticker/financials`.
* **Verification**: Requesting `/api/companies/ITC/financials` returns verified financial data with accurately computed ratios.

### Sprint 4 — React Frontend
* **Goal**: High-fidelity terminal UI connected to Express API.
* **Key Tasks**:
  - Initialize `frontend/` using `npx vite@latest` with React and JavaScript.
  - Install and configure Tailwind CSS.
  - Build dark-mode institutional layout (Header, Nav, Terminal status bar).
  - Build AuthContext, Login, and Register views.
  - Build Company Search bar and Company Overview page (`/company/:ticker`).
  - Build Financials view with interactive Recharts (Revenue, EBITDA, Margins).
* **Verification**: Navigating the browser shows responsive UI fetching live data from Express.

### Sprint 5 — Python RAG & Document Ingestion
* **Goal**: Python service parsing filings/transcripts and writing vector embeddings to PostgreSQL.
* **Key Tasks**:
  - Scaffold `rag-service/` with FastAPI, Uvicorn, LangChain/LlamaIndex or raw PyPDF/SentenceTransformers.
  - Enable `pgvector` in PostgreSQL.
  - Implement PDF text extractor with page tracking.
  - Implement conference call transcript parser detecting speakers (e.g., Sanjiv Puri, CFO, Analysts) and sections (Prepared Remarks vs Q&A).
  - Implement chunker (500 tokens, 50 token overlap) preserving metadata.
  - Generate dense embeddings and write to `document_chunks` table.
* **Verification**: Ingesting ITC Q4 FY24 transcript stores chunked vectors in PostgreSQL with speaker metadata.

### Sprint 6 — AI Analyst
* **Goal**: End-to-end evidence-grounded AI research assistant with citations.
* **Key Tasks**:
  - Implement `/query` in FastAPI: query embedding -> pgvector similarity search -> metadata filtering -> prompt construction -> LLM response.
  - Implement strict grounding prompt: attribute management statements, distinguish analyst queries, emit structured citations.
  - Implement Express `/api/chat` orchestrator forwarding prompts to Python service.
  - Store chat history in `chat_sessions` and `chat_messages`.
  - Build frontend AI Analyst panel with clickable citations and evidence preview drawer.
* **Verification**: Asking *"Why did ITC's operating margins change in FY24?"* returns an attributed answer with verifiable citations.

### Sprint 7 — Advanced Features & Automation
* **Goal**: Comparison tools, watchlists, and RAG evaluation.
* **Key Tasks**:
  - Implement Watchlist backend and UI widgets.
  - Implement side-by-side Company Comparison table.
  - Implement RAG evaluation suite calculating Faithfulness, Recall, and Precision against ground-truth queries.
* **Verification**: Evaluation script outputs quantitative RAG scores; watchlist allows adding/removing tickers.

### Sprint 8 — Testing, Security & Deployment
* **Goal**: Production readiness, automated test coverage, and deployment blueprints.
* **Key Tasks**:
  - Write Supertest unit/integration tests for Express API.
  - Write Pytest tests for Python transcript parsing and retrieval.
  - Audit security: CORS, rate limiting, helmet, input validation.
  - Write non-Docker production deployment runbook (Render/Railway/Vercel/Supabase).
* **Verification**: All test suites pass; production builds run cleanly.

# AI Financial Research Terminal

> An enterprise-grade, full-stack equity research platform combining deterministic financial metrics with context-grounded Retrieval-Augmented Generation (RAG) powered by official corporate filings and conference-call transcripts.

---

## 1. Project Overview

The **AI Financial Research Terminal** provides equity analysts, portfolio managers, and individual investors with a unified institutional workstation for corporate fundamental analysis.

Unlike generic AI chatbots that calculate financial figures unpredictably and hallucinate numbers, this platform enforces a strict **separation of concerns**:
* **Deterministic Financials**: Historical statements (Revenue, EBITDA, Net Profit, EPS) and computed financial ratios (Operating Margin, Net Margin, RoE, Debt/Equity) are stored in PostgreSQL and calculated deterministically in backend code.
* **Context-Grounded Qualitative RAG**: A Python/FastAPI service uses **Qdrant** for document vectors, LangChain for retrieval and Gemini orchestration, and Ragas for repeatable evaluation over company filings and transcripts.
* **First-Class Transcript Processing**: Conference call transcripts preserve speaker designations (CEO, CFO, Analyst), distinguishing prepared executive remarks from critical Q&A inquiries.
* **Audit-Grade Citations**: Every factual claim is backed by explicit document titles, fiscal periods, page numbers (for PDFs), and speaker identities (for transcripts).

Anchor company for initial development: **ITC Limited (NSE: ITC)**.

---

## 2. Technology Stack

```text
Frontend:       React 18, Vite, JavaScript (ESM), Tailwind CSS, React Router, Recharts, Lucide Icons
Main Backend:   Node.js (ESM), Express.js, Drizzle ORM, PostgreSQL connection pool, JWT, bcrypt
AI / RAG:       Python 3.10+, FastAPI, LangChain, Google Gemini, SentenceTransformers (all-MiniLM-L6-v2, 384-d), Ragas
Databases:      PostgreSQL for relational app data; Qdrant for chunk vectors and retrieval metadata
Testing:        Node.js test runner, Pytest
Architecture:   Decoupled Dual-Backend Microservice Pattern (Express on 5000, FastAPI on 8000)
Methodology:    Solo-Developer Agile / Scrum (9 Iterative Sprints)
```

---

## 3. High-Level Architecture

```text
                    ┌──────────────────────────────────────────────┐
                    │            React Terminal UI                 │
                    │       Vite + Tailwind CSS (Port 5173)        │
                    │  • Financial Charts (Recharts) & Statement   │
                    │  • AI Analyst Panel with Clickable Citations │
                    │  • Direct PDF Viewer Modal (#page=X)         │
                    └──────────────┬───────────────────────────────┘
                                   │ HTTP/REST (JSON)
                                   │ JWT Bearer Auth
                                   ▼
                    ┌──────────────────────────────────────────────┐
                    │           Express.js API Gateway             │
                    │            Node.js ESM (Port 5000)           │
                    │  • Authentication (bcrypt + 24h JWT)         │
                    │  • Deterministic Ratio Engine (Margins, RoE) │
                    │  • Company Search & Financials APIs          │
                    │  • Chat Session & Message Persistence        │
                    └──────────────┬───────────────────────────────┘
                                   │
              ┌────────────────────┼────────────────────────────────┐
              │ SQL Queries        │ Proxy Query / Documents        │ Auth / Passwords
              ▼ (Drizzle ORM)      ▼ (HTTP / JSON)                  ▼ (bcrypt + JWT)
       ┌─────────────┐     ┌──────────────────────────────────┐     ┌─────────────┐
       │   Drizzle   │     │        Python RAG Microservice   │     │   Security  │
       │     ORM     │     │       FastAPI + Uvicorn (8000)   │     │   Engine    │
       └──────┬──────┘     │  • Domain Re-Ranking & Filters   │     └─────────────┘
              │            │  • Real PDF Financial Extractor  │
              │            │  • Streaming PDF (/documents/pdf)│
              │            └──────────────┬───────────────────┘
              │                           │
              │             ┌─────────────┴──────────────┐
              │             ▼ (Online)                   ▼ (Offline Fallback)
              │     ┌───────────────────┐        ┌───────────────────┐
              │     │   Google Gemini   │        │ Local Extractive  │
              │     │  gemini-2.5-flash │        │ Synthesis Engine  │
              │     └───────────────────┘        └───────────────────┘
              │                           │
              ▼                           ▼ Vector Search / Raw Chunks
       ┌─────────────────────────────────────────────────────────────┐
       │  PostgreSQL (app data)     │       Qdrant (RAG vectors)       │
       │ users, companies, metrics, │       chunks + embeddings +      │
       │ documents, chats, watchlist│       citation metadata          │
       └───────────────────────────┴──────────────────────────────────┘
```

---

## 4. Repository Structure

```text
Financial_terminal/
├── .gitignore                      # Git ignore for Node, Python venv, DB, secrets
├── README.md                       # Master project README & system overview
│
├── docs/                           # Comprehensive Engineering Documentation
│   ├── 01-project-overview/        # Vision, Problem Statement, Objectives, Scope
│   ├── 02-requirements/            # Functional, Non-Functional, User Stories
│   ├── 03-agile/                   # Backlog, Sprint Plan, Sprint Reports, DoD, Risk Register
│   ├── 04-architecture/            # System, Backend, RAG Architecture, ADRs
│   ├── 05-database/                # Schema definitions and Mermaid ER Diagram
│   ├── 06-api/                     # Complete REST API contracts (Express & FastAPI)
│   ├── 07-rag/                     # RAG Pipeline, Ingestion, Transcripts, Evaluation
│   ├── 08-testing/                 # Test Plan, Test Cases, Sprint Baseline Reports
│   ├── 09-security/                # Authentication, Injection defense, File security
│   └── 10-deployment/              # Local environment setup and non-Docker deployment
│
├── backend/                        # [Sprints 1-3] Express.js Main Application & API Gateway
│   ├── src/controllers/            # auth, company, chat controllers
│   ├── src/services/               # financial ratio math, company, auth, chat services
│   ├── src/middleware/             # JWT auth & error handling middleware
│   └── tests/                      # Automated API & deterministic math test suites
│
├── frontend/                       # [Sprint 4, 6] React 18 + Vite Terminal UI
│   ├── src/components/company/     # FinancialCharts (Recharts), FinancialTable, SearchBar
│   ├── src/components/chat/        # AiAnalystPanel, EvidenceDrawer, LlmSettingsModal
│   ├── src/pages/                  # HomePage, CompanyPage, LoginPage, RegisterPage
│   └── src/context/                # AuthContext state management
│
└── rag-service/                    # [Sprints 5-7] Python FastAPI RAG Service
    ├── app/generation/             # LangChain Gemini chain & offline extractive fallback
    ├── app/retrieval/              # Qdrant vector search with metadata filters and re-ranking
    ├── app/ingestion/              # PDF extractor, transcript parser, chunker, PDF financials parser
    ├── app/embeddings/             # SentenceTransformers 384-d LangChain embedding adapter
    ├── app/evaluation/             # Ragas benchmark dataset, runner, legacy migration helper
    └── tests/                      # Ingestion, chunking, and health test suites
```

---

## 5. Development Roadmap & Sprint Status

| Sprint | Phase | Deliverable | Status |
| :--- | :--- | :--- | :--- |
| **Sprint 0** | **Planning & Architecture** | Architecture, Schemas, API Specs, ADRs, Agile Docs | **Completed** |
| **Sprint 1** | **Express + PostgreSQL + Drizzle** | Core backend scaffolding, connection pool, migrations, `/api/health` | **Completed** |
| **Sprint 2** | **Authentication & Security** | User registration, bcrypt hashing, JWT auth, protected `/me` | **Completed** |
| **Sprint 3** | **Companies & Financials** | Deterministic ratio engine (Gross/Op/Net Margin, RoE, D/E, FCF), company search | **Completed** |
| **Sprint 4** | **React Frontend Terminal** | Modern dark terminal UI, Recharts visualization, statement tables, auth flows | **Completed** |
| **Sprint 5** | **Python RAG & Ingestion** | PDF text extractor, transcript speaker parser, chunker, Qdrant vectors | **Completed** |
| **Sprint 6** | **AI Analyst & Grounded Chat** | LangChain Gemini generation, grounded answers, citations drawer, click-to-PDF | **Completed** |
| **Sprint 7** | **Advanced Features & Automation** | Real PDF financial extraction (`extract_pdf_financials.py`), dynamic multi-year compilation, interactive filings hub | **In Progress** (Watchlists & Eval next) |
| **Sprint 8** | **Testing, Security & Deployment** | Full integration test harness, security audit, non-Docker production deployment runbook | Planned |

---

## 6. How to Run Locally

### Prerequisites
* **Node.js**: v18+ LTS
* **Python**: v3.10+ (tested on Python 3.12)
* **PostgreSQL**: v15+ for relational application data
* **Qdrant**: local service or Qdrant Cloud for document vectors

### Step-by-Step Setup

1. **Database Setup**:
   ```sql
   CREATE DATABASE financial_terminal;
   \c financial_terminal;
   ```

   Start the local Qdrant service from the repository root with `docker compose up -d qdrant`, or set `QDRANT_URL` and `QDRANT_API_KEY` for Qdrant Cloud.

2. **Express Backend**:
   ```bash
   cd backend
   npm install
   npm run db:push
   npm run dev
   # Runs on http://localhost:5000
   ```

3. **Python RAG Service**:
   ```bash
   cd rag-service
   python -m venv venv
   venv\Scripts\activate       # Windows (or source venv/bin/activate on Unix)
   pip install -r requirements.txt
   ```
   Add your Google Gemini API key to `rag-service/.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/financial_terminal
   QDRANT_URL=http://localhost:6333
   QDRANT_COLLECTION=financial_documents
   LLM_MODEL=gemini-2.5-flash
   ```
   Run the RAG service:
   ```bash
   uvicorn app.main:app --reload --port 8000
   # Runs on http://localhost:8000
   ```

4. **React Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   # Runs on http://localhost:5173
   ```

5. **Run Automated Tests**:
   ```bash
   # Backend tests (API & Financial Math)
   cd backend && npm test

   # RAG Service tests (Ingestion & Parsing)
   cd rag-service && pytest tests/
   ```

6. **Run RAG quality evaluation** (after ingesting the benchmark source documents and configuring `GEMINI_API_KEY`):
   ```bash
   cd rag-service
   python -m app.evaluation.runner
   ```
   The runner saves measured JSON and CSV results under `rag-service/reports/`.

---

## 7. Engineering Documentation Directory

For complete technical specifications, see the [`docs/`](docs/) directory:
* [Project Vision](docs/01-project-overview/project-vision.md)
* [Sprint Plan & Roadmap](docs/03-agile/sprint-plan.md)
* [Product Backlog](docs/03-agile/product-backlog.md)
* [System Architecture](docs/04-architecture/system-architecture.md)
* [Database Schema](docs/05-database/schema.md)
* [Entity Relationship Diagram](docs/05-database/ER-DIAGRAM.md)
* [REST API Documentation](docs/06-api/API-DOCUMENTATION.md)
* [RAG Pipeline Specification](docs/07-rag/RAG-PIPELINE.md)
* [Transcript Processing](docs/07-rag/TRANSCRIPT-PROCESSING.md)
* [Architecture Decision Records (ADRs)](docs/04-architecture/architecture-decisions/)

# AI Financial Research Terminal

> An enterprise-grade, full-stack equity research platform combining deterministic financial metrics with context-grounded Retrieval-Augmented Generation (RAG) powered by official corporate filings and conference-call transcripts.

---

## 1. Project Overview

The **AI Financial Research Terminal** provides equity analysts, portfolio managers, and individual investors with a unified institutional workstation for corporate fundamental analysis.

Unlike generic AI chatbots that calculate financial figures unpredictably and hallucinate numbers, this platform enforces a strict **separation of concerns**:
* **Deterministic Financials**: Historical statements (Revenue, EBITDA, Net Profit, EPS) and computed financial ratios (Operating Margin, Net Margin, RoE, Debt/Equity) are stored in PostgreSQL and calculated deterministically in backend code.
* **Context-Grounded Qualitative RAG**: An intelligent AI analyst built with Python/FastAPI and **pgvector** answers qualitative inquiries (*"Why did operating margins decline?"*, *"What were management's growth expectations for FMCG?"*) using official annual reports, quarterly filings, and conference-call transcripts.
* **First-Class Transcript Processing**: Conference call transcripts preserve speaker designations (CEO, CFO, Analyst), distinguishing prepared executive remarks from critical Q&A inquiries.
* **Audit-Grade Citations**: Every factual claim is backed by explicit document titles, fiscal periods, page numbers (for PDFs), and speaker identities (for transcripts).

Anchor company for initial development: **ITC Limited (NSE: ITC)**.

---

## 2. Technology Stack

```text
Frontend:       React 18, Vite, JavaScript (ESM), Tailwind CSS, React Router, Recharts
Main Backend:   Node.js, Express.js, JavaScript (ESM), Drizzle ORM, JWT, bcrypt
AI / RAG:       Python 3.10+, FastAPI, Uvicorn, SentenceTransformers / OpenAI, PyPDF
Database:       PostgreSQL 15+ with pgvector extension
Testing:        Jest, Supertest, Pytest
Architecture:   Decoupled Dual-Backend, Microservice Pattern (No Docker)
Methodology:    Solo-Developer Agile / Scrum
```

---

## 3. High-Level Architecture

```text
                    ┌──────────────────────────────┐
                    │      React Terminal UI       │
                    │ Vite + JavaScript + Tailwind │
                    │       (Port 5173)            │
                    └──────────────┬───────────────┘
                                   │ HTTP/REST (JSON)
                                   │ JWT Bearer Auth
                                   ▼
                    ┌──────────────────────────────┐
                    │     Express.js API Gateway   │
                    │          Node.js (ESM)       │
                    │           (Port 5000)        │
                    └──────────────┬───────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │ SQL Queries        │ Proxy Query        │ Auth / Passwords
              ▼ (Drizzle ORM)      ▼ (HTTP / JSON)      ▼ (bcrypt + JWT)
       ┌─────────────┐     ┌──────────────┐     ┌─────────────┐
       │   Drizzle   │     │  Python RAG  │     │   Security  │
       │     ORM     │     │   FastAPI    │     │   Engine    │
       │             │     │ (Port 8000)  │     │             │
       └──────┬──────┘     └──────┬───────┘     └─────────────┘
              │                   │
              │                   │ Vector Search / Ingest
              │                   │
              ▼                   ▼
       ┌──────────────────────────────────┐
       │       PostgreSQL Database        │
       │       + pgvector Extension       │
       │           (Port 5432)            │
       └──────────────────────────────────┘
```

---

## 4. Repository Structure

```text
Financial_terminal/
├── .gitignore                      # Complete Git ignore for Node, Python, DB, secrets
├── README.md                       # Master project README
│
├── docs/                           # Comprehensive Engineering Documentation
│   ├── 01-project-overview/        # Vision, Problem Statement, Objectives, Scope
│   ├── 02-requirements/            # Functional, Non-Functional, User Stories
│   ├── 03-agile/                   # Backlog, Sprint Plan, Reports, DoD, Risk Register
│   ├── 04-architecture/            # System, Backend, RAG Architecture, ADRs
│   ├── 05-database/                # Schema definitions and Mermaid ER Diagram
│   ├── 06-api/                     # Complete REST API contracts (Express & FastAPI)
│   ├── 07-rag/                     # RAG Pipeline, Ingestion, Transcripts, Evaluation
│   ├── 08-testing/                 # Test Plan, Test Cases, Sprint 0 Baseline Report
│   ├── 09-security/                # Authentication, Injection defense, File security
│   └── 10-deployment/              # Local environment setup and non-Docker deployment
│
├── backend/                        # [Sprint 1] Express.js Main Application
├── frontend/                       # [Sprint 4] React + Vite Terminal UI
└── rag-service/                    # [Sprint 5] Python FastAPI RAG Service
```

---

## 5. Development Roadmap (9 Sprints)

| Sprint | Phase | Deliverable | Status |
| :--- | :--- | :--- | :--- |
| **Sprint 0** | **Planning & Architecture** | Architecture, Schemas, API Specs, ADRs, Agile Docs | **Completed** |
| **Sprint 1** | **Express + PostgreSQL + Drizzle** | Core backend scaffolding, connection pool, migrations | Next |
| **Sprint 2** | **Authentication & Security** | User registration, bcrypt hashing, JWT auth, protected routes | Planned |
| **Sprint 3** | **Companies & Financials** | Deterministic ratio engine, ITC data seeding, financial APIs | Planned |
| **Sprint 4** | **React Frontend Terminal** | Modern dark terminal UI, Recharts visualization, auth flows | Planned |
| **Sprint 5** | **Python RAG & Ingestion** | PDF/transcript parsers, chunking, pgvector embeddings | Planned |
| **Sprint 6** | **AI Analyst & Grounded Chat** | End-to-end RAG query endpoint, citations, chat history | Planned |
| **Sprint 7** | **Advanced Terminal Features** | Watchlist, company comparison, RAG evaluation framework | Planned |
| **Sprint 8** | **Testing, Security & Deployment** | Integration tests, security hardening, non-Docker runbook | Planned |

---

## 6. How to Run Locally

### Prerequisites
* **Node.js**: v18+ LTS
* **Python**: v3.10+
* **PostgreSQL**: v15+ with `pgvector` enabled

### Quick Commands (Once Implemented)

1. **Database**:
   ```sql
   CREATE DATABASE financial_terminal;
   \c financial_terminal;
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

2. **Express Backend**:
   ```bash
   cd backend
   npm install
   npm run db:push
   npm run dev
   ```

3. **Python RAG Service**:
   ```bash
   cd rag-service
   python -m venv venv
   venv\Scripts\activate  # Windows
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```

4. **React Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 7. Engineering Documentation Directory

For complete technical specifications, see the [`docs/`](docs/) directory:
* [Project Vision](docs/01-project-overview/project-vision.md)
* [System Architecture](docs/04-architecture/system-architecture.md)
* [Database Schema](docs/05-database/schema.md)
* [Entity Relationship Diagram](docs/05-database/ER-DIAGRAM.md)
* [REST API Documentation](docs/06-api/API-DOCUMENTATION.md)
* [RAG Pipeline Specification](docs/07-rag/RAG-PIPELINE.md)
* [Transcript Processing](docs/07-rag/TRANSCRIPT-PROCESSING.md)
* [Architecture Decision Records (ADRs)](docs/04-architecture/architecture-decisions/)

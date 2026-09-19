# System Architecture — AI Financial Research Terminal

## 1. High-Level Architecture Diagram

```text
                                 ┌─────────────────────────────────┐
                                 │         Client Browser          │
                                 │     React 18 + Vite (SPA)       │
                                 │  Tailwind CSS + Recharts (5173) │
                                 └───────────────┬─────────────────┘
                                                 │
                                                 │ HTTP / REST (JSON)
                                                 │ JWT Bearer Auth
                                                 ▼
                                 ┌─────────────────────────────────┐
                                 │       Main Application API      │
                                 │         Express.js (5000)       │
                                 │         Node.js (ESM)           │
                                 └───────┬─────────────────┬───────┘
                                         │                 │
                        ┌────────────────┘                 └───────────────┐
                        │ Internal SQL Queries                             │ HTTP / REST
                        │ (Drizzle ORM)                                    │ (JSON)
                        ▼                                                  ▼
         ┌───────────────────────────────┐                  ┌─────────────────────────────┐
         │       PostgreSQL Database     │                  │     Python RAG Service      │
         │      + pgvector Extension     │◄─────────────────┤     FastAPI + Uvicorn (8000)│
         │             (5432)            │  Direct Vector   │  LangChain/PyPDF/SentenceTx │
         └───────────────────────────────┘   Read & Ingest  └──────────────┬──────────────┘
                        ▲                                                  │
                        │                                                  │ Embeddings &
                        │                                                  │ Generation Calls
                        │                                                  ▼
                        │                                   ┌─────────────────────────────┐
                        └───────────────────────────────────┤       LLM & Embedding       │
                                  Store Chunks &            │       Provider (e.g.        │
                                  Vector Embeddings         │       OpenAI API)           │
                                                            └─────────────────────────────┘
```

---

## 2. Component Responsibilities

### A. Frontend Layer (React + Vite + Tailwind CSS)
* Runs on port `5173`.
* Single Page Application (SPA) offering an institutional-grade dark terminal interface.
* Manages authentication state (JWT storage and token refresh).
* Renders interactive financial data tables and charts using **Recharts**.
* Provides a real-time conversational AI drawer with expandable citations and evidence previews.
* **Strict Rule**: Never speaks directly to Python RAG service; all communication routes through Express.

### B. Main Application Backend (Node.js + Express.js)
* Runs on port `5000`.
* The gatekeeper and primary backend for client interactions.
* Manages user accounts, authentication, session tokens, and security.
* Executes deterministic calculations for financial ratios and metrics.
* Manages CRUD for watchlists, company profiles, documents metadata, and chat sessions.
* Relays chat queries to the Python RAG service, enriches responses with user session data, and saves dialogue to PostgreSQL.

### C. AI / RAG Microservice (Python + FastAPI)
* Runs on port `8000`.
* Dedicated exclusively to AI, PDF processing, transcript parsing, chunking, embedding generation, vector similarity search, and LLM orchestration.
* Accesses PostgreSQL directly for high-performance vector search operations on `document_chunks`.
* Implements the prompt engineering pipeline that forces factual attribution and citation structuring.

### D. Unified Persistence Layer (PostgreSQL + pgvector)
* Runs on port `5432`.
* Single source of truth for all system data:
  - Relational: Users, Companies, Financial Metrics, Documents Metadata, Chat Sessions, Messages, Watchlists.
  - Vector: Document and transcript chunk embeddings (`vector(1536)` or `vector(768)`).
* Managed via Drizzle ORM migrations for schemas and schema version control.

---

## 3. Communication Protocols & Ports

| Component | Host / Port | Protocol | Interacting Components |
| :--- | :--- | :--- | :--- |
| **Frontend** | `http://localhost:5173` | HTTP / REST | Express API (`http://localhost:5000/api/*`) |
| **Express API** | `http://localhost:5000` | HTTP / REST | React Frontend, PostgreSQL, Python RAG |
| **Python RAG** | `http://localhost:8000` | HTTP / REST | Express API, PostgreSQL, External LLM API |
| **PostgreSQL** | `localhost:5432` | TCP / Postgres Wire | Express API (via Drizzle), Python RAG (via psycopg/SQLAlchemy) |
| **External LLM**| HTTPS (`api.openai.com`) | HTTPS / REST | Python RAG Service |

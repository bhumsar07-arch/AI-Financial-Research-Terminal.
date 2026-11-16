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
         │ PostgreSQL relational data   │                  │     Python RAG Service      │
         │                              │                  │ FastAPI + Qdrant + LangChain│
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
* Reads document records from PostgreSQL and retrieves chunk vectors from Qdrant.
* Implements the prompt engineering pipeline that forces factual attribution and citation structuring.

### D. Persistence Layer (PostgreSQL + Qdrant)

* **PostgreSQL** stores users, companies, financial metrics, filing records, and chat data.
* **Qdrant** stores document chunks, embeddings, and retrieval/citation metadata.
* PostgreSQL runs on port `5432` and stores relational application data: users, companies, financial metrics, document metadata, chat sessions, messages, and watchlists.
* Qdrant stores document and transcript chunk embeddings (384 dimensions) plus retrieval and citation metadata.
* Drizzle ORM manages the PostgreSQL schema; Qdrant collections and indexes are initialized by the RAG service.

---

## 3. Communication Protocols & Ports

| Component | Host / Port | Protocol | Interacting Components |
| :--- | :--- | :--- | :--- |
| **Frontend** | `http://localhost:5173` | HTTP / REST | Express API (`http://localhost:5000/api/*`) |
| **Express API** | `http://localhost:5000` | HTTP / REST | React Frontend, PostgreSQL, Python RAG |
| **Python RAG** | `http://localhost:8000` | HTTP / REST | Express API, PostgreSQL, Qdrant, Gemini via LangChain |
| **PostgreSQL** | `localhost:5432` | TCP / Postgres Wire | Express API (via Drizzle), Python RAG (relational data) |
| **Qdrant** | `localhost:6333` | HTTP / REST | Python RAG vector retrieval |
| **External LLM**| HTTPS (`api.openai.com`) | HTTPS / REST | Python RAG Service |

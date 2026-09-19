# Project Scope — AI Financial Research Terminal

## 1. In-Scope Features

### Phase 1: Core Foundation (Sprints 1 – 4)
* **User Authentication**: Secure signup, login, JWT token issuance, password hashing with bcrypt, protected routes, and `/me` session verification.
* **Relational Schema**: PostgreSQL database managed via Drizzle ORM migrations for users, companies, financial statements, documents, chunks, and chats.
* **Company & Financial Services**: Express REST endpoints for company profiles, income statements, balance sheets, and key financial ratios.
* **Interactive Frontend Terminal**: React + Vite + Tailwind CSS dashboard with dark-mode financial terminal styling, Recharts visualization, and company search.
* **Anchor Company Data**: Complete, verified financial and qualitative dataset for **ITC Limited** (FY2021 – FY2025).

### Phase 2: AI & RAG Pipeline (Sprints 5 – 6)
* **Python FastAPI Service**: Dedicated service running Uvicorn for PDF parsing, text cleaning, chunking, and embedding generation.
* **pgvector Integration**: Storage of document and transcript embeddings directly within PostgreSQL.
* **Earnings Call Transcript Processing**: Custom parser extracting speaker identities, executive designations (CEO, CFO, Director), analyst organizations, and section markers (Prepared Remarks vs Q&A).
* **RAG Retrieval Engine**: Hybrid query execution combining vector similarity with metadata filters (company, document type, year, quarter, speaker).
* **Context Synthesis & Citations**: LLM prompt engineering strictly instructing attribution, factual alignment, and citation formatting.
* **Chat History**: Full persistence of user conversational threads and message history in PostgreSQL.

### Phase 3: Advanced Intelligence & Polish (Sprints 7 – 8)
* **Company Comparison**: Side-by-side structured financial comparison of multiple companies (e.g., ITC vs HUL vs Nestle India).
* **User Watchlist**: Personalized watchlist with quick-access performance widgets.
* **RAG Quality Evaluation**: Evaluation suite computing Faithfulness, Answer Relevance, and Retrieval Precision against ground-truth benchmarks.
* **Automated Document Ingestion**: Structured batch/scheduled ingestion pipeline for new filings and transcripts.
* **Automated & Integration Testing**: End-to-end tests for critical authentication, financial calculations, and RAG retrieval flows.

---

## 2. Out-of-Scope (Non-Goals)

To ensure focus, maintainability, and feasibility for a single developer, the following items are explicitly **excluded**:

1. **No Docker or Containerization**: The project runs locally via standard package managers (`npm`, `pip`, `venv`, native PostgreSQL).
2. **No High-Frequency / Real-Time Tick Feeds**: The terminal focuses on fundamental research, annual/quarterly reports, and conference calls; it is not an algorithmic trading platform.
3. **No Automated Trade Execution / Broker Integration**: No placement of buy/sell orders.
4. **No LLM-Generated Financial Calculations**: The LLM will never calculate ratios, margins, or compound growth rates; all math is deterministic.
5. **No Mobile Native App**: The interface is an optimized desktop/tablet responsive web application.
6. **No TypeScript**: As mandated, all JavaScript code is written in clean, modern vanilla JavaScript (ES Modules) on both frontend and Express backend.

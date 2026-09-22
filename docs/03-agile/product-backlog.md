# Product Backlog — AI Financial Research Terminal

This is the master backlog for the project. In accordance with the **Solo-Developer Agile Framework**, items are prioritized using MoSCoW (Must Have, Should Have, Could Have, Won't Have) and mapped to specific sprints.

---

## Master Backlog Table

| ID | Epic | User Story / Task Summary | Priority | Est. Points | Target Sprint | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **PB-001** | Planning | Sprint 0: Architecture, Schemas, API Specs & Agile Docs | **Must** | 5 | Sprint 0 | **Completed** |
| **PB-101** | Backend | Express.js project setup, environment configuration & logger | **Must** | 3 | Sprint 1 | **Completed** |
| **PB-102** | Database | PostgreSQL connection pool & Drizzle ORM configuration | **Must** | 3 | Sprint 1 | **Completed** |
| **PB-103** | Database | Initial Drizzle schema definition & migration setup | **Must** | 5 | Sprint 1 | **Completed** |
| **PB-104** | Backend | Centralized error handling middleware & base health check API | **Must** | 2 | Sprint 1 | **Completed** |
| **PB-201** | Auth | User registration endpoint with bcrypt hashing & validation | **Must** | 3 | Sprint 2 | **Completed** |
| **PB-202** | Auth | User login endpoint with JWT issuance | **Must** | 3 | Sprint 2 | **Completed** |
| **PB-203** | Auth | JWT verification middleware & protected `/me` profile route | **Must** | 3 | Sprint 2 | **Completed** |
| **PB-204** | Auth | Logout endpoint and token lifecycle management | **Should** | 2 | Sprint 2 | **Completed** |
| **PB-301** | Company | Companies table schema, seed script for ITC Limited profile | **Must** | 3 | Sprint 3 | **Completed** |
| **PB-302** | Financials| Financial metrics schema & seeding multi-year financial statements | **Must** | 5 | Sprint 3 | **Completed** |
| **PB-303** | Financials| Deterministic calculation engine for financial ratios & growth | **Must** | 5 | Sprint 3 | **Completed** |
| **PB-304** | Company | Express company search & financial data retrieval endpoints | **Must** | 3 | Sprint 3 | **Completed** |
| **PB-401** | Frontend | React + Vite + Tailwind CSS project scaffolding | **Must** | 3 | Sprint 4 | **Completed** |
| **PB-402** | Frontend | React Router layout, dark-mode terminal theme & navigation | **Must** | 3 | Sprint 4 | **Completed** |
| **PB-403** | Frontend | Login & Register pages with auth state management | **Must** | 5 | Sprint 4 | **Completed** |
| **PB-404** | Frontend | Dashboard & Company search autocomplete component | **Must** | 3 | Sprint 4 | **Completed** |
| **PB-405** | Frontend | Company overview & financial statement tables | **Must** | 5 | Sprint 4 | **Completed** |
| **PB-406** | Frontend | Interactive financial charts using Recharts | **Must** | 5 | Sprint 4 | **Completed** |
| **PB-501** | Python | FastAPI microservice project setup & Uvicorn config | **Must** | 3 | Sprint 5 | **Completed** |
| **PB-502** | Ingestion | PDF document text extraction and cleaning pipeline | **Must** | 5 | Sprint 5 | **Completed** |
| **PB-503** | Ingestion | Custom earnings-call transcript parser (speaker & section detection) | **Must** | 8 | Sprint 5 | **Completed** |
| **PB-504** | Vector DB | pgvector extension setup, vector column & HNSW/IVFFlat index | **Must** | 3 | Sprint 5 | **Completed** |
| **PB-505** | RAG | Semantic chunking with overlap & metadata tagging | **Must** | 5 | Sprint 5 | **Completed** |
| **PB-506** | RAG | Dense embedding generation & batch insertion to PostgreSQL | **Must** | 5 | Sprint 5 | **Completed** |
| **PB-601** | RAG | FastAPI `/query` endpoint: similarity retrieval with metadata filters | **Must** | 5 | Sprint 6 | **Completed** |
| **PB-602** | RAG | Domain re-ranking logic (lexical overlap + boilerplate suppression) | **Should** | 5 | Sprint 6 | **Completed** |
| **PB-603** | RAG | Prompt engineering with Google Gemini 3.6 Flash & local offline fallback | **Must** | 5 | Sprint 6 | **Completed** |
| **PB-604** | Backend | Express to FastAPI HTTP client integration & chat history storage | **Must** | 5 | Sprint 6 | **Completed** |
| **PB-605** | Frontend | Terminal AI chat interface with clickable citation drawer & PDF streaming | **Must** | 5 | Sprint 6 | **Completed** |
| **PB-701** | Features | User watchlist endpoints (CRUD) and frontend watchlist view | **Should** | 3 | Sprint 7 | Planned |
| **PB-702** | Features | Company comparison endpoint and side-by-side comparison table | **Should** | 5 | Sprint 7 | Planned |
| **PB-703** | Ingestion | Real PDF financial extractor (`extract_pdf_financials.py`) & filings viewer | **Could** | 5 | Sprint 7 | **Completed** |
| **PB-704** | Eval | RAG evaluation framework (Faithfulness, Precision, Recall benchmark) | **Must** | 5 | Sprint 7 | Planned |
| **PB-801** | Testing | Comprehensive unit and integration test suite (Node 8/8, Pytest 5/5) | **Must** | 5 | Sprint 8 | **In Progress** |
| **PB-802** | Security | Security hardening audit (rate limiting, CORS, input sanitization) | **Must** | 3 | Sprint 8 | Planned |
| **PB-803** | DevOps | Production deployment blueprint (without Docker) & final documentation | **Must** | 3 | Sprint 8 | Planned |

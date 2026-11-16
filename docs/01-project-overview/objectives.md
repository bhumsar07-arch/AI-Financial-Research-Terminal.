# Project Objectives — AI Financial Research Terminal

## 1. Functional Objectives

1. **Company & Financial Exploration**:
   - Enable users to search public companies (starting with anchor company **ITC Limited**).
   - Display multi-year and quarterly historical financial statements (Income Statement, Balance Sheet, Cash Flow).
   - Calculate and display core financial metrics (Gross Margin, Operating Margin, Net Margin, EBITDA, EPS, RoE, Debt-to-Equity).
   - Visualize financial trends using interactive charts (Recharts).

2. **Document & Transcript Repository**:
   - Provide an organized catalog of official corporate documents categorized by type:
     - `annual_report`
     - `quarterly_result`
     - `investor_presentation`
     - `conference_call_transcript`
     - `official_filing`
   - Allow users to view document metadata, download original sources, and view extracted transcript dialogues.

3. **Intelligent Financial RAG Assistant**:
   - Process natural language questions regarding company performance, strategic outlook, segment trends, and executive commentary.
   - Retrieve relevant text segments using semantic vector search and hybrid metadata filtering.
   - Distinguish speaker roles (Management vs Analyst) and context types (Prepared Remarks vs Q&A).
   - Generate grounded responses with explicit, verifiable citations (Document Title, Fiscal Year, Quarter, Page Number, Speaker).

4. **User Workflow & Collaboration**:
   - Secure user authentication with JWT, password hashing, and persistent profile state.
   - User-specific Watchlist management for tracking companies.
   - Persistent Chat Sessions allowing users to resume, review, or delete research threads.
   - Company comparison tool comparing key financial metrics side-by-side.

---

## 2. Technical Objectives

1. **Architectural Separation**:
   - Clean decoupled dual-backend architecture: Express.js as the core application API and Python/FastAPI as the dedicated AI/RAG engine.
2. **Deterministic Data Integrity**:
   - 100% of mathematical and ratio calculations executed in JavaScript backend logic; zero financial calculations delegated to the LLM.
3. **Robust Vector Storage**:
   - Qdrant stores 384-dimensional document embeddings and searchable citation metadata; PostgreSQL stores relational application data and filing records.
4. **Measurable RAG Evaluation**:
   - Use Ragas metrics for Faithfulness, Factual Correctness, Context Precision, and Context Recall; record retrieval and generation latency against a curated benchmark.
5. **Production Quality & Clean Code**:
   - Strict adherence to modular architecture, parameterized SQL via Drizzle ORM, input validation, defensive error handling, and comprehensive documentation.

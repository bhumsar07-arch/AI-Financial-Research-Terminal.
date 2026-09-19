# Functional Requirements — AI Financial Research Terminal

## 1. Module 1: Authentication & User Management (FR-AUTH)

* **FR-AUTH-01**: The system shall permit new users to register with full name, unique email address, and secure password (minimum 8 characters).
* **FR-AUTH-02**: Passwords must be hashed using `bcrypt` (or `argon2`) with appropriate salt rounds before storing in PostgreSQL. Plaintext passwords must never be logged or saved.
* **FR-AUTH-03**: The system shall authenticate users via email and password, issuing a signed JSON Web Token (JWT) with standard expiration (e.g., 24 hours).
* **FR-AUTH-04**: The system shall provide an endpoint (`GET /api/auth/me`) to return the authenticated user profile using the JWT bearer token.
* **FR-AUTH-05**: The system shall provide a logout endpoint (`POST /api/auth/logout`) that invalidates or clears the client-side session.
* **FR-AUTH-06**: Unauthorized requests to protected API endpoints must return an HTTP 401 Unauthorized status with a descriptive JSON error.

---

## 2. Module 2: Company & Financial Data Management (FR-FIN)

* **FR-FIN-01**: The system shall store company profiles (Ticker, Name, Sector, Industry, Description, Exchange, Currency, Website).
* **FR-FIN-02**: The system shall provide a company search endpoint (`GET /api/companies?search=...`) supporting fuzzy search by ticker or company name.
* **FR-FIN-03**: The system shall retrieve detailed company profile by ticker (`GET /api/companies/:ticker`).
* **FR-FIN-04**: The system shall store historical standardized financial statements across fiscal years and quarters:
  - Income Statement (Revenue, COGS, Gross Profit, Operating Expenses, EBITDA, Operating Profit, Depreciation, Interest, Tax, Net Profit, EPS).
  - Balance Sheet (Cash, Accounts Receivable, Inventory, Current Assets, Total Assets, Short-term Debt, Long-term Debt, Total Liabilities, Equity).
  - Cash Flow Statement (Operating Cash Flow, Capex, Free Cash Flow, Financing Cash Flow, Investing Cash Flow).
* **FR-FIN-05**: The system shall compute derived financial metrics and ratios deterministically in backend service logic:
  - Profitability: Gross Margin, Operating Margin, Net Margin, Return on Equity (RoE), Return on Assets (RoA).
  - Growth: YoY Revenue Growth, YoY Net Profit Growth, YoY EBITDA Growth.
  - Leverage & Health: Debt-to-Equity, Interest Coverage Ratio, Current Ratio.
* **FR-FIN-06**: The system shall deliver historical financial series formatted for visual charts (`GET /api/companies/:ticker/financials`).

---

## 3. Module 3: Document & Transcript Repository (FR-DOC)

* **FR-DOC-01**: The system shall store metadata for corporate disclosures:
  - Document types: `annual_report`, `quarterly_result`, `investor_presentation`, `conference_call_transcript`, `official_filing`, `press_release`.
  - Attributes: Document Title, Company ID, Fiscal Year, Fiscal Quarter, Document Date, Original URL, Local File Path, Page Count, File Size.
* **FR-DOC-02**: The system shall provide an endpoint to list documents for a company (`GET /api/companies/:ticker/documents`) filtered by document type or fiscal period.
* **FR-DOC-03**: The system shall store and serve conference call transcripts preserving speaker dialogues (`GET /api/companies/:ticker/transcripts`).

---

## 4. Module 4: Python AI & RAG Engine (FR-RAG)

* **FR-RAG-01**: The Python service shall ingest PDF documents, extract text, clean artifacts, and detect page boundaries.
* **FR-RAG-02**: The Python service shall parse earnings call transcripts, segmenting text by speaker name, role (CEO, CFO, Analyst), and section (`prepared_remarks` vs `q_and_a`).
* **FR-RAG-03**: The ingestion engine shall divide extracted content into semantic chunks (400–800 tokens) with configurable overlap (50–100 tokens), attaching rich metadata (Company ID, Doc Type, Year, Quarter, Page, Speaker, Section).
* **FR-RAG-04**: The service shall generate dense vector embeddings (e.g., using OpenAI `text-embedding-3-small` or HuggingFace sentence-transformers) and store them in PostgreSQL via `pgvector`.
* **FR-RAG-05**: The Python service shall provide a `/query` endpoint accepting a company ID, user question, and optional filters (fiscal year, quarter, document types).
* **FR-RAG-06**: The retrieval pipeline shall perform vector similarity search (cosine distance) with metadata pre-filtering, followed by optional cross-encoder reranking.
* **FR-RAG-07**: The generation engine shall construct a prompt incorporating deterministic company financials and retrieved text evidence, generating an answer with strict attribution rules.
* **FR-RAG-08**: The response must return an array of structured citations specifying Document Title, Document Type, Fiscal Period, Page Number (for PDFs), Speaker Name and Role (for Transcripts), and Source URL.

---

## 5. Module 5: Chat Sessions & User Workflow (FR-CHAT & FR-USER)

* **FR-CHAT-01**: The Express backend shall manage persistent chat sessions for authenticated users (`POST /api/chat/sessions`, `GET /api/chat/sessions`).
* **FR-CHAT-02**: Users can send questions within a session (`POST /api/chat`), which routes through Express to the Python RAG service and saves the prompt and grounded response to PostgreSQL.
* **FR-CHAT-03**: Users can view message history for any chat session (`GET /api/chat/sessions/:id/messages`) and delete past sessions (`DELETE /api/chat/sessions/:id`).
* **FR-USER-01**: Users can add companies to their personal watchlist (`POST /api/watchlist`), view watchlisted companies (`GET /api/watchlist`), and remove companies (`DELETE /api/watchlist/:companyId`).
* **FR-USER-02**: Users can request a side-by-side comparison of two or more companies across key financial metrics (`GET /api/companies/compare?tickers=ITC,HUL`).

---

## 6. Module 6: RAG Evaluation (FR-EVAL)

* **FR-EVAL-01**: The Python service shall maintain an automated evaluation runner testing a ground-truth dataset of financial queries.
* **FR-EVAL-02**: The evaluation suite shall compute and report:
  - Context Precision: Percentage of retrieved chunks that are truly relevant.
  - Context Recall: Percentage of ground-truth evidence successfully retrieved.
  - Faithfulness: Percentage of claims in the generated response directly supported by retrieved evidence.
  - Answer Relevance: Semantic alignment between the user's question and the generated answer.

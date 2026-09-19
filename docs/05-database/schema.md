# Database Schema Specification — PostgreSQL + pgvector

This document specifies the relational database schema implemented via **Drizzle ORM** for PostgreSQL.

---

## 1. Table Definitions

### 1.1 `users` Table
Stores authenticated user accounts.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | Primary Key | Unique user identifier |
| `name` | `VARCHAR(100)` | NOT NULL | User's full name |
| `email` | `VARCHAR(255)` | NOT NULL, UNIQUE | User's email address |
| `password_hash` | `VARCHAR(255)` | NOT NULL | bcrypt password hash |
| `role` | `VARCHAR(20)` | DEFAULT `'analyst'` | Access role (`analyst`, `admin`) |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | DEFAULT `NOW()` | Account creation timestamp |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | DEFAULT `NOW()` | Profile update timestamp |

---

### 1.2 `companies` Table
Stores public company profiles.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | Primary Key | Unique company identifier |
| `ticker` | `VARCHAR(20)` | NOT NULL, UNIQUE | Stock ticker symbol (e.g., `ITC`) |
| `name` | `VARCHAR(200)` | NOT NULL | Legal corporate name (`ITC Limited`) |
| `exchange` | `VARCHAR(50)` | NOT NULL | Primary exchange (`NSE`, `BSE`) |
| `sector` | `VARCHAR(100)` | NOT NULL | Industry sector (e.g., `Consumer Goods`) |
| `industry` | `VARCHAR(100)` | NOT NULL | Sub-industry (e.g., `Tobacco & FMCG`) |
| `description` | `TEXT` | NULL | Corporate summary & operational scope |
| `currency` | `VARCHAR(10)` | DEFAULT `'INR'` | Reporting currency |
| `website` | `VARCHAR(255)` | NULL | Official investor relations URL |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | DEFAULT `NOW()` | Row creation timestamp |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | DEFAULT `NOW()` | Row update timestamp |

---

### 1.3 `financial_metrics` Table
Stores historical standardized financial statements and computed metrics.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | Primary Key | Unique metrics row ID |
| `company_id` | `INTEGER` | Foreign Key -> `companies(id)` ON DELETE CASCADE | Target company |
| `period_type` | `VARCHAR(10)` | NOT NULL | `'annual'` or `'quarterly'` |
| `fiscal_year` | `INTEGER` | NOT NULL | e.g. `2024` |
| `fiscal_quarter` | `VARCHAR(5)` | NULL | `'Q1'`, `'Q2'`, `'Q3'`, `'Q4'`, or NULL for annual |
| `period_end_date` | `DATE` | NOT NULL | Period closing date |
| **Income Statement** | | | |
| `revenue` | `NUMERIC(15, 2)` | NOT NULL | Total gross sales / revenue from operations |
| `cogs` | `NUMERIC(15, 2)` | NULL | Cost of goods sold / raw materials |
| `gross_profit` | `NUMERIC(15, 2)` | NULL | Gross profit |
| `operating_expenses` | `NUMERIC(15, 2)` | NULL | Operating expenditures (SG&A, employee, etc.) |
| `ebitda` | `NUMERIC(15, 2)` | NOT NULL | Earnings before interest, tax, dep & amort |
| `operating_profit` | `NUMERIC(15, 2)` | NOT NULL | Operating profit (EBIT) |
| `depreciation` | `NUMERIC(15, 2)` | NULL | Depreciation & amortization |
| `interest_expense` | `NUMERIC(15, 2)` | NULL | Finance costs |
| `tax_expense` | `NUMERIC(15, 2)` | NULL | Tax provisions |
| `net_profit` | `NUMERIC(15, 2)` | NOT NULL | Net profit after tax (PAT) |
| `eps` | `NUMERIC(10, 2)` | NULL | Diluted earnings per share |
| **Balance Sheet** | | | |
| `total_assets` | `NUMERIC(15, 2)` | NULL | Total corporate assets |
| `current_assets` | `NUMERIC(15, 2)` | NULL | Short-term assets |
| `total_debt` | `NUMERIC(15, 2)` | NULL | Short-term + long-term borrowings |
| `total_liabilities` | `NUMERIC(15, 2)` | NULL | Total liabilities |
| `shareholder_equity`| `NUMERIC(15, 2)` | NULL | Net worth / equity |
| **Cash Flow** | | | |
| `operating_cash_flow`| `NUMERIC(15, 2)` | NULL | Cash from operations |
| `capital_expenditure`| `NUMERIC(15, 2)` | NULL | Capex |
| `free_cash_flow` | `NUMERIC(15, 2)` | NULL | OCF - Capex |
| **Derived Ratios (Deterministic Backend Calculations)** | | | |
| `gross_margin` | `NUMERIC(6, 2)` | NULL | (Gross Profit / Revenue) * 100 |
| `operating_margin`| `NUMERIC(6, 2)` | NULL | (Operating Profit / Revenue) * 100 |
| `net_margin` | `NUMERIC(6, 2)` | NULL | (Net Profit / Revenue) * 100 |
| `roe` | `NUMERIC(6, 2)` | NULL | (Net Profit / Equity) * 100 |
| `debt_to_equity` | `NUMERIC(6, 2)` | NULL | Total Debt / Equity |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | DEFAULT `NOW()` | Ingestion timestamp |

---

### 1.4 `documents` Table
Catalog of corporate filings and transcripts.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | Primary Key | Unique document identifier |
| `company_id` | `INTEGER` | Foreign Key -> `companies(id)` ON DELETE CASCADE | Associated company |
| `title` | `VARCHAR(255)` | NOT NULL | e.g., `ITC Annual Report FY24` |
| `document_type` | `VARCHAR(50)` | NOT NULL | `annual_report`, `quarterly_result`, `investor_presentation`, `conference_call_transcript`, `official_filing` |
| `fiscal_year` | `INTEGER` | NOT NULL | e.g., `2024` |
| `fiscal_quarter` | `VARCHAR(5)` | NULL | e.g., `'Q4'` or NULL |
| `document_date` | `DATE` | NOT NULL | Official release date |
| `source_url` | `TEXT` | NULL | Public URL to source file |
| `file_path` | `TEXT` | NULL | Local disk storage path |
| `page_count` | `INTEGER` | NULL | Total pages (for PDFs) |
| `file_size_bytes`| `BIGINT` | NULL | Size on disk |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | DEFAULT `NOW()` | Ingestion timestamp |

---

### 1.5 `document_chunks` Table (Vector Storage)
Stores partitioned text chunks and high-dimensional embeddings for RAG retrieval.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | Primary Key | Unique chunk identifier |
| `document_id` | `INTEGER` | Foreign Key -> `documents(id)` ON DELETE CASCADE | Parent document |
| `company_id` | `INTEGER` | Foreign Key -> `companies(id)` ON DELETE CASCADE | Denormalized company ID for fast filtering |
| `chunk_index` | `INTEGER` | NOT NULL | Sequential chunk order index |
| `content` | `TEXT` | NOT NULL | Extracted text chunk content |
| `token_count` | `INTEGER` | NOT NULL | Number of tokens |
| `page_number` | `INTEGER` | NULL | Source page number (for PDFs) |
| `speaker_name` | `VARCHAR(100)` | NULL | Name of speaker (e.g. `Sanjiv Puri`) |
| `speaker_role` | `VARCHAR(100)` | NULL | Role (e.g. `Chairman & MD`, `Analyst`) |
| `is_management` | `BOOLEAN` | DEFAULT `FALSE` | TRUE if executive; FALSE if analyst/other |
| `section` | `VARCHAR(100)` | NULL | e.g. `MD&A`, `Prepared Remarks`, `Q&A` |
| `embedding` | `vector(1536)` | NULL | Dense pgvector embedding (or 768 for small models) |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | DEFAULT `NOW()` | Creation timestamp |

---

### 1.6 `chat_sessions` Table
Stores conversational research threads.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | Primary Key | Unique session ID |
| `user_id` | `INTEGER` | Foreign Key -> `users(id)` ON DELETE CASCADE | Owner user |
| `company_id` | `INTEGER` | Foreign Key -> `companies(id)` ON DELETE SET NULL | Focused company context |
| `title` | `VARCHAR(200)` | NOT NULL | Session title (e.g. `ITC Margin Drivers FY24`) |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | DEFAULT `NOW()` | Session start timestamp |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | DEFAULT `NOW()` | Last active timestamp |

---

### 1.7 `chat_messages` Table
Stores individual turns, answers, and structured citation links.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | Primary Key | Unique message ID |
| `session_id` | `INTEGER` | Foreign Key -> `chat_sessions(id)` ON DELETE CASCADE | Parent session |
| `role` | `VARCHAR(20)` | NOT NULL | `'user'` or `'assistant'` |
| `content` | `TEXT` | NOT NULL | Text prompt or generated response |
| `citations` | `JSONB` | NULL | Array of structured citation metadata objects |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | DEFAULT `NOW()` | Message timestamp |

---

### 1.8 `watchlists` Table
Stores user bookmarked companies.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | Primary Key | Unique bookmark ID |
| `user_id` | `INTEGER` | Foreign Key -> `users(id)` ON DELETE CASCADE | Owner user |
| `company_id` | `INTEGER` | Foreign Key -> `companies(id)` ON DELETE CASCADE | Bookmarked company |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | DEFAULT `NOW()` | Bookmark timestamp |

---

## 2. Key Database Indexes

1. **Vector Index (HNSW)**:
   ```sql
   CREATE INDEX idx_document_chunks_embedding 
   ON document_chunks 
   USING hnsw (embedding vector_cosine_ops);
   ```
2. **Metadata Filtering Composite Index**:
   ```sql
   CREATE INDEX idx_chunks_company_doc 
   ON document_chunks (company_id, document_id);
   ```
3. **Financial Statement Lookups**:
   ```sql
   CREATE UNIQUE INDEX idx_financials_unique_period 
   ON financial_metrics (company_id, period_type, fiscal_year, COALESCE(fiscal_quarter, 'FY'));
   ```
4. **Watchlist Constraint**:
   ```sql
   CREATE UNIQUE INDEX idx_watchlist_user_company 
   ON watchlists (user_id, company_id);
   ```

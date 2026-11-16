# Entity Relationship (ER) Diagram — AI Financial Research Terminal

This diagram illustrates the relational PostgreSQL schema. RAG vectors and chunk payloads are stored in Qdrant and are intentionally not represented as relational tables.

---

## 1. Visual Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o{ chat_sessions : "creates"
    users ||--o{ watchlists : "bookmarks"
    
    companies ||--o{ financial_metrics : "reports"
    companies ||--o{ documents : "publishes"
    companies ||--o{ watchlists : "tracked_in"
    companies ||--o{ chat_sessions : "context_for"


    chat_sessions ||--o{ chat_messages : "contains"

    users {
        int id PK
        string name
        string email UK
        string password_hash
        string role
        timestamp created_at
        timestamp updated_at
    }

    companies {
        int id PK
        string ticker UK
        string name
        string exchange
        string sector
        string industry
        text description
        string currency
        string website
        timestamp created_at
        timestamp updated_at
    }

    financial_metrics {
        int id PK
        int company_id FK
        string period_type
        int fiscal_year
        string fiscal_quarter
        date period_end_date
        decimal revenue
        decimal cogs
        decimal gross_profit
        decimal operating_expenses
        decimal ebitda
        decimal operating_profit
        decimal net_profit
        decimal eps
        decimal total_assets
        decimal total_debt
        decimal shareholder_equity
        decimal operating_cash_flow
        decimal gross_margin
        decimal operating_margin
        decimal net_margin
        decimal roe
        decimal debt_to_equity
        timestamp created_at
    }

    documents {
        int id PK
        int company_id FK
        string title
        string document_type
        int fiscal_year
        string fiscal_quarter
        date document_date
        string source_url
        string file_path
        int page_count
        bigint file_size_bytes
        timestamp created_at
    }

    chat_sessions {
        int id PK
        int user_id FK
        int company_id FK
        string title
        timestamp created_at
        timestamp updated_at
    }

    chat_messages {
        int id PK
        int session_id FK
        string role
        text content
        jsonb citations
        timestamp created_at
    }

    watchlists {
        int id PK
        int user_id FK
        int company_id FK
        timestamp created_at
    }
```

---

## 2. Cardinality Descriptions

1. **User to Chat Sessions (`1 : N`)**: A user can initiate many research chat sessions. Each chat session belongs to exactly one user.
2. **Chat Session to Chat Messages (`1 : N`)**: A chat session contains an ordered sequence of user prompts and AI responses. If a session is deleted, its messages cascade-delete.
3. **User to Watchlist (`1 : N`) & Company to Watchlist (`1 : N`)**: Represents the many-to-many relationship between users and companies they follow, with a unique constraint on `(user_id, company_id)`.
4. **Company to Financial Metrics (`1 : N`)**: A company has many quarterly and annual historical financial records.
5. **Company to Documents (`1 : N`)**: A company publishes many documents (Annual Reports, Transcripts, Filings).
6. **Document to Qdrant Points (`1 : N`, logical link)**: A document's text is segmented into Qdrant points. Each point carries `document_id`, `company_id`, source page, speaker, and section metadata with a 384-dimensional vector; PostgreSQL foreign keys do not extend into Qdrant.

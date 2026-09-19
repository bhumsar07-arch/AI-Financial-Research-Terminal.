# ADR-002: Unified PostgreSQL Database with pgvector Extension

* **Status**: Accepted
* **Date**: September 2026

## Context
The financial terminal requires persistent storage for:
1. Highly structured relational data (users, companies, financial statements, chat sessions).
2. High-dimensional vector embeddings for semantic document search.

Using multiple databases (e.g., PostgreSQL for relational data plus Pinecone, Chroma, or Qdrant for vectors) introduces operational complexity, dual connection management, network latency, and synchronization overhead.

## Decision
We chose **PostgreSQL** with the **pgvector** extension as the single, unified database for both relational entities and vector embeddings. SQLite is strictly rejected due to lack of multi-user concurrency and institutional financial integrity.

## Rationale
1. **Single Source of Truth**: All application entities (users, watchlists, documents, text chunks, embeddings) live in one ACID-compliant database.
2. **ACID Transactions**: Relational financial statements and document embeddings can be managed with transactional guarantees.
3. **Hybrid Querying Power**: A single SQL query can join relational metadata filters (`company_id = 1 AND fiscal_year = 2024`) with vector distance ranking (`ORDER BY embedding <=> query_vector LIMIT 5`).
4. **No External SaaS Dependencies**: Zero reliance on third-party cloud vector SaaS platforms with rate limits or ongoing subscription costs.

## Consequences
* **Positive**: Unified backup, simple migrations via Drizzle, zero external vector syncing issues, production-proven reliability.
* **Negative**: Requires installing the `pgvector` extension locally in the native PostgreSQL server.

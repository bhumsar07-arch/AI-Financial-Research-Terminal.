# ADR-009: Qdrant for RAG Vectors, PostgreSQL for Relational Data

## Status

Accepted

## Decision

Use Qdrant to store document chunks, embeddings, and retrieval metadata. Keep PostgreSQL as the source of truth for users, companies, financial metrics, filing metadata, and chat history. Use LangChain integrations for Qdrant retrieval and Gemini generation, and Ragas for offline evaluation.

## Context

The earlier design placed relational application data and RAG vectors in PostgreSQL with pgvector. The project now needs an independent vector service and a repeatable RAG evaluation workflow. Dedicated vector storage separates vector indexing and metadata filtering from the application's transactional records.

## Consequences

- The RAG service needs a configured Qdrant endpoint and collection.
- Existing PostgreSQL chunks can be copied and re-embedded using `python -m app.evaluation.migrate_legacy_chunks`; the migration preserves legacy rows for review.
- PostgreSQL remains necessary for document IDs and application relationships.
- Qdrant unavailability degrades RAG retrieval, while relational API data remains in PostgreSQL.

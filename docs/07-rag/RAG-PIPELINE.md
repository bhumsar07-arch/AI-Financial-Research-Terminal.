# RAG Pipeline

## Data ownership

- **PostgreSQL** remains the source of truth for users, companies, financial metrics, filing records, and chat history.
- **Qdrant** stores searchable document chunks, 384-dimensional vectors, and citation metadata. The metadata includes company and document IDs, title, type, fiscal period, page, section, and transcript speaker.
- Original PDF files remain in the existing upload storage. PostgreSQL stores each document's path and descriptive metadata.

## Ingestion

1. Read and parse a filing PDF or earnings transcript.
2. Preserve page numbers, transcript speakers, roles, and section labels.
3. Split source text into overlapping chunks.
4. Create normalized vectors with `sentence-transformers/all-MiniLM-L6-v2` through the LangChain `Embeddings` interface.
5. Upsert chunks to the `financial_documents` Qdrant collection with stable IDs. Re-ingestion updates changed chunks and removes stale chunks only after the replacement points are written successfully.

PostgreSQL document records are committed separately from Qdrant points. If Qdrant is unavailable, the document metadata remains available and ingestion reports an error for the vector write.

## Query and generation

1. FastAPI receives a company-scoped question.
2. LangChain's Qdrant vector store embeds the question and retrieves matching chunks using a company metadata filter.
3. Lightweight keyword and domain re-ranking orders candidates while preserving document and speaker details.
4. A LangChain prompt/model/output chain calls Gemini with only retrieved evidence. The existing extractive answer path remains as an offline fallback.
5. The API returns the answer and structured citations, including source title, page, section, and speaker when available.

## Existing PostgreSQL chunk migration

To copy legacy `document_chunks` into Qdrant, configure both databases and run from `rag-service`:

```powershell
python -m app.evaluation.migrate_legacy_chunks
```

The command re-embeds and copies the old rows. It intentionally leaves the PostgreSQL rows intact so the migration can be checked before any manual cleanup.

# RAG Service Architecture

```text
React UI -> Express API -> FastAPI RAG service
                              |-> PostgreSQL: app records and filing metadata
                              |-> Qdrant: document chunks, embeddings, and citation metadata
                              |-> LangChain Gemini chain: grounded answer generation
                              `-> Ragas: offline benchmark and quality scores
```

The RAG service owns document parsing, chunking, embeddings, retrieval, answer generation, and evaluation. PostgreSQL is retained for relational application data. Qdrant is the only vector-search store.

The embedding model is `sentence-transformers/all-MiniLM-L6-v2` (384 dimensions). Qdrant filters every retrieval by `company_id`; document and transcript metadata are returned with each hit for citation construction. LangChain connects the Qdrant vector store and Gemini model. When Gemini is unavailable, the API can still return an extractive response from retrieved text.

The Ragas runner uses a versioned, curated question set and records context precision, context recall, faithfulness, factual correctness, citation source-title checks, and retrieval/generation latency. Its reports are saved under `rag-service/reports/` and should be treated as measured results only after a successful run.

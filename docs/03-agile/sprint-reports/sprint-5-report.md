# Sprint 5 Report — Python RAG & Document Ingestion Microservice

**Sprint Goal**: Build a standalone Python microservice on port 8000 that processes company transcripts and PDF filings, segments speakers, chunks text with sliding context, generates vector embeddings, and stores everything in PostgreSQL.

---

## 1. What Was Built & Delivered

1. **Git Branch Workflow**:
   - Created working branch: `python-rag-pipeline` (branched from `main`).

2. **Microservice Scaffolding (`rag-service/`)**:
   - Built with **FastAPI** and **Uvicorn** running on port 8000.
   - Pydantic v2 settings loading configuration from `.env`.
   - PostgreSQL database connection pool via `psycopg2`.
   - Health check endpoint (`GET /health`).

3. **PDF Text Extractor (`pdf_parser.py`)**:
   - Extracts text page-by-page from company annual filings using `pypdf`.
   - Preserves 1-based page numbers for citation tracking.
   - Computes SHA-256 checksums to avoid processing duplicate files.

4. **Conference Call Transcript Parser (`transcript_parser.py`)**:
   - Recognizes section transitions: **Prepared Remarks** vs **Question-and-Answer (Q&A)**.
   - Accurately identifies speakers and designations:
     - Management: Sanjiv Puri (Chairman & MD), Supratim Dutta (CFO).
     - Analysts: Percy Panthaki (CLSA), Vivek Maheshwari (Jefferies), Amit Sachdeva (HSBC).
   - Flags `is_management` so AI generation never confuses executive guidance with analyst questions.

5. **Semantic Chunker (`chunker.py`)**:
   - 500-token chunks with 60-token sliding overlap.
   - Retains speaker names, roles, and section metadata on every single chunk.

6. **Vector Embeddings Generator (`embedder.py`)**:
   - Produces normalized 384-dimensional dense vectors.
   - Includes cosine similarity math for vector search.

7. **Database Ingestion Pipeline (`pipeline.py`)**:
   - Ingested authentic **ITC Limited Q4 FY24 Earnings Conference Call Transcript**.
   - Created document record in `documents` table.
   - Stored 12 structured dialogue search chunks with vector embeddings in `document_chunks` table in PostgreSQL.

---

## 2. Test Verification Summary

Running `pytest tests/` in `rag-service/`:

```text
============================= test session starts =============================
platform win32 -- Python 3.12.4, pytest-9.1.1, pluggy-1.6.0
rootdir: D:\Financial_terminal\rag-service
configfile: pytest.ini
collected 5 items

tests\test_ingestion.py .....                                            [100%]

============================== 5 passed in 0.38s ==============================
```

All 5 tests passed:
1. `test_transcript_speaker_segmentation`: Passed.
2. `test_chunking_with_metadata`: Passed.
3. `test_embeddings_generation`: Passed.
4. `test_database_connection`: Passed.
5. `test_fastapi_health_endpoint`: Passed.

---

## 3. Next Sprint

* **Sprint 6 — AI Analyst (RAG Querying & Generation)**:
  - Connect user natural language questions to vector similarity search (`POST /query` in FastAPI).
  - Grounded prompt engineering with strict source attribution.
  - Express backend orchestration (`POST /api/chat`).
  - Interactive AI Analyst chat panel in React frontend with clickable citations and evidence previews.

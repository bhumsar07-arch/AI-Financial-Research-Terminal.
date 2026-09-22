from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
from pathlib import Path
import re
from app.config.settings import settings
from app.database.connection import check_db_health, get_db_connection, run_pgvector_migration
from app.ingestion.pipeline import ingest_itc_transcript, ingest_uploaded_documents
from app.retrieval.vector_search import search_chunks, get_document_context
from app.generation.generator import generate_answer, check_llm_status, set_gemini_key
from app.embeddings.embedder import embedder

app = FastAPI(
    title=settings.app_name,
    description="Dedicated AI, Transcript Processing, and Vector RAG Microservice for Financial Research",
    version="3.0.0",
)

# Allow Cross-Origin Resource Sharing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Run pgvector migration on startup (idempotent — safe to run every time)."""
    print("[Startup] Running pgvector migration...")
    result = run_pgvector_migration()
    if result.get("pgvector_extension"):
        print(f"[Startup] pgvector ready. Column added: {result['column_added']}, Index: {result['index_created']}, Backfilled: {result['backfill_count']} rows")
    else:
        print(f"[Startup] pgvector not available — using Python brute-force fallback. ({result.get('error', '')})")
    
    # Pre-load the embedding model (downloads on first use)
    print(f"[Startup] Embedding model: {embedder.model_name} (semantic={embedder.is_semantic})")


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------

class QueryRequest(BaseModel):
    query: str = Field(..., min_length=3, description="The analyst's natural language question")
    company_id: int = Field(..., description="Company ID to scope the search")
    ticker: str = Field(default="ITC", description="Company ticker symbol")
    top_k: int = Field(default=5, ge=1, le=20, description="Number of evidence passages to retrieve")
    use_llm: Optional[str] = Field(default=None, description="Force LLM provider: 'gemini', 'openai', or None for auto")


class IngestRequest(BaseModel):
    ticker: str = Field(default="ITC", description="Company ticker to ingest documents for")


class SetKeyRequest(BaseModel):
    api_key: str = Field(..., min_length=8, description="Google Gemini API key")


# ---------------------------------------------------------------------------
# Health & Status Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health_check():
    """Service health check endpoint."""
    db_alive = check_db_health()
    return {
        "status": "ok" if db_alive else "degraded",
        "service": "rag-service",
        "version": "3.0.0",
        "database": {
            "connected": db_alive,
        },
        "embedding": {
            "model": embedder.model_name,
            "is_semantic": embedder.is_semantic,
            "dimension": settings.embedding_dimension,
        },
    }


# ---------------------------------------------------------------------------
# Ingestion Endpoints
# ---------------------------------------------------------------------------

@app.post("/ingest/transcript")
def trigger_transcript_ingestion():
    """Trigger ingestion of sample ITC Limited earnings transcript."""
    try:
        chunk_count = ingest_itc_transcript()
        return {
            "success": True,
            "message": "ITC transcript ingested successfully",
            "chunks_stored": chunk_count,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ingest/documents")
def trigger_document_ingestion(request: IngestRequest = IngestRequest()):
    """
    Scans the data/uploads/ folder for PDF files and ingests them.
    Also reports conference call transcript availability.
    """
    try:
        results = ingest_uploaded_documents(ticker=request.ticker)
        return {
            "success": True,
            "message": f"Document ingestion complete for {request.ticker}",
            "concall_status": results["concall_status"],
            "ingested": results["ingested"],
            "skipped": results["skipped"],
            "errors": results["errors"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# RAG Query Endpoint
# ---------------------------------------------------------------------------

@app.post("/query")
def query_analyst(request: QueryRequest):
    """
    AI Research Analyst endpoint.
    1. Retrieves relevant evidence chunks via vector similarity search.
    2. Generates a grounded answer with speaker attribution.
    3. Returns structured citations for the frontend evidence drawer.
    """
    try:
        # Step 1: Retrieve relevant chunks
        print(f"[Query] Question: '{request.query}' | Company ID: {request.company_id}")
        chunks = search_chunks(
            query=request.query,
            company_id=request.company_id,
            top_k=request.top_k,
        )

        # Step 2: Get document context (for concall availability)
        doc_context = get_document_context(request.company_id)

        # Step 3: Generate grounded answer with citations
        result = generate_answer(
            query=request.query,
            retrieved_chunks=chunks,
            use_llm=request.use_llm,
        )

        return {
            "success": True,
            "query": request.query,
            "answer": result["answer"],
            "citations": result["citations"],
            "source_count": result["source_count"],
            "llm_provider": result["llm_provider"],
            "engine_details": result.get("engine_details", {}),
            "concall_available": result["concall_available"],
            "documents_available": doc_context,
        }

    except Exception as e:
        print(f"[Query] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Document Context Endpoint
# ---------------------------------------------------------------------------

@app.get("/documents/{company_id}")
def get_company_documents(company_id: int):
    """Returns a list of ingested documents for a company, with concall availability."""
    try:
        context = get_document_context(company_id)
        return {
            "success": True,
            "company_id": company_id,
            **context,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# PDF Document Streaming Endpoint
# ---------------------------------------------------------------------------

@app.get("/documents/{document_id}/pdf")
def stream_document_pdf(document_id: int):
    """
    Streams raw PDF file directly to browser with inline disposition
    so user can view filings and presentations in the native browser PDF viewer.
    """
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "SELECT id, title, file_path FROM documents WHERE id = %s;",
            (document_id,)
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Document #{document_id} not found in database")

        doc_id, title, file_path_str = row
        if not file_path_str:
            raise HTTPException(status_code=404, detail="No PDF file associated with this document")

        file_path = Path(file_path_str)
        if not file_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"PDF file not found on disk at {file_path_str}"
            )

        clean_title = re.sub(r'[^a-zA-Z0-9_\-\. ]', '_', title or "document")
        return FileResponse(
            path=str(file_path),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'inline; filename="{clean_title}.pdf"'
            }
        )
    finally:
        cur.close()
        conn.close()


# ---------------------------------------------------------------------------
# LLM Engine Status & Management Endpoints
# ---------------------------------------------------------------------------

@app.get("/llm/status")
def get_llm_status(test: bool = False):
    """
    Returns the active LLM engine (Gemini vs Local Extractive Synthesis),
    configuration health, and optional live ping test results.
    """
    try:
        status_info = check_llm_status(test_ping=test)
        return {
            "success": True,
            **status_info,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/llm/set-key")
def configure_gemini_key(req: SetKeyRequest):
    """
    Validates provided Gemini API key with a test call and persists to .env.
    Instantly enables Gemini 2.0 Flash for all subsequent analyst queries.
    """
    try:
        result = set_gemini_key(req.api_key)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

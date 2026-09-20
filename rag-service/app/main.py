from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings
from app.database.connection import check_db_health
from app.ingestion.pipeline import ingest_itc_transcript

app = FastAPI(
    title=settings.app_name,
    description="Dedicated AI, Transcript Processing, and Vector RAG Microservice for Financial Research",
    version="1.0.0",
)

# Allow Cross-Origin Resource Sharing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    """Service health check endpoint."""
    db_alive = check_db_health()
    return {
        "status": "ok" if db_alive else "degraded",
        "service": "rag-service",
        "database": {
            "connected": db_alive,
        },
        "embedding_dimension": settings.embedding_dimension,
    }

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

import pytest
import numpy as np
from pathlib import Path
from app.ingestion.transcript_parser import TranscriptParser
from app.ingestion.chunker import chunker
from app.embeddings.embedder import embedder
from app.database.connection import check_db_health

def test_transcript_speaker_segmentation():
    """Verify that transcript parser accurately extracts speakers, roles, and management flags."""
    sample_transcript = """
=== Prepared Remarks ===

Sanjiv Puri - Chairman and Managing Director:
Our gross revenue for the full year crossed 76,800 Crores.

Supratim Dutta - Chief Financial Officer:
Segment margins contracted sharply due to domestic wood cost inflation.

=== Question-and-Answer Session ===

Percy Panthaki - Analyst, CLSA:
Can you explain why operating margins contracted in Agri-Business?

Supratim Dutta - Chief Financial Officer:
The government-mandated export bans on non-basmati rice impacted trading revenue.
"""

    turns = TranscriptParser.parse_transcript(sample_transcript)
    assert len(turns) == 4, f"Expected 4 turns, got {len(turns)}"

    # Turn 1: Sanjiv Puri (Prepared Remarks, Management)
    assert turns[0]["speaker_name"] == "Sanjiv Puri"
    assert "Chairman" in turns[0]["speaker_role"]
    assert turns[0]["is_management"] is True
    assert turns[0]["section"] == "Prepared Remarks"
    assert "76,800 Crores" in turns[0]["content"]

    # Turn 2: Supratim Dutta (Prepared Remarks, Management)
    assert turns[1]["speaker_name"] == "Supratim Dutta"
    assert "Chief Financial Officer" in turns[1]["speaker_role"]
    assert turns[1]["is_management"] is True
    assert turns[1]["section"] == "Prepared Remarks"

    # Turn 3: Percy Panthaki (Q&A Session, External Analyst)
    assert turns[2]["speaker_name"] == "Percy Panthaki"
    assert "Analyst" in turns[2]["speaker_role"]
    assert turns[2]["is_management"] is False
    assert turns[2]["section"] == "Q&A Session"

    # Turn 4: Supratim Dutta (Q&A Session, Management)
    assert turns[3]["speaker_name"] == "Supratim Dutta"
    assert turns[3]["is_management"] is True
    assert turns[3]["section"] == "Q&A Session"

def test_chunking_with_metadata():
    """Verify that chunker produces search chunks with complete metadata attribution."""
    turns = [
        {
            "speaker_name": "Supratim Dutta",
            "speaker_role": "Chief Financial Officer",
            "is_management": True,
            "section": "Q&A Session",
            "content": "The geopolitical disruptions and export restrictions on agricultural commodities impacted our volumes.",
        }
    ]

    chunks = chunker.chunk_transcript_turns(turns, company_id=1, document_id=10)
    assert len(chunks) == 1
    c = chunks[0]
    assert c["company_id"] == 1
    assert c["document_id"] == 10
    assert c["speaker_name"] == "Supratim Dutta"
    assert c["is_management"] is True
    assert c["section"] == "Q&A Session"
    assert c["token_count"] > 0
    assert "Supratim Dutta (Chief Financial Officer):" in c["content"]

def test_embeddings_generation():
    """Verify vector dimension, L2 normalization, and semantic cosine similarity."""
    emb1 = embedder.embed_text("ITC agribusiness revenue export restrictions wheat rice")
    emb2 = embedder.embed_text("Government export bans on non-basmati rice and agricultural commodities")
    emb3 = embedder.embed_text("Unrelated sentence about solar eclipse and cosmic space astronomy")

    assert len(emb1) == 384
    # Check L2 normalization (norm should equal 1.0)
    norm = np.linalg.norm(np.array(emb1))
    assert abs(norm - 1.0) < 1e-4

    # Related financial sentences should have higher similarity than astronomy sentence
    sim_related = embedder.cosine_similarity(emb1, emb2)
    sim_unrelated = embedder.cosine_similarity(emb1, emb3)

    assert sim_related > sim_unrelated, f"Expected {sim_related} > {sim_unrelated}"

def test_database_connection():
    """Verify PostgreSQL database connectivity from Python."""
    assert check_db_health() is True, "Database should be reachable and healthy"

def test_fastapi_health_endpoint():
    """Verify FastAPI GET /health endpoint."""
    from starlette.testclient import TestClient
    from app.main import app
    client = TestClient(app)
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["service"] == "rag-service"
    assert data["database"]["connected"] is True

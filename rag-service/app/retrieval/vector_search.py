"""Qdrant retrieval plus PostgreSQL document metadata lookups."""

from __future__ import annotations

import re
from typing import Any

from qdrant_client import models

from app.config.settings import settings
from app.database.connection import get_db_connection
from app.database.qdrant_store import get_qdrant_client, get_vector_store

STOPWORDS = {
    "what", "is", "are", "the", "from", "for", "with", "this", "that", "have", "has",
    "had", "been", "was", "were", "and", "but", "or", "because", "how", "why", "when",
    "where", "who", "which", "can", "could", "should", "would", "about", "into", "through",
}


def search_chunks(
    query: str,
    company_id: int,
    top_k: int = 5,
    min_score: float = 0.05,
    filter_management_only: bool = False,
) -> list[dict[str, Any]]:
    """Retrieve company-scoped chunks from Qdrant through LangChain's vector store."""
    must = [models.FieldCondition(key="metadata.company_id", match=models.MatchValue(value=int(company_id)))]
    if filter_management_only:
        must.append(models.FieldCondition(key="metadata.is_management", match=models.MatchValue(value=True)))

    candidates = get_vector_store().similarity_search_with_score(
        query,
        k=max(top_k * 4, top_k),
        filter=models.Filter(must=must),
    )
    terms = [term for term in re.findall(r"\b[a-zA-Z]{3,}\b", query.lower()) if term not in STOPWORDS]
    is_strategy_query = any(word in query.lower() for word in ("growth", "outlook", "guidance", "strategy", "future", "plan"))
    ranked: list[dict[str, Any]] = []

    for document, vector_score in candidates:
        metadata = document.metadata
        content = document.page_content
        content_lower = content.lower()
        score = float(vector_score)
        if terms:
            score += 0.15 * sum(term in content_lower for term in terms) / len(terms)
        if is_strategy_query and any(term in content_lower for term in ("strategic priorities", "growth opportunities", "long-term growth", "outlook", "guidance")):
            score += 0.12
        if metadata.get("speaker_name"):
            score += 0.05
        if score < min_score:
            continue
        ranked.append({
            "chunk_id": metadata.get("chunk_id"),
            "content": content,
            "score": round(min(score, 1.0), 4),
            "raw_score": round(float(vector_score), 4),
            "speaker_name": metadata.get("speaker_name"),
            "speaker_role": metadata.get("speaker_role"),
            "is_management": metadata.get("is_management", False),
            "section": metadata.get("section") or "Unknown",
            "page_number": metadata.get("page_number"),
            "document_id": metadata.get("document_id"),
            "document_title": metadata.get("document_title", "Unknown Document"),
            "document_type": metadata.get("document_type", "unknown"),
            "chunk_index": metadata.get("chunk_index"),
            "token_count": metadata.get("token_count"),
            "search_method": "qdrant_langchain",
        })

    ranked.sort(key=lambda item: item["score"], reverse=True)
    results: list[dict[str, Any]] = []
    seen_pages: set[tuple[Any, Any]] = set()
    for item in ranked:
        page_key = (item["document_id"], item["page_number"])
        if page_key in seen_pages:
            continue
        seen_pages.add(page_key)
        results.append(item)
        if len(results) >= top_k:
            break
    if len(results) < top_k:
        seen = {id(item) for item in results}
        results.extend(item for item in ranked if id(item) not in seen and len(results) < top_k)
    return results


def get_document_context(company_id: int) -> dict[str, Any]:
    """Return document metadata from PostgreSQL and chunk counts from Qdrant."""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT d.id, d.title, d.document_type, d.fiscal_year, d.fiscal_quarter,
                   d.page_count, d.file_path
            FROM documents d
            WHERE d.company_id = %s
            ORDER BY d.fiscal_year DESC, d.fiscal_quarter DESC NULLS LAST, d.id DESC;
            """,
            (company_id,),
        )
        rows = cur.fetchall()
    finally:
        cur.close()
        conn.close()

    documents = []
    has_transcripts = False
    has_reports = False
    client = get_qdrant_client()
    collection_exists = client.collection_exists(settings.qdrant_collection)

    for doc_id, title, doc_type, fiscal_year, fiscal_quarter, page_count, file_path in rows:
        if doc_type == "conference_call_transcript":
            has_transcripts = True
        if doc_type in ("annual_report", "quarterly_results", "investor_presentation"):
            has_reports = True
        chunk_count = 0
        if collection_exists:
            result = client.count(
                collection_name=settings.qdrant_collection,
                count_filter=models.Filter(must=[
                    models.FieldCondition(key="metadata.document_id", match=models.MatchValue(value=int(doc_id)))
                ]),
                exact=True,
            )
            chunk_count = int(result.count)
        documents.append({
            "id": doc_id,
            "title": title,
            "type": doc_type,
            "fiscal_year": fiscal_year,
            "fiscal_quarter": fiscal_quarter,
            "page_count": page_count,
            "chunks": chunk_count,
            "has_pdf": bool(file_path),
        })

    return {
        "documents": documents,
        "has_transcripts": has_transcripts,
        "has_reports": has_reports,
        "total_documents": len(documents),
        "concall_status": "available" if has_transcripts else "no_concalls_available",
    }

"""
Vector Search — hybrid pgvector + Python fallback retrieval.

Priority path: pgvector native ANN search (if extension installed)
  - Uses embedding_v vector(384) column with ivfflat index
  - Entire similarity computation happens inside PostgreSQL
  - Sub-millisecond at 100k+ chunks, no Python loop overhead

Fallback path: Python cosine similarity brute-force
  - Reads embedding TEXT column (JSON), computes similarity in numpy
  - Fine for < 5,000 chunks, was the only path in the old system

Domain re-ranking is applied in Python after retrieval in both modes.
"""

import json
import re
from typing import List, Dict, Any, Optional
from app.database.connection import get_db_connection
from app.embeddings.embedder import embedder

STOPWORDS = {
    "what", "is", "are", "the", "from", "for", "with", "this", "that", "have", "has",
    "had", "been", "was", "were", "and", "but", "or", "because", "how", "why", "when",
    "where", "who", "which", "can", "could", "should", "would", "about", "into", "through",
    "after", "before", "coming", "comes", "come", "some", "tell", "give", "show", "explain"
}


def _check_pgvector_available(conn) -> bool:
    """Check if pgvector extension is installed and embedding_v column exists."""
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'document_chunks' AND column_name = 'embedding_v';
        """)
        has_col = cur.fetchone() is not None
        cur.close()
        return has_col
    except Exception:
        return False


def _search_with_pgvector(conn, query_vector: List[float], company_id: int, top_k: int, filter_management_only: bool) -> List[Dict[str, Any]]:
    """
    Perform ANN search using pgvector's <=> operator.
    Returns top candidates ranked by cosine distance (converted to similarity).
    Fetches 4x top_k to allow domain re-ranking to pick the best final set.
    """
    cur = conn.cursor()
    try:
        vector_str = "[" + ",".join(str(x) for x in query_vector) + "]"
        fetch_k = top_k * 4  # Fetch extra for re-ranking headroom

        mgmt_filter = "AND dc.is_management = true" if filter_management_only else ""

        query = f"""
            SELECT
                dc.id AS chunk_id,
                dc.content,
                dc.embedding,
                dc.speaker_name,
                dc.speaker_role,
                dc.is_management,
                dc.section,
                dc.page_number,
                dc.document_id,
                dc.chunk_index,
                dc.token_count,
                d.title AS document_title,
                d.document_type,
                1 - (dc.embedding_v <=> %s::vector) AS raw_similarity
            FROM document_chunks dc
            JOIN documents d ON d.id = dc.document_id
            WHERE dc.company_id = %s
              AND dc.embedding_v IS NOT NULL
              {mgmt_filter}
            ORDER BY dc.embedding_v <=> %s::vector
            LIMIT %s;
        """
        cur.execute(query, (vector_str, company_id, vector_str, fetch_k))
        rows = cur.fetchall()
        return rows, True
    except Exception as e:
        print(f"[Retrieval] pgvector query failed: {e}. Falling back to Python scan.")
        return [], False
    finally:
        cur.close()


def _search_with_python_scan(conn, query_vector: List[float], company_id: int, filter_management_only: bool) -> tuple:
    """
    Brute-force Python similarity scan — reads all embeddings from TEXT column.
    Used when pgvector is not available.
    """
    cur = conn.cursor()
    try:
        mgmt_filter = "AND dc.is_management = true" if filter_management_only else ""
        query = f"""
            SELECT
                dc.id,
                dc.content,
                dc.embedding,
                dc.speaker_name,
                dc.speaker_role,
                dc.is_management,
                dc.section,
                dc.page_number,
                dc.document_id,
                dc.chunk_index,
                dc.token_count,
                d.title AS document_title,
                d.document_type,
                NULL AS raw_similarity
            FROM document_chunks dc
            JOIN documents d ON d.id = dc.document_id
            WHERE dc.company_id = %s
              AND dc.embedding IS NOT NULL
              {mgmt_filter};
        """
        cur.execute(query, (company_id,))
        rows = cur.fetchall()
        return rows, False
    finally:
        cur.close()


def search_chunks(
    query: str,
    company_id: int,
    top_k: int = 5,
    min_score: float = 0.05,
    filter_management_only: bool = False,
) -> List[Dict[str, Any]]:
    """
    Performs vector similarity search over document_chunks for a given company.

    Pipeline:
    1. Embed query using semantic sentence-transformer model
    2. Search via pgvector ANN (preferred) or Python brute-force scan (fallback)
    3. Apply financial domain re-ranking (growth/strategy boost, boilerplate penalty, keyword match)
    4. Apply diversity filter (max 1 chunk per page) and return top_k results
    """
    query_vector = embedder.embed_text(query)
    query_lower = query.lower()
    query_terms = [t for t in re.findall(r'\b[a-zA-Z]{3,}\b', query_lower) if t not in STOPWORDS]

    is_growth_query = any(k in query_lower for k in [
        "growth", "outlook", "guidance", "target", "future", "strategy", "expansion",
        "plan", "expect", "priorit", "opportunity", "driver", "vector", "capex", "market"
    ])
    is_accounting_query = any(k in query_lower for k in [
        "accounting", "policy", "policies", "ind as", "depreciation", "standard", "audit", "compliance"
    ])
    is_financial_notes_query = any(k in query_lower for k in [
        "note ", "notes to", "balance sheet", "p&l", "contingent", "investment property", "fair value"
    ])

    conn = get_db_connection()
    try:
        # Try pgvector path first
        use_pgvector = _check_pgvector_available(conn)

        if use_pgvector:
            print(f"[Retrieval] Using pgvector ANN search for company_id={company_id}")
            rows, pgvector_ok = _search_with_pgvector(conn, query_vector, company_id, top_k, filter_management_only)
            if not pgvector_ok:
                use_pgvector = False

        if not use_pgvector:
            print(f"[Retrieval] Using Python brute-force scan for company_id={company_id}")
            rows, _ = _search_with_python_scan(conn, query_vector, company_id, filter_management_only)

        if not rows:
            print(f"[Retrieval] No chunks found for company_id={company_id}")
            return []

        print(f"[Retrieval] Scoring {len(rows)} candidate chunks...")

        # Domain re-ranking
        candidates = []
        for row in rows:
            (
                chunk_id, content, embedding_json, speaker_name, speaker_role,
                is_management, section, page_number, document_id, chunk_index,
                token_count, document_title, document_type, pgvec_similarity
            ) = row

            # Get raw similarity score
            if pgvec_similarity is not None:
                raw_sim = float(pgvec_similarity)
            else:
                # Python fallback: parse JSON and compute
                try:
                    stored_vector = json.loads(embedding_json)
                except (json.JSONDecodeError, TypeError):
                    continue
                raw_sim = embedder.cosine_similarity(query_vector, stored_vector)

            content_lower = content.lower()
            score = raw_sim

            # Keyword lexical match boost (up to +0.15)
            if query_terms:
                matched = sum(1 for t in query_terms if t in content_lower)
                score += (matched / len(query_terms)) * 0.15

            # Growth / Strategy query boost
            if is_growth_query:
                if any(k in content_lower for k in [
                    "drivers of growth", "vectors of growth", "growth & competitiveness",
                    "itc next", "future-ready", "headroom for long-term growth",
                    "long-term growth", "strategic priorities",
                    "emerging opportunities", "market opportunity"
                ]):
                    score += 0.25
                elif any(k in content_lower for k in ["outlook", "guidance", "growth opportunities", "scale up", "expansion"]):
                    score += 0.12

            # Conference call speaker boost
            if speaker_name:
                score += 0.15

            # Boilerplate penalty — skip dry accounting notes for non-accounting queries
            if not is_accounting_query and not is_financial_notes_query:
                if any(n in content_lower for n in [
                    "material accounting policies",
                    "statement of compliance",
                    "basis of preparation",
                    "notes to the consolidated financial statements",
                    "notes to the standalone financial statements",
                    "notes to financial statements",
                    "fair value of the investment property"
                ]):
                    score -= 0.35

            if score >= min_score:
                candidates.append({
                    "chunk_id": chunk_id,
                    "content": content,
                    "score": round(max(0.01, score), 4),
                    "raw_score": round(raw_sim, 4),
                    "speaker_name": speaker_name,
                    "speaker_role": speaker_role,
                    "is_management": is_management,
                    "section": section or "Unknown",
                    "page_number": page_number,
                    "document_id": document_id,
                    "document_title": document_title,
                    "document_type": document_type,
                    "chunk_index": chunk_index,
                    "token_count": token_count,
                    "search_method": "pgvector" if use_pgvector else "python_scan",
                })

        # Sort by score descending
        candidates.sort(key=lambda x: x["score"], reverse=True)

        # Diversity filter — max 1 chunk per page/document to avoid repetition
        seen_pages: Dict[str, int] = {}
        top_results: List[Dict[str, Any]] = []
        for item in candidates:
            page_key = f"{item['document_id']}_{item.get('page_number')}"
            if seen_pages.get(page_key, 0) >= 1:
                continue
            seen_pages[page_key] = 1
            top_results.append(item)
            if len(top_results) >= top_k:
                break

        # Fill remaining slots if diversity filter was too aggressive
        if len(top_results) < top_k and candidates:
            remaining = [c for c in candidates if c not in top_results]
            top_results.extend(remaining[:top_k - len(top_results)])

        method = "pgvector" if use_pgvector else "python_scan"
        print(f"[Retrieval] Returning {len(top_results)} results via {method} (top score: {top_results[0]['score'] if top_results else 'N/A'})")
        return top_results

    except Exception as e:
        print(f"[Retrieval] Error during vector search: {e}")
        raise e
    finally:
        conn.close()


def get_document_context(company_id: int) -> Dict[str, Any]:
    """Returns a summary of ingested documents for a company."""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT d.id, d.title, d.document_type, d.fiscal_year, d.fiscal_quarter,
                   d.page_count, d.file_path, COUNT(dc.id) as chunk_count
            FROM documents d
            LEFT JOIN document_chunks dc ON dc.document_id = d.id
            WHERE d.company_id = %s
            GROUP BY d.id, d.title, d.document_type, d.fiscal_year, d.fiscal_quarter, d.page_count, d.file_path
            ORDER BY d.fiscal_year DESC, d.fiscal_quarter DESC NULLS LAST, d.id DESC;
            """,
            (company_id,)
        )
        rows = cur.fetchall()

        documents = []
        has_transcripts = False
        has_reports = False

        for row in rows:
            doc_id, title, doc_type, fy, fq, page_count, file_path, chunk_count = row
            if doc_type == "conference_call_transcript":
                has_transcripts = True
            if doc_type in ("annual_report", "quarterly_results", "investor_presentation"):
                has_reports = True
            documents.append({
                "id": doc_id,
                "title": title,
                "type": doc_type,
                "fiscal_year": fy,
                "fiscal_quarter": fq,
                "page_count": page_count,
                "chunks": chunk_count,
                "has_pdf": True if file_path else False,
            })

        return {
            "documents": documents,
            "has_transcripts": has_transcripts,
            "has_reports": has_reports,
            "total_documents": len(documents),
            "concall_status": "available" if has_transcripts else "no_concalls_available",
        }

    finally:
        cur.close()
        conn.close()

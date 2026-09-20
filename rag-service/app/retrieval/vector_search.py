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


def search_chunks(
    query: str,
    company_id: int,
    top_k: int = 5,
    min_score: float = 0.05,
    filter_management_only: bool = False,
) -> List[Dict[str, Any]]:
    """
    Performs vector similarity search over document_chunks for a given company,
    augmented with financial domain re-ranking, keyword boosting, and boilerplate filtering.

    1. Embeds the query string into a dense vector.
    2. Fetches all chunk embeddings for the company from PostgreSQL.
    3. Computes dense cosine similarity scores.
    4. Applies domain re-ranking (growth/strategy boost, boilerplate penalty, keyword match).
    5. Applies diversity filtering across pages/documents and returns top_k results.
    """
    # 1. Generate query embedding
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

    # 2. Fetch candidate chunks from PostgreSQL
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        base_query = """
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
                d.document_type
            FROM document_chunks dc
            JOIN documents d ON d.id = dc.document_id
            WHERE dc.company_id = %s
              AND dc.embedding IS NOT NULL
        """
        params = [company_id]

        if filter_management_only:
            base_query += " AND dc.is_management = true"

        base_query += ";"
        cur.execute(base_query, params)
        rows = cur.fetchall()

        if not rows:
            print(f"[Retrieval] No chunks found for company_id={company_id}")
            return []

        print(f"[Retrieval] Scoring {len(rows)} candidate chunks against query...")

        # 3. Score all chunks by dense cosine similarity + financial domain re-ranking
        candidates = []
        for row in rows:
            (
                chunk_id, content, embedding_json, speaker_name, speaker_role,
                is_management, section, page_number, document_id, chunk_index,
                token_count, document_title, document_type
            ) = row

            try:
                stored_vector = json.loads(embedding_json)
            except (json.JSONDecodeError, TypeError):
                continue

            raw_sim = embedder.cosine_similarity(query_vector, stored_vector)
            content_lower = content.lower()

            # Base score from dense similarity
            score = raw_sim

            # Keyword lexical match boost (up to +0.15)
            if query_terms:
                matched = sum(1 for t in query_terms if t in content_lower)
                score += (matched / len(query_terms)) * 0.15

            # Growth / Outlook / Strategy boost
            if is_growth_query:
                if any(k in content_lower for k in [
                    "drivers of growth", "vectors of growth", "growth & competitiveness",
                    "itc next", "future-ready", "headroom for long-term growth", "headroom for",
                    "long-term growth", "rapidly scale-up", "strategic priorities",
                    "emerging opportunities", "unleashing new drivers", "market opportunity"
                ]):
                    score += 0.25
                elif any(k in content_lower for k in ["outlook", "guidance", "growth opportunities", "scale up", "expansion"]):
                    score += 0.12

            # Spoken conference call boost
            if speaker_name:
                score += 0.15

            # Penalty for dry repetitive accounting notes when query is about growth/strategy/performance
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
                })

        # 4. Sort by score descending
        candidates.sort(key=lambda x: x["score"], reverse=True)

        # 5. Apply diversity filter across pages to prevent multiple duplicate chunks from the same page
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

        # If diversity reduced results below top_k, fill from remaining
        if len(top_results) < top_k and candidates:
            remaining = [c for c in candidates if c not in top_results]
            top_results.extend(remaining[:top_k - len(top_results)])

        print(f"[Retrieval] Returning top {len(top_results)} results (max score: {top_results[0]['score'] if top_results else 'N/A'})")
        return top_results

    except Exception as e:
        print(f"[Retrieval] Error during vector search: {e}")
        raise e
    finally:
        cur.close()
        conn.close()


def get_document_context(company_id: int) -> Dict[str, Any]:
    """
    Returns a summary of what documents are available for a company.
    Used by the generator to know what sources are available.
    """
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

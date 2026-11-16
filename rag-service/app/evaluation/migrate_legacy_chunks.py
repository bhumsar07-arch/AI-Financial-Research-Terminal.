"""One-time safe copy from legacy PostgreSQL chunks into Qdrant.

Run from rag-service with: python -m app.evaluation.migrate_legacy_chunks
This copies and re-embeds legacy chunks; it does not delete PostgreSQL rows.
"""

from collections import defaultdict

from app.database.connection import get_db_connection
from app.database.qdrant_store import replace_document_chunks


def migrate_legacy_chunks() -> int:
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT dc.document_id, dc.company_id, dc.chunk_index, dc.content, dc.token_count,
                   dc.page_number, dc.speaker_name, dc.speaker_role, dc.is_management, dc.section,
                   d.title, d.document_type, d.fiscal_year, d.fiscal_quarter, c.ticker
            FROM document_chunks dc
            JOIN documents d ON d.id = dc.document_id
            JOIN companies c ON c.id = dc.company_id
            ORDER BY dc.document_id, dc.chunk_index;
        """)
        rows = cur.fetchall()
    except Exception as exc:
        if "does not exist" in str(exc).lower():
            print("No legacy document_chunks table found; nothing to migrate.")
            return 0
        raise
    finally:
        cur.close()
        conn.close()

    grouped = defaultdict(list)
    metadata_by_document = {}
    for row in rows:
        doc_id, company_id, index, content, tokens, page, speaker, role, is_management, section, title, doc_type, fy, fq, ticker = row
        grouped[doc_id].append({
            "document_id": doc_id,
            "company_id": company_id,
            "chunk_index": index,
            "content": content,
            "token_count": tokens or 0,
            "page_number": page,
            "speaker_name": speaker,
            "speaker_role": role,
            "is_management": bool(is_management),
            "section": section,
        })
        metadata_by_document[doc_id] = {
            "document_title": title,
            "document_type": doc_type,
            "fiscal_year": fy,
            "fiscal_quarter": fq,
            "ticker": ticker,
        }

    migrated = 0
    for doc_id, chunks in grouped.items():
        migrated += replace_document_chunks(chunks, metadata_by_document[doc_id])
    print(f"Copied {migrated} legacy chunk(s) from PostgreSQL to Qdrant. Legacy rows were preserved.")
    return migrated


if __name__ == "__main__":
    migrate_legacy_chunks()

import os
import json
from pathlib import Path
from app.database.connection import get_db_connection
from app.ingestion.transcript_parser import TranscriptParser
from app.ingestion.chunker import chunker
from app.embeddings.embedder import embedder

def ingest_itc_transcript():
    """
    Ingests the Q4 FY24 conference call transcript for ITC Limited into PostgreSQL.
    Stores document metadata in 'documents' and structured chunks with speaker attribution in 'document_chunks'.
    """
    transcript_path = Path(__file__).parent.parent.parent / "data" / "itc_q4_fy24_transcript.txt"
    if not transcript_path.exists():
        raise FileNotFoundError(f"Transcript file not found at {transcript_path}")

    with open(transcript_path, "r", encoding="utf-8") as f:
        raw_text = f.read()

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # 1. Look up ITC in companies table
        cur.execute("SELECT id FROM companies WHERE ticker = 'ITC';")
        row = cur.fetchone()
        if not row:
            raise ValueError("Company with ticker 'ITC' not found in database. Run 'npm run db:seed' in backend first.")
        company_id = row[0]
        print(f"[Pipeline] Found ITC with ID: {company_id}")

        # 2. Check or insert document record
        doc_title = "ITC Limited Q4 FY24 Earnings Conference Call Transcript"
        cur.execute(
            """
            SELECT id FROM documents 
            WHERE company_id = %s AND title = %s;
            """,
            (company_id, doc_title)
        )
        existing_doc = cur.fetchone()

        if existing_doc:
            doc_id = existing_doc[0]
            print(f"[Pipeline] Document already exists with ID: {doc_id}. Cleaning existing chunks...")
            cur.execute("DELETE FROM document_chunks WHERE document_id = %s;", (doc_id,))
        else:
            cur.execute(
                """
                INSERT INTO documents (
                    company_id, title, document_type, fiscal_year, fiscal_quarter, 
                    document_date, source_url, file_path, file_size_bytes
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id;
                """,
                (
                    company_id,
                    doc_title,
                    "conference_call_transcript",
                    2024,
                    "Q4",
                    "2024-05-24",
                    "https://www.itcportal.com/investor/transcript-q4-24.pdf",
                    str(transcript_path),
                    len(raw_text.encode("utf-8")),
                )
            )
            doc_id = cur.fetchone()[0]
            print(f"[Pipeline] Created document record with ID: {doc_id}")

        # 3. Parse transcript into structured speaker turns
        print("[Pipeline] Parsing transcript speaker turns and Q&A sections...")
        turns = TranscriptParser.parse_transcript(raw_text)
        print(f"[Pipeline] Identified {len(turns)} speaker dialogue turns.")

        # 4. Chunk turns preserving speaker and role metadata
        print("[Pipeline] Chunking dialogue turns...")
        chunks = chunker.chunk_transcript_turns(turns, company_id=company_id, document_id=doc_id)
        print(f"[Pipeline] Created {len(chunks)} search chunks.")

        # 5. Generate dense vector embeddings
        print("[Pipeline] Generating vector embeddings for chunks...")
        contents = [c["content"] for c in chunks]
        embeddings = embedder.embed_batch(contents)

        # 6. Insert chunks into document_chunks table
        print("[Pipeline] Storing chunks in PostgreSQL document_chunks table...")
        insert_query = """
            INSERT INTO document_chunks (
                document_id, company_id, chunk_index, content, token_count,
                page_number, speaker_name, speaker_role, is_management, section, embedding
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """

        for c, emb in zip(chunks, embeddings):
            # Format embedding vector as JSON string
            emb_serialized = json.dumps(emb)
            cur.execute(
                insert_query,
                (
                    c["document_id"],
                    c["company_id"],
                    c["chunk_index"],
                    c["content"],
                    c["token_count"],
                    c["page_number"],
                    c["speaker_name"],
                    c["speaker_role"],
                    c["is_management"],
                    c["section"],
                    emb_serialized,
                )
            )

        conn.commit()
        print(f"[Pipeline] Successfully ingested {len(chunks)} chunks for {doc_title}! [OK]")
        return len(chunks)

    except Exception as e:
        conn.rollback()
        print(f"[Pipeline] Error during ingestion: {e}")
        raise e
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    ingest_itc_transcript()

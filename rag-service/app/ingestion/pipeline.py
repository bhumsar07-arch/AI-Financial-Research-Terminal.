import os
import json
from pathlib import Path
from psycopg2.extras import execute_values
from app.database.connection import get_db_connection
from app.ingestion.transcript_parser import TranscriptParser
from app.ingestion.pdf_parser import PDFParser
from app.ingestion.chunker import chunker
from app.embeddings.embedder import embedder
from app.ingestion.extract_pdf_financials import populate_extracted_financials

# Mapping of document type keywords to schema doc types
DOC_TYPE_MAP = {
    "quarterly": "quarterly_results",
    "ppt": "investor_presentation",
    "annual": "annual_report",
    "transcript": "conference_call_transcript",
}


def classify_document(filename: str) -> dict:
    """
    Classify a filename into document_type, fiscal_year, fiscal_quarter, and title.
    Supports specific filenames (e.g. annual_2025.pdf, itc_july2026.pdf)
    as well as standard convention patterns.
    """
    name_lower = filename.lower()
    import re

    # 1. Exact / known patterns from user uploads
    if "annual_2025" in name_lower or ("annual" in name_lower and "2025" in name_lower):
        return {
            "document_type": "annual_report",
            "fiscal_year": 2025,
            "fiscal_quarter": None,
            "title": "ITC Annual Report - FY25",
        }
    elif "annual_2026" in name_lower or ("annual" in name_lower and "2026" in name_lower):
        return {
            "document_type": "annual_report",
            "fiscal_year": 2026,
            "fiscal_quarter": None,
            "title": "ITC Annual Report - FY26",
        }
    elif "july2026" in name_lower or "july_2026" in name_lower or "q3" in name_lower:
        return {
            "document_type": "quarterly_results",
            "fiscal_year": 2026,
            "fiscal_quarter": "Q3",
            "title": "ITC Financial Results - Q3 FY26",
        }
    elif "may2026" in name_lower or "may_2026" in name_lower or "q4" in name_lower:
        return {
            "document_type": "investor_presentation",
            "fiscal_year": 2026,
            "fiscal_quarter": "Q4",
            "title": "ITC Investor Presentation & Results - Q4 FY26",
        }

    # 2. General heuristic detection
    doc_type = "other"
    fiscal_year = 2024
    fiscal_quarter = None

    if "ppt" in name_lower or "presentation" in name_lower:
        doc_type = "investor_presentation"
    elif "annual" in name_lower or "ar_" in name_lower:
        doc_type = "annual_report"
    elif "quarterly" in name_lower or "result" in name_lower:
        doc_type = "quarterly_results"
    elif "transcript" in name_lower or "concall" in name_lower:
        doc_type = "conference_call_transcript"

    fy_match_4d = re.search(r"20(\d{2})", name_lower)
    fy_match_2d = re.search(r"fy(\d{2})", name_lower)
    if fy_match_2d:
        fiscal_year = 2000 + int(fy_match_2d.group(1))
    elif fy_match_4d:
        fiscal_year = 2000 + int(fy_match_4d.group(1))

    q_match = re.search(r"(q[1-4])", name_lower)
    if q_match:
        fiscal_quarter = q_match.group(1).upper()

    return {
        "document_type": doc_type,
        "fiscal_year": fiscal_year,
        "fiscal_quarter": fiscal_quarter,
        "title": None,
    }


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


def ingest_uploaded_documents(ticker: str = "ITC"):
    """
    Scans the data/uploads/ folder for PDF files and ingests each one.
    Also checks if a conference call transcript exists and reports if missing.
    Returns a summary dict with results for each file.
    """
    uploads_dir = Path(__file__).parent.parent.parent / "data" / "uploads"
    if not uploads_dir.exists():
        uploads_dir.mkdir(parents=True, exist_ok=True)

    conn = get_db_connection()
    cur = conn.cursor()

    results = {
        "ingested": [],
        "skipped": [],
        "errors": [],
        "concall_status": "not_found",
    }

    try:
        # Look up company
        cur.execute("SELECT id FROM companies WHERE ticker = %s;", (ticker,))
        row = cur.fetchone()
        if not row:
            raise ValueError(f"Company with ticker '{ticker}' not found in database.")
        company_id = row[0]
        print(f"[Pipeline] Found {ticker} with company ID: {company_id}")

        # Check if conference call transcripts exist in DB already
        cur.execute(
            "SELECT COUNT(*) FROM documents WHERE company_id = %s AND document_type = 'conference_call_transcript';",
            (company_id,)
        )
        concall_count = cur.fetchone()[0]
        if concall_count > 0:
            results["concall_status"] = "available"
            print(f"[Pipeline] Conference call transcripts: {concall_count} found in database.")
        else:
            results["concall_status"] = "no_concalls_available"
            print("[Pipeline] WARNING: No conference call transcripts available for this company.")

        # Get all PDF files in uploads directory
        pdf_files = sorted([f for f in uploads_dir.iterdir() if f.suffix.lower() == ".pdf"])
        if not pdf_files:
            print("[Pipeline] No PDF files found in data/uploads/. Nothing to ingest.")
            return results

        print(f"[Pipeline] Found {len(pdf_files)} PDF file(s) to process.")

        for pdf_path in pdf_files:
            filename = pdf_path.name
            print(f"\n[Pipeline] --- Processing: {filename} ---")

            try:
                # Read PDF bytes
                file_bytes = pdf_path.read_bytes()

                # Classify document
                classification = classify_document(filename)
                doc_type = classification["document_type"]
                fiscal_year = classification["fiscal_year"]
                fiscal_quarter = classification["fiscal_quarter"]

                doc_title = classification.get("title")
                if not doc_title:
                    doc_title = f"{ticker} {doc_type.replace('_', ' ').title()} - FY{str(fiscal_year)[2:]}"
                    if fiscal_quarter:
                        doc_title = f"{ticker} {doc_type.replace('_', ' ').title()} - {fiscal_quarter} FY{str(fiscal_year)[2:]}"

                print(f"[Pipeline]   Title: {doc_title} | Type: {doc_type} | FY: {fiscal_year} | Quarter: {fiscal_quarter}")

                # Check if already ingested (by title)
                cur.execute(
                    "SELECT id FROM documents WHERE company_id = %s AND title = %s;",
                    (company_id, doc_title)
                )
                existing = cur.fetchone()
                if existing:
                    doc_id = existing[0]
                    print(f"[Pipeline]   Document already exists (ID: {doc_id}). Re-ingesting...")
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
                            doc_type,
                            fiscal_year,
                            fiscal_quarter,
                            f"{fiscal_year}-03-31",  # Default to fiscal year-end
                            None,
                            str(pdf_path),
                            len(file_bytes),
                        )
                    )
                    doc_id = cur.fetchone()[0]
                    print(f"[Pipeline]   Created document record with ID: {doc_id}")

                # Extract pages from PDF
                print("[Pipeline]   Extracting text from PDF pages...")
                pages = PDFParser.extract_pages(file_bytes)

                if not pages:
                    print(f"[Pipeline]   WARNING: No extractable text found in {filename}. Skipping.")
                    results["skipped"].append({"file": filename, "reason": "No extractable text"})
                    continue

                # Update page count
                cur.execute(
                    "UPDATE documents SET page_count = %s WHERE id = %s;",
                    (len(pages), doc_id)
                )
                print(f"[Pipeline]   Extracted text from {len(pages)} pages.")

                # Chunk pages
                chunks = chunker.chunk_pdf_pages(pages, company_id=company_id, document_id=doc_id)
                print(f"[Pipeline]   Created {len(chunks)} search chunks.")

                # Generate embeddings
                print("[Pipeline]   Generating vector embeddings...")
                contents = [c["content"] for c in chunks]
                embeddings = embedder.embed_batch(contents)

                # Store chunks in batch using execute_values
                insert_query = """
                    INSERT INTO document_chunks (
                        document_id, company_id, chunk_index, content, token_count,
                        page_number, speaker_name, speaker_role, is_management, section, embedding
                    ) VALUES %s;
                """
                chunk_tuples = [
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
                        json.dumps(emb),
                    )
                    for c, emb in zip(chunks, embeddings)
                ]
                execute_values(cur, insert_query, chunk_tuples, page_size=200)

                conn.commit()
                results["ingested"].append({
                    "file": filename,
                    "doc_id": doc_id,
                    "chunks": len(chunks),
                    "pages": len(pages),
                    "type": doc_type,
                })
                print(f"[Pipeline]   [OK] Ingested {len(chunks)} chunks for {doc_title}")

            except Exception as file_err:
                conn.rollback()
                print(f"[Pipeline]   ERROR processing {filename}: {file_err}")
                results["errors"].append({"file": filename, "error": str(file_err)})

        return results

    except Exception as e:
        conn.rollback()
        print(f"[Pipeline] Error during batch ingestion: {e}")
        raise e
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    print("=" * 60)
    print("  ITC Financial Document Ingestion Pipeline")
    print("=" * 60)

    # Step 1: Ingest transcript if available
    transcript_path = Path(__file__).parent.parent.parent / "data" / "itc_q4_fy24_transcript.txt"
    if transcript_path.exists():
        print("\n[Step 1] Ingesting conference call transcript...")
        ingest_itc_transcript()
    else:
        print("\n[Step 1] No conference call transcript found. Skipping.")

    # Step 2: Ingest uploaded PDF documents
    print("\n[Step 2] Ingesting uploaded PDF documents...")
    results = ingest_uploaded_documents(ticker="ITC")

    # Step 3: Populate extracted financial statements from filings
    print("\n[Step 3] Syncing extracted financial statements with PostgreSQL...")
    populate_extracted_financials(ticker="ITC")

    # Step 4: Summary
    print("\n" + "=" * 60)
    print("  INGESTION SUMMARY")
    print("=" * 60)
    print(f"  Conference Calls: {results['concall_status'].upper()}")
    print(f"  Documents Ingested: {len(results['ingested'])}")
    for doc in results["ingested"]:
        print(f"    - {doc['file']} ({doc['type']}, {doc['chunks']} chunks, {doc['pages']} pages)")
    if results["skipped"]:
        print(f"  Skipped: {len(results['skipped'])}")
        for s in results["skipped"]:
            print(f"    - {s['file']}: {s['reason']}")
    if results["errors"]:
        print(f"  Errors: {len(results['errors'])}")
        for e in results["errors"]:
            print(f"    - {e['file']}: {e['error']}")
    print("=" * 60)

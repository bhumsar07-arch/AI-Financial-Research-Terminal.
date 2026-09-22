"""
Database connection helpers for the RAG service.

Includes automatic pgvector migration:
  - Installs pgvector extension if available
  - Adds embedding_v vector(384) column to document_chunks
  - Creates ivfflat index for ANN search
  - Safe to run multiple times (all statements use IF NOT EXISTS / IF NOT EXISTS patterns)
"""

import psycopg2
from psycopg2.extras import RealDictCursor
from app.config.settings import settings


def get_db_connection():
    try:
        conn = psycopg2.connect(settings.database_url)
        return conn
    except Exception as e:
        print(f"[Database] Error connecting to PostgreSQL: {e}")
        raise e


def check_db_health() -> bool:
    """Quick connectivity check."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1;")
        cur.fetchone()
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"[Database] Health check failed: {e}")
        return False


def run_pgvector_migration() -> dict:
    """
    Idempotent migration to enable pgvector-native vector search.

    Steps:
      1. Install pgvector extension (requires PostgreSQL ≥ 13 with pgvector installed)
      2. Add embedding_v vector(384) column to document_chunks
      3. Create ivfflat index (if > 0 rows exist; index requires data to tune list count)
      4. Backfill embedding_v from existing JSON TEXT embeddings where possible

    Returns a dict describing what was done.
    """
    result = {
        "pgvector_extension": False,
        "column_added": False,
        "index_created": False,
        "backfill_count": 0,
        "error": None,
    }

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # 1. Try to install pgvector extension
        try:
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            conn.commit()
            result["pgvector_extension"] = True
            print("[pgvector] Extension enabled.")
        except Exception as e:
            conn.rollback()
            result["error"] = f"pgvector extension not available: {e}"
            print(f"[pgvector] Extension not available (not installed on this PostgreSQL): {e}")
            print("[pgvector] Falling back to Python brute-force search.")
            return result

        # 2. Add embedding_v vector column if not present
        cur.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'document_chunks' AND column_name = 'embedding_v';
        """)
        if not cur.fetchone():
            cur.execute("ALTER TABLE document_chunks ADD COLUMN embedding_v vector(384);")
            conn.commit()
            result["column_added"] = True
            print("[pgvector] Added embedding_v vector(384) column to document_chunks.")
        else:
            print("[pgvector] embedding_v column already exists.")

        # 3. Backfill embedding_v from JSON TEXT column (for already-ingested chunks)
        cur.execute("""
            SELECT COUNT(*) FROM document_chunks
            WHERE embedding IS NOT NULL AND embedding_v IS NULL;
        """)
        backfill_needed = cur.fetchone()[0]

        if backfill_needed > 0:
            print(f"[pgvector] Backfilling {backfill_needed} rows from TEXT embedding to vector...")
            cur.execute("""
                UPDATE document_chunks
                SET embedding_v = embedding::vector
                WHERE embedding IS NOT NULL AND embedding_v IS NULL;
            """)
            conn.commit()
            result["backfill_count"] = backfill_needed
            print(f"[pgvector] Backfilled {backfill_needed} rows.")

        # 4. Create ivfflat index (if enough rows exist)
        cur.execute("SELECT COUNT(*) FROM document_chunks WHERE embedding_v IS NOT NULL;")
        vec_count = cur.fetchone()[0]

        # Check if index already exists
        cur.execute("""
            SELECT indexname FROM pg_indexes
            WHERE tablename = 'document_chunks' AND indexname = 'idx_document_chunks_embedding_v';
        """)
        index_exists = cur.fetchone() is not None

        if not index_exists and vec_count > 0:
            # ivfflat lists: roughly sqrt(N) but at least 1
            lists = max(1, min(100, int(vec_count ** 0.5)))
            cur.execute(f"""
                CREATE INDEX idx_document_chunks_embedding_v
                ON document_chunks
                USING ivfflat (embedding_v vector_cosine_ops)
                WITH (lists = {lists});
            """)
            conn.commit()
            result["index_created"] = True
            print(f"[pgvector] Created ivfflat index (lists={lists}) on {vec_count} vectors.")
        elif index_exists:
            print("[pgvector] ivfflat index already exists.")

        return result

    except Exception as e:
        conn.rollback()
        result["error"] = str(e)
        print(f"[pgvector] Migration error: {e}")
        return result
    finally:
        cur.close()
        conn.close()

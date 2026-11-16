"""PostgreSQL connections for relational financial and document metadata."""

import psycopg2

from app.config.settings import settings


def get_db_connection():
    """Open a PostgreSQL connection for the application's relational data."""
    return psycopg2.connect(settings.database_url)


def check_db_health() -> bool:
    """Return whether PostgreSQL is reachable."""
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1;")
        cur.fetchone()
        return True
    except Exception as exc:
        print(f"[Database] Health check failed: {exc}")
        return False
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

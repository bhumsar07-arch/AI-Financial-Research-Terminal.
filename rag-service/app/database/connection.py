import psycopg2
from psycopg2.extras import RealDictCursor
from app.config.settings import settings

# Database connection helper
def get_db_connection():
    try:
        conn = psycopg2.connect(settings.database_url)
        return conn
    except Exception as e:
        print(f"[Database] Error connecting to PostgreSQL: {e}")
        raise e

# Quick check if database is alive and reachable
def check_db_health():
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

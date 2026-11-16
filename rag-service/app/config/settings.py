import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    app_name: str = "Financial Research RAG Microservice"
    port: int = int(os.getenv("PORT", 8000))
    database_url: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/financial_terminal"
    )
    embedding_dimension: int = int(os.getenv("EMBEDDING_DIMENSION", 384))
    chunk_size: int = int(os.getenv("CHUNK_SIZE", 500))
    chunk_overlap: int = int(os.getenv("CHUNK_OVERLAP", 60))
    qdrant_url: str = os.getenv("QDRANT_URL", "http://localhost:6333")
    qdrant_api_key: str | None = os.getenv("QDRANT_API_KEY")
    qdrant_collection: str = os.getenv("QDRANT_COLLECTION", "financial_documents")
    llm_model: str = os.getenv("LLM_MODEL", "gemini-2.5-flash")

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()

"""Qdrant vector storage, accessed through LangChain's Qdrant integration."""

from __future__ import annotations

from typing import Any
from uuid import NAMESPACE_URL, uuid5

from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient, models

from app.config.settings import settings
from app.embeddings.embedder import embedder


class SentenceTransformerEmbeddings(Embeddings):
    """Expose the project's local MiniLM embedder through LangChain's API."""

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return embedder.embed_batch(texts)

    def embed_query(self, text: str) -> list[float]:
        return embedder.embed_text(text)


embeddings = SentenceTransformerEmbeddings()
_client: QdrantClient | None = None
_vector_store: QdrantVectorStore | None = None


def get_qdrant_client() -> QdrantClient:
    global _client
    if _client is None:
        _client = QdrantClient(url=settings.qdrant_url, api_key=settings.qdrant_api_key)
    return _client


def ensure_collection() -> None:
    client = get_qdrant_client()
    if not client.collection_exists(settings.qdrant_collection):
        client.create_collection(
            collection_name=settings.qdrant_collection,
            vectors_config=models.VectorParams(
                size=settings.embedding_dimension,
                distance=models.Distance.COSINE,
            ),
        )
    index_types = {
        "metadata.company_id": models.PayloadSchemaType.INTEGER,
        "metadata.document_id": models.PayloadSchemaType.INTEGER,
        "metadata.fiscal_year": models.PayloadSchemaType.INTEGER,
        "metadata.document_type": models.PayloadSchemaType.KEYWORD,
        "metadata.speaker_role": models.PayloadSchemaType.KEYWORD,
        "metadata.is_management": models.PayloadSchemaType.BOOL,
        "metadata.ticker": models.PayloadSchemaType.KEYWORD,
    }
    for field, field_type in index_types.items():
        try:
            client.create_payload_index(
                collection_name=settings.qdrant_collection,
                field_name=field,
                field_schema=field_type,
            )
        except Exception as exc:
            # Existing indexes are expected on normal restarts; surface other failures.
            if "already exists" not in str(exc).lower():
                raise


def get_vector_store() -> QdrantVectorStore:
    global _vector_store
    if _vector_store is None:
        ensure_collection()
        _vector_store = QdrantVectorStore(
            client=get_qdrant_client(),
            collection_name=settings.qdrant_collection,
            embedding=embeddings,
            content_payload_key="page_content",
            metadata_payload_key="metadata",
        )
    return _vector_store


def _point_id(document_id: int, chunk_index: int) -> str:
    return str(uuid5(NAMESPACE_URL, f"financial-terminal:{document_id}:{chunk_index}"))


def replace_document_chunks(chunks: list[dict[str, Any]], document_metadata: dict[str, Any]) -> int:
    """Upsert current chunks, then remove stale points for that document."""
    if not chunks:
        return 0

    client = get_qdrant_client()
    store = get_vector_store()
    document_id = int(chunks[0]["document_id"])
    existing = []
    offset = None
    while True:
        points, offset = client.scroll(
            collection_name=settings.qdrant_collection,
            scroll_filter=models.Filter(must=[
                models.FieldCondition(key="metadata.document_id", match=models.MatchValue(value=document_id))
            ]),
            limit=1000,
            offset=offset,
            with_payload=False,
            with_vectors=False,
        )
        existing.extend(points)
        if offset is None:
            break
    old_ids = {str(point.id) for point in existing}

    docs: list[Document] = []
    ids: list[str] = []
    for chunk in chunks:
        metadata = {
            **chunk,
            **document_metadata,
            "document_id": int(chunk["document_id"]),
            "company_id": int(chunk["company_id"]),
            "chunk_index": int(chunk["chunk_index"]),
            "chunk_id": f"{document_id}:{int(chunk['chunk_index'])}",
            "token_count": int(chunk.get("token_count") or 0),
        }
        docs.append(Document(page_content=chunk["content"], metadata=metadata))
        ids.append(_point_id(document_id, int(chunk["chunk_index"])))

    store.add_documents(docs, ids=ids)
    stale_ids = old_ids - set(ids)
    if stale_ids:
        client.delete(
            collection_name=settings.qdrant_collection,
            points_selector=models.PointIdsList(points=list(stale_ids)),
            wait=True,
        )
    return len(docs)


def qdrant_health() -> dict[str, Any]:
    try:
        ensure_collection()
        info = get_qdrant_client().get_collection(settings.qdrant_collection)
        return {"connected": True, "collection": settings.qdrant_collection, "points": info.points_count or 0}
    except Exception as exc:
        return {"connected": False, "collection": settings.qdrant_collection, "error": str(exc)}

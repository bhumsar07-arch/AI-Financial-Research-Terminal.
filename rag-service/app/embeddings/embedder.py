"""Normalized semantic embeddings using sentence-transformers/all-MiniLM-L6-v2."""

from typing import List

import numpy as np

from app.config.settings import settings

_model = None
_model_name = "sentence-transformers/all-MiniLM-L6-v2"


def _get_model():
    """Load the model once; fail clearly instead of indexing hash vectors."""
    global _model
    if _model is not None:
        return _model
    try:
        from sentence_transformers import SentenceTransformer

        print(f"[Embedder] Loading semantic model: {_model_name}")
        _model = SentenceTransformer(_model_name)
        dimension = _model.get_sentence_embedding_dimension()
        if dimension != settings.embedding_dimension:
            raise RuntimeError(
                f"Model dimension {dimension} does not match EMBEDDING_DIMENSION={settings.embedding_dimension}."
            )
        print(f"[Embedder] Model loaded successfully. Dimension: {dimension}")
        return _model
    except Exception as exc:
        raise RuntimeError(f"Could not load semantic embedding model {_model_name}: {exc}") from exc


class Embedder:
    """384-dimensional, normalized sentence embeddings for cosine search."""

    def __init__(self, dimension: int | None = None):
        self.dimension = dimension or settings.embedding_dimension

    @property
    def model_name(self) -> str:
        return _model_name

    @property
    def is_semantic(self) -> bool:
        return True

    def embed_text(self, text: str) -> List[float]:
        if not text or not text.strip():
            return [0.0] * self.dimension
        return _get_model().encode(text, normalize_embeddings=True).tolist()

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        return _get_model().encode(
            texts,
            normalize_embeddings=True,
            batch_size=32,
            show_progress_bar=False,
        ).tolist()

    @staticmethod
    def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
        """Cosine similarity for normalized vectors."""
        return float(np.dot(np.asarray(vec_a, dtype=np.float32), np.asarray(vec_b, dtype=np.float32)))


embedder = Embedder()

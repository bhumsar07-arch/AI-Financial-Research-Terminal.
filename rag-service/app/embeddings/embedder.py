"""
Embedder — semantic vector generation using sentence-transformers.

Model: all-MiniLM-L6-v2
  - 22MB, downloads once from HuggingFace, cached locally
  - 384-dimensional output (same dimension as before, no schema changes needed)
  - Runs 100% offline after first download
  - Understands synonyms, context, paraphrasing — unlike the old hash-based approach

Old approach (REMOVED):
  Used MD5/SHA256 hash of words mapped to vector buckets.
  Had zero semantic understanding — "revenue fell" and "revenue declined"
  produced completely different vectors.
"""

import numpy as np
from typing import List
from app.config.settings import settings

# Model is loaded once at import time and reused for all requests
_model = None
_model_name = "sentence-transformers/all-MiniLM-L6-v2"
_fallback_active = False


def _get_model():
    """Lazy-load the sentence-transformer model (downloads on first call if needed)."""
    global _model, _fallback_active
    if _model is not None:
        return _model
    try:
        from sentence_transformers import SentenceTransformer
        print(f"[Embedder] Loading semantic model: {_model_name}")
        _model = SentenceTransformer(_model_name)
        _fallback_active = False
        print(f"[Embedder] Model loaded successfully. Dimension: {_model.get_sentence_embedding_dimension()}")
        return _model
    except Exception as e:
        print(f"[Embedder] WARNING: sentence-transformers not available ({e}). Falling back to hash embedder.")
        _fallback_active = True
        return None


def _hash_embed_fallback(text: str, dimension: int) -> List[float]:
    """
    Emergency fallback: hash-based embedder.
    Only used if sentence-transformers is not installed yet.
    """
    import hashlib
    vector = np.zeros(dimension, dtype=np.float32)
    words = text.lower().split()
    for i, word in enumerate(words):
        h = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16)
        vector[h % dimension] += 1.0
        if i > 0:
            bigram = f"{words[i-1]}_{word}"
            bh = int(hashlib.sha256(bigram.encode("utf-8")).hexdigest(), 16)
            vector[bh % dimension] += 1.5
    norm = np.linalg.norm(vector)
    if norm > 0:
        vector = vector / norm
    return vector.tolist()


class Embedder:
    """
    Semantic embedder using sentence-transformers/all-MiniLM-L6-v2.
    Produces 384-dimensional L2-normalised vectors suitable for cosine similarity.
    """

    def __init__(self, dimension: int = None):
        self.dimension = dimension or settings.embedding_dimension

    @property
    def model_name(self) -> str:
        return _model_name if not _fallback_active else "hash-fallback"

    @property
    def is_semantic(self) -> bool:
        return not _fallback_active

    def embed_text(self, text: str) -> List[float]:
        """
        Embed a single string into a normalised 384-dim vector.
        Semantically similar texts will have high cosine similarity.
        """
        if not text or not text.strip():
            return [0.0] * self.dimension

        model = _get_model()

        if model is not None:
            # Real semantic embedding
            embedding = model.encode(text, normalize_embeddings=True)
            return embedding.tolist()
        else:
            # Fallback to hash-based (no sentence-transformers installed)
            return _hash_embed_fallback(text, self.dimension)

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Embed a batch of strings efficiently.
        sentence-transformers batches internally for GPU/CPU parallelism.
        """
        if not texts:
            return []

        model = _get_model()

        if model is not None:
            embeddings = model.encode(texts, normalize_embeddings=True, batch_size=32, show_progress_bar=False)
            return embeddings.tolist()
        else:
            return [_hash_embed_fallback(t, self.dimension) for t in texts]

    @staticmethod
    def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
        """Cosine similarity between two pre-normalised vectors (dot product)."""
        a = np.array(vec_a, dtype=np.float32)
        b = np.array(vec_b, dtype=np.float32)
        # Since vectors are L2-normalised, dot product == cosine similarity
        return float(np.dot(a, b))


embedder = Embedder()

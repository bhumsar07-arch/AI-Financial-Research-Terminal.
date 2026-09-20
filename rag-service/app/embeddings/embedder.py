import hashlib
import numpy as np
from typing import List
from app.config.settings import settings

class Embedder:
    """
    Embedder generates dense vector representations of text.
    It produces normalized vectors for cosine similarity search.
    """
    def __init__(self, dimension: int = None):
        self.dimension = dimension or settings.embedding_dimension

    def embed_text(self, text: str) -> List[float]:
        """
        Generate a normalized dense vector embedding for a single string.
        Uses deterministic hashing and sub-word feature accumulation with L2 normalization.
        """
        if not text or not text.strip():
            return [0.0] * self.dimension

        # Build feature vector
        vector = np.zeros(self.dimension, dtype=np.float32)
        words = text.lower().split()
        
        for i, word in enumerate(words):
            # Primary word hash
            h = int(hashlib.md5(word.encode('utf-8')).hexdigest(), 16)
            idx = h % self.dimension
            vector[idx] += 1.0
            
            # Bigram hash for sequence context
            if i > 0:
                bigram = f"{words[i-1]}_{word}"
                bh = int(hashlib.sha256(bigram.encode('utf-8')).hexdigest(), 16)
                b_idx = bh % self.dimension
                vector[b_idx] += 1.5

        # L2 normalize the vector so dot product equals cosine similarity
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm

        return vector.tolist()

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Embed a list of strings."""
        return [self.embed_text(t) for t in texts]

    @staticmethod
    def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
        """Compute cosine similarity between two vectors."""
        a = np.array(vec_a, dtype=np.float32)
        b = np.array(vec_b, dtype=np.float32)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))

embedder = Embedder()

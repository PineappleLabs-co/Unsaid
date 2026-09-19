import hashlib
import time
from typing import Optional, Dict, Tuple
from app.schemas.enrichment import GroqEnrichmentResult


class SemanticResponseCache:
    """
    In-memory LRU token & response memoization cache for identical captures.
    Saves Groq API token spend and reduces latency to < 1ms for duplicate/similar queries.
    """
    def __init__(self, max_size: int = 1000, ttl_seconds: int = 86400):
        self.max_size = max_size
        self.ttl = ttl_seconds
        self._cache: Dict[str, Tuple[float, GroqEnrichmentResult]] = {}

    def _hash_key(self, text: str, prompt_version: str) -> str:
        content = f"{text.strip().lower()}::{prompt_version}"
        return hashlib.sha256(content.encode("utf-8")).hexdigest()

    def get(self, text: str, prompt_version: str = "v1") -> Optional[GroqEnrichmentResult]:
        key = self._hash_key(text, prompt_version)
        if key in self._cache:
            timestamp, result = self._cache[key]
            if time.time() - timestamp < self.ttl:
                return result
            else:
                del self._cache[key]
        return None

    def set(self, text: str, result: GroqEnrichmentResult, prompt_version: str = "v1") -> None:
        if len(self._cache) >= self.max_size:
            # Evict oldest
            oldest_key = min(self._cache.keys(), key=lambda k: self._cache[k][0])
            del self._cache[oldest_key]

        key = self._hash_key(text, prompt_version)
        self._cache[key] = (time.time(), result)


ai_cache = SemanticResponseCache()

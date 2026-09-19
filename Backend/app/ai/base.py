from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, Tuple
from app.schemas.enrichment import GroqEnrichmentResult


class BaseAIProvider(ABC):
    name: str

    @abstractmethod
    async def enrich_thought(
        self,
        text: str,
        system_prompt: str,
        temperature: float = 0.2,
        max_tokens: int = 500
    ) -> Tuple[GroqEnrichmentResult, int, int, int]:
        """
        Returns (result, input_tokens, output_tokens, latency_ms)
        """
        pass

    @abstractmethod
    async def transcribe_audio(self, audio_bytes: bytes, filename: str) -> Tuple[str, int]:
        """
        Returns (transcript, latency_ms)
        """
        pass

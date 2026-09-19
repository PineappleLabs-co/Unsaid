import time
from typing import Tuple
from app.ai.base import BaseAIProvider
from app.schemas.enrichment import GroqEnrichmentResult


class FallbackAIProvider(BaseAIProvider):
    name: str = "fallback_heuristic"

    async def enrich_thought(
        self,
        text: str,
        system_prompt: str,
        temperature: float = 0.2,
        max_tokens: int = 500
    ) -> Tuple[GroqEnrichmentResult, int, int, int]:
        start = time.perf_counter()
        words = text.strip().split()
        title = " ".join(words[:4]).capitalize() if words else "Captured Thought"

        # Simple category heuristic
        t_lower = text.lower()
        if any(w in t_lower for w in ["idea", "build", "create", "innovate"]):
            c_type = "ideas"
        elif any(w in t_lower for w in ["project", "milestone", "roadmap", "task"]):
            c_type = "projects"
        elif any(w in t_lower for w in ["learn", "study", "read", "understand"]):
            c_type = "learning"
        elif any(w in t_lower for w in ["remind", "todo", "remember", "buy"]):
            c_type = "reminders"
        else:
            c_type = "other"

        res = GroqEnrichmentResult(
            title=title,
            type=c_type,
            summary=text[:150] + ("..." if len(text) > 150 else ""),
            tags=["thought", c_type, "note"]
        )
        latency = int((time.perf_counter() - start) * 1000)
        return res, len(words), 30, latency

    async def transcribe_audio(self, audio_bytes: bytes, filename: str) -> Tuple[str, int]:
        start = time.perf_counter()
        latency = int((time.perf_counter() - start) * 1000)
        return f"Transcribed note from audio recording ({filename})", latency

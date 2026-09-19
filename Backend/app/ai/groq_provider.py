import json
import time
from typing import Tuple
from app.ai.base import BaseAIProvider
from app.config import settings
from app.schemas.enrichment import GroqEnrichmentResult


class GroqProvider(BaseAIProvider):
    name: str = "groq"

    def __init__(self, api_key: str):
        self.api_key = api_key

    async def enrich_thought(
        self,
        text: str,
        system_prompt: str,
        temperature: float = 0.2,
        max_tokens: int = 500
    ) -> Tuple[GroqEnrichmentResult, int, int, int]:
        from groq import AsyncGroq
        client = AsyncGroq(api_key=self.api_key)

        start = time.perf_counter()
        completion = await client.chat.completions.create(
            model=settings.GROQ_LLAMA_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Analyze this thought:\n{text}"}
            ],
            response_format={"type": "json_object"},
            temperature=temperature,
            max_tokens=max_tokens
        )
        latency = int((time.perf_counter() - start) * 1000)

        content = completion.choices[0].message.content
        parsed = json.loads(content)
        result = GroqEnrichmentResult(**parsed)

        usage = completion.usage
        in_tokens = usage.prompt_tokens if usage else len(text.split())
        out_tokens = usage.completion_tokens if usage else 50

        return result, in_tokens, out_tokens, latency

    async def transcribe_audio(self, audio_bytes: bytes, filename: str) -> Tuple[str, int]:
        from groq import AsyncGroq
        client = AsyncGroq(api_key=self.api_key)

        start = time.perf_counter()
        transcription = await client.audio.transcriptions.create(
            file=(filename, audio_bytes),
            model=settings.GROQ_WHISPER_MODEL,
            response_format="text"
        )
        latency = int((time.perf_counter() - start) * 1000)
        return str(transcription), latency

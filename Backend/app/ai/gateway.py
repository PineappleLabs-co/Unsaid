import os
import json
import uuid
import logging
from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.ai.base import BaseAIProvider
from app.ai.groq_provider import GroqProvider
from app.ai.fallback_provider import FallbackAIProvider
from app.ai.guardrails import sanitize_input_text, repair_and_validate_llm_json, normalize_tags
from app.ai.cache import ai_cache
from app.schemas.enrichment import GroqEnrichmentResult
from app.models.entities import AITelemetryRecord

logger = logging.getLogger(__name__)


class AIGateway:
    def __init__(self, db: Optional[AsyncSession] = None):
        self.db = db
        self.primary_provider: BaseAIProvider
        self.fallback_provider: BaseAIProvider = FallbackAIProvider()

        if settings.GROQ_API_KEY and settings.GROQ_API_KEY != "your_groq_api_key_here":
            self.primary_provider = GroqProvider(api_key=settings.GROQ_API_KEY)
        else:
            self.primary_provider = self.fallback_provider

    def _load_prompt(self, template_name: str = "thought-enrichment", version: str = "v1") -> dict:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        prompt_file = os.path.join(base_dir, "prompts", template_name, f"{version}.json")
        if os.path.exists(prompt_file):
            try:
                with open(prompt_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Failed to load prompt template {prompt_file}: {e}")

        return {
            "version": "v1",
            "model": settings.GROQ_LLAMA_MODEL,
            "systemPrompt": "You are an AI idea organizer for Thought Catcher. Analyze the user's raw note or speech transcript. Respond with valid JSON conforming to this schema:\n{\n  \"title\": \"Concise 3-6 word title\",\n  \"type\": \"ideas\" | \"projects\" | \"content\" | \"learning\" | \"reminders\" | \"personal\" | \"other\",\n  \"summary\": \"1-2 sentence core idea summary\",\n  \"tags\": [\"tag1\", \"tag2\", \"tag3\"]\n}",
            "temperature": 0.2,
            "maxTokens": 500
        }

    async def enrich_thought(
        self,
        text: str,
        actor_id: str,
        thought_id: Optional[str] = None,
        prompt_version: str = "v1"
    ) -> GroqEnrichmentResult:
        # 1. AI Safety & Injection Guardrail
        clean_text = sanitize_input_text(text)

        # 2. Check Semantic Response Cache (0 token spend if match)
        cached_result = ai_cache.get(clean_text, prompt_version)
        if cached_result:
            logger.info(f"AI Cache Hit for thought {thought_id}")
            return cached_result

        prompt_cfg = self._load_prompt("thought-enrichment", prompt_version)
        system_prompt = prompt_cfg.get("systemPrompt", "")
        temperature = float(prompt_cfg.get("temperature", 0.2))
        max_tokens = int(prompt_cfg.get("maxTokens", 500))

        provider_used = self.primary_provider.name
        model_used = prompt_cfg.get("model", settings.GROQ_LLAMA_MODEL)
        status_result = "success"

        try:
            result, in_tok, out_tok, latency = await self.primary_provider.enrich_thought(
                text=clean_text,
                system_prompt=system_prompt,
                temperature=temperature,
                max_tokens=max_tokens
            )
        except Exception as exc:
            logger.warning(f"Primary AI provider {self.primary_provider.name} failed: {exc}. Routing to fallback.")
            provider_used = self.fallback_provider.name
            result, in_tok, out_tok, latency = await self.fallback_provider.enrich_thought(
                text=clean_text,
                system_prompt=system_prompt,
                temperature=temperature,
                max_tokens=max_tokens
            )

        # 3. Guardrail: Normalize tags
        result.tags = normalize_tags(result.tags)

        # 4. Save to Semantic Cache
        ai_cache.set(clean_text, result, prompt_version)

        # 5. Record AI Telemetry
        if self.db:
            try:
                cost = (in_tok * 0.00000059) + (out_tok * 0.00000079) if provider_used == "groq" else 0.0
                telemetry = AITelemetryRecord(
                    id=str(uuid.uuid4()),
                    thought_id=thought_id,
                    actor_id=actor_id,
                    provider=provider_used,
                    model=model_used,
                    prompt_version=prompt_version,
                    input_tokens=in_tok,
                    output_tokens=out_tok,
                    latency_ms=latency,
                    estimated_cost_usd=cost,
                    status=status_result
                )
                self.db.add(telemetry)
                await self.db.flush()
            except Exception as e:
                logger.error(f"Failed to record AI telemetry: {e}")

        return result

    async def transcribe_audio(self, audio_bytes: bytes, filename: str) -> str:
        try:
            transcript, _ = await self.primary_provider.transcribe_audio(audio_bytes, filename)
            return transcript
        except Exception as exc:
            logger.warning(f"Primary audio STT failed: {exc}. Routing to fallback.")
            transcript, _ = await self.fallback_provider.transcribe_audio(audio_bytes, filename)
            return transcript

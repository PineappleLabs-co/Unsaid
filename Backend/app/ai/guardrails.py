import re
import json
import logging
from typing import Optional, Dict, Any, List
from app.schemas.enrichment import GroqEnrichmentResult

logger = logging.getLogger(__name__)

# Common prompt injection patterns
INJECTION_PATTERNS = [
    r"(?i)ignore\s+(all\s+)?(previous|prior)\s+(instructions|prompts)",
    r"(?i)disregard\s+(the\s+)?(system\s+)?prompt",
    r"(?i)you\s+are\s+now\s+in\s+(developer|dan|jailbreak)\s+mode",
    r"(?i)system\s*:\s*",
    r"(?i)output\s+the\s+system\s+prompt",
]


def sanitize_input_text(text: str) -> str:
    """
    Strips prompt injection markers and excessive control characters from user text.
    """
    sanitized = text
    for pattern in INJECTION_PATTERNS:
        sanitized = re.sub(pattern, "[FILTERED]", sanitized)
    return sanitized.strip()


def normalize_tags(tags: List[str]) -> List[str]:
    """
    Cleans, deduplicates, and normalizes tags into concise lowercase labels.
    """
    cleaned: List[str] = []
    seen = set()
    for tag in tags:
        normalized = re.sub(r"[^a-zA-Z0-9_\- ]", "", tag).strip().lower()
        if normalized and normalized not in seen and len(normalized) <= 30:
            seen.add(normalized)
            cleaned.append(normalized)
    return cleaned[:8]


def repair_and_validate_llm_json(raw_json_str: str) -> Optional[GroqEnrichmentResult]:
    """
    Self-heals and parses LLM outputs even if surrounded by markdown fences or slightly truncated.
    """
    # 1. Clean markdown code blocks
    cleaned = raw_json_str.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    try:
        data = json.loads(cleaned)
        # Ensure tags are normalized
        if "tags" in data and isinstance(data["tags"], list):
            data["tags"] = normalize_tags(data["tags"])
        return GroqEnrichmentResult(**data)
    except Exception as e:
        logger.warning(f"Failed to parse LLM JSON directly: {e}. Attempting regex extraction.")

    # 2. Fallback regex extraction of JSON object
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group(0))
            if "tags" in data and isinstance(data["tags"], list):
                data["tags"] = normalize_tags(data["tags"])
            return GroqEnrichmentResult(**data)
        except Exception:
            pass

    return None

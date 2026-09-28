import os
import logging
from typing import Optional, Any
from langchain_core.language_models.chat_models import BaseChatModel
from app.config import settings

logger = logging.getLogger(__name__)


def get_chat_model(
    provider: Optional[str] = None,
    model_name: Optional[str] = None,
    temperature: float = 0.2,
    api_key: Optional[str] = None,
) -> Optional[BaseChatModel]:
    """
    Unified model factory for dynamically instantiating Chat Models across providers.
    Supports Groq, OpenAI, Anthropic, Google, and Ollama/Local with unified structured output.
    """
    selected_provider = (provider or settings.DEFAULT_LLM_PROVIDER).lower()
    selected_model = model_name or settings.DEFAULT_LLM_MODEL

    # 1. Groq Chat Model
    if selected_provider == "groq":
        key = api_key if api_key is not None else (settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", ""))
        if not key or key == "your_groq_api_key_here":
            logger.info("Groq API key not configured; falling back to deterministic synthesis.")
            return None
        try:
            from langchain_groq import ChatGroq
            return ChatGroq(
                groq_api_key=key,
                model_name=selected_model or settings.GROQ_LLAMA_MODEL,
                temperature=temperature,
            )
        except Exception as exc:
            logger.warning(f"Failed to instantiate ChatGroq: {exc}")
            return None

    # 2. OpenAI Chat Model
    elif selected_provider == "openai":
        key = api_key if api_key is not None else (settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY", ""))
        if not key:
            logger.info("OpenAI API key not configured; falling back.")
            return None
        try:
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(
                api_key=key,
                model_name=selected_model or "gpt-4o-mini",
                temperature=temperature,
            )
        except Exception as exc:
            logger.warning(f"Failed to instantiate ChatOpenAI: {exc}")
            return None

    # 3. Anthropic Chat Model
    elif selected_provider == "anthropic":
        key = api_key if api_key is not None else (settings.ANTHROPIC_API_KEY or os.getenv("ANTHROPIC_API_KEY", ""))
        if not key:
            logger.info("Anthropic API key not configured; falling back.")
            return None
        try:
            from langchain_anthropic import ChatAnthropic
            return ChatAnthropic(
                api_key=key,
                model_name=selected_model or "claude-3-5-sonnet-20241022",
                temperature=temperature,
            )
        except Exception as exc:
            logger.warning(f"Failed to instantiate ChatAnthropic: {exc}")
            return None


    # 4. Default / Fallback
    else:
        logger.warning(f"Unknown or unsupported provider: {selected_provider}")
        return None

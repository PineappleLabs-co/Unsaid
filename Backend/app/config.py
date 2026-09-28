from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "Thought Catcher API"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Security & CORS
    ALLOWED_ORIGINS: List[str] = Field(default=["*"])
    APP_CHECK_ENFORCED: bool = False
    REVENUECAT_WEBHOOK_SECRET: str = "test_revenuecat_secret"

    # AI, Model Providers & LangChain Gateway
    DEFAULT_LLM_PROVIDER: str = "groq"
    DEFAULT_LLM_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_API_KEY: str = ""
    GROQ_LLAMA_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_WHISPER_MODEL: str = "whisper-large-v3-turbo"
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""

    # Database & Storage
    DATABASE_URL: str = "sqlite+aiosqlite:///./thought_catcher.db"
    STORAGE_DIR: str = "./storage/audio"

    # Quota Limits (Free Tier)
    FREE_TIER_DAILY_LIMIT: int = 2
    FREE_TIER_WEEKLY_LIMIT: int = 10

    # Account Deletion Grace Period in Days
    ACCOUNT_DELETION_GRACE_DAYS: int = 7


settings = Settings()

"""Environment-driven API configuration."""

from __future__ import annotations

import os
from functools import lru_cache
from typing import List, Optional

from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()


class Settings(BaseModel):
    service_name: str = "wastenot-api"
    environment: str = "development"
    log_level: str = "info"
    database_url: Optional[str] = None
    api_cors_origins: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    version: str = "0.2.0"
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-5.4-mini"
    openai_embedding_model: str = "text-embedding-3-small"
    openai_embedding_dimensions: int = 1536
    llm_features_enabled: bool = False
    vector_rag_enabled: bool = False
    admin_api_token: Optional[str] = None
    llm_max_output_tokens: int = 900
    llm_temperature: float = 0.2
    llm_timeout_seconds: int = 30


def parse_cors_origins(value: str | None) -> List[str]:
    if not value:
        return Settings().api_cors_origins
    cleaned = value.strip()
    if cleaned.startswith("[") and cleaned.endswith("]"):
        cleaned = cleaned[1:-1]
    return [origin.strip().strip('"').strip("'") for origin in cleaned.split(",") if origin.strip()]


def parse_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def parse_int(value: str | None, default: int) -> int:
    try:
        return int(value) if value is not None else default
    except ValueError:
        return default


def parse_float(value: str | None, default: float) -> float:
    try:
        return float(value) if value is not None else default
    except ValueError:
        return default


@lru_cache
def get_settings() -> Settings:
    return Settings(
        environment=os.getenv("ENVIRONMENT", "development"),
        log_level=os.getenv("LOG_LEVEL", "info"),
        database_url=os.getenv("DATABASE_URL"),
        api_cors_origins=parse_cors_origins(os.getenv("API_CORS_ORIGINS")),
        openai_api_key=os.getenv("OPENAI_API_KEY"),
        openai_model=os.getenv("OPENAI_MODEL", "gpt-5.4-mini"),
        openai_embedding_model=os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small"),
        openai_embedding_dimensions=parse_int(os.getenv("OPENAI_EMBEDDING_DIMENSIONS"), 1536),
        llm_features_enabled=parse_bool(os.getenv("LLM_FEATURES_ENABLED"), False),
        vector_rag_enabled=parse_bool(os.getenv("VECTOR_RAG_ENABLED"), False),
        admin_api_token=os.getenv("ADMIN_API_TOKEN"),
        llm_max_output_tokens=parse_int(os.getenv("LLM_MAX_OUTPUT_TOKENS"), 900),
        llm_temperature=parse_float(os.getenv("LLM_TEMPERATURE"), 0.2),
        llm_timeout_seconds=parse_int(os.getenv("LLM_TIMEOUT_SECONDS"), 30),
    )

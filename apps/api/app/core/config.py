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


def parse_cors_origins(value: str | None) -> List[str]:
    if not value:
        return Settings().api_cors_origins
    cleaned = value.strip()
    if cleaned.startswith("[") and cleaned.endswith("]"):
        cleaned = cleaned[1:-1]
    return [origin.strip().strip('"').strip("'") for origin in cleaned.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings(
        environment=os.getenv("ENVIRONMENT", "development"),
        log_level=os.getenv("LOG_LEVEL", "info"),
        database_url=os.getenv("DATABASE_URL"),
        api_cors_origins=parse_cors_origins(os.getenv("API_CORS_ORIGINS")),
    )

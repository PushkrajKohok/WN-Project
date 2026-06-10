"""CORS middleware setup."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import Settings


def configure_cors(app: FastAPI, settings: Settings) -> None:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.api_cors_origins,
        allow_origin_regex=r"http://(localhost|127\.0\.0\.1):30\d{2}"
        if settings.environment != "production"
        else None,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

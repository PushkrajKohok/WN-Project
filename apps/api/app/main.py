"""
WasteNot Always-On Intelligence Layer - FastAPI backend application.

This module is the canonical ASGI entrypoint for local and hosted runtime
commands such as `uvicorn app.main:app`.
"""

from __future__ import annotations

import logging

from fastapi import FastAPI

from app.core.config import get_settings
from app.core.cors import configure_cors
from app.routes.actions import router as actions_router
from app.routes.agents import router as agents_router
from app.routes.clients import router as clients_router
from app.routes.dashboard import router as dashboard_router
from app.routes.data import router as data_router
from app.routes.guardrails import router as guardrails_router
from app.routes.health import router as health_router
from app.routes.learning import router as learning_router
from app.routes.patterns import router as patterns_router
from app.routes.rag import router as rag_router
from app.routes.recommendations import router as recommendations_router
from app.routes.settings import router as settings_router
from mock_data import DATA_PRESETS

settings = get_settings()
logging.basicConfig(level=getattr(logging, settings.log_level.upper(), logging.INFO))

app = FastAPI(
    title="WasteNot Intelligence Layer API",
    description="Always-on multi-agent RAG intelligence layer for AI-powered ad optimization",
    version=settings.version,
)

configure_cors(app, settings)

app.include_router(health_router)
app.include_router(data_router)
app.include_router(settings_router)
app.include_router(agents_router)
app.include_router(dashboard_router)
app.include_router(clients_router)
app.include_router(recommendations_router)
app.include_router(patterns_router)
app.include_router(actions_router)
app.include_router(guardrails_router)
app.include_router(rag_router)
app.include_router(learning_router)


@app.get("/data/presets")
def get_data_presets():
    return DATA_PRESETS

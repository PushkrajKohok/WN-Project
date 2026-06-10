"""
WasteNot Always-On Intelligence Layer — FastAPI Backend.

Database-backed routes use Postgres/Supabase when DATABASE_URL is configured.
Each route keeps the existing mock fallback so the demo remains usable without
local database setup.
"""

from __future__ import annotations

import copy
from typing import Any, Optional

from fastapi import FastAPI
from app.routes.agents import router as agents_router
from app.routes.clients import router as clients_router
from app.routes.dashboard import router as dashboard_router
from app.routes.data import router as data_router
from app.routes.recommendations import router as recommendations_router
from app.routes.settings import router as settings_router
from app.db import fetch_all, is_db_configured
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from mock_data import (
    ACTIONS,
    DATA_PRESETS,
    GUARDRAILS,
    KNOWLEDGE_GRAPH_EDGES,
    PATTERNS,
)

app = FastAPI(
    title="WasteNot Intelligence Layer API",
    description="Always-on multi-agent RAG intelligence layer for AI-powered ad optimization",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):30\d{2}",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data_router)
app.include_router(settings_router)
app.include_router(agents_router)
app.include_router(dashboard_router)
app.include_router(clients_router)
app.include_router(recommendations_router)


_guardrails = copy.deepcopy(GUARDRAILS)


class GuardrailsPatch(BaseModel):
    confidence_threshold: Optional[float] = None
    spend_threshold_for_approval: Optional[int] = None
    client_data_sharing_level: Optional[str] = None


def db_available() -> bool:
    return is_db_configured()


def try_db(default: Any, fn):
    try:
        return fn()
    except Exception:
        return default


def normalize_status(value: Optional[str]) -> str:
    status = (value or "pending").strip().lower().replace(" ", "_")
    return {
        "generated": "pending",
        "pending_review": "pending",
        "executed": "approved",
    }.get(status, status)

def db_action(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["optimization_id"],
        "recommendation_id": row["optimization_id"],
        "title": row.get("reason") or row.get("action_type") or "Optimization action",
        "client_name": row.get("brand_name") or row["client_id"],
        "type": row.get("action_type") or "optimization",
        "status": normalize_status(row.get("status")),
        "executed_at": row.get("created_at").isoformat() if row.get("created_at") else None,
        "executed_by": "auto" if (row.get("agent_name") or "").lower() != "human" else "account_manager",
        "before_config": {"target_campaign_id": row.get("target_campaign_id")},
        "after_config": {"actual_impact_pct": float(row["actual_impact_pct"])} if row.get("actual_impact_pct") is not None else None,
        "rollback_status": "rolled_back" if row.get("rollback_flag") else "not_needed",
        "rollback_reason": "Rollback flag set in optimization history." if row.get("rollback_flag") else None,
        "rejection_reason": None,
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "wastenot-api",
        "version": "0.2.0",
        "database_configured": db_available(),
    }


@app.get("/patterns")
def get_patterns():
    def db_patterns():
        patterns = fetch_all(
            """
            SELECT
                benchmark_id AS id,
                brand_category AS category,
                monthly_ad_spend_band AS spend_band,
                strategy,
                avg_lift_pct AS avg_lift,
                sample_size,
                confidence_score AS confidence,
                privacy_level
            FROM cross_client_benchmarks
            ORDER BY generated_at DESC NULLS LAST
            LIMIT 250
            """
        )
        edges = fetch_all(
            """
            SELECT
                source_node_id AS source,
                target_node_id AS target,
                relationship AS relation,
                weight
            FROM knowledge_graph_edges
            ORDER BY last_updated_at DESC NULLS LAST
            LIMIT 250
            """
        )
        return {"patterns": patterns, "knowledge_graph_edges": edges, "source": "database"}

    return try_db(
        {"patterns": PATTERNS, "knowledge_graph_edges": KNOWLEDGE_GRAPH_EDGES, "source": "mock"},
        db_patterns,
    )


@app.get("/actions")
def get_actions():
    def db_actions():
        rows = fetch_all(
            """
            SELECT o.*, c.brand_name
            FROM optimization_history o
            LEFT JOIN clients c ON c.client_id = o.client_id
            ORDER BY o.created_at DESC NULLS LAST
            LIMIT 250
            """
        )
        return {"actions": [db_action(row) for row in rows], "source": "database"}

    return try_db({"actions": ACTIONS, "source": "mock"}, db_actions)


@app.get("/guardrails")
def get_guardrails():
    return _guardrails


@app.patch("/guardrails")
def update_guardrails(patch: GuardrailsPatch):
    if patch.confidence_threshold is not None:
        _guardrails["confidence_threshold"] = patch.confidence_threshold
    if patch.spend_threshold_for_approval is not None:
        _guardrails["spend_threshold_for_approval"] = patch.spend_threshold_for_approval
    if patch.client_data_sharing_level is not None:
        _guardrails["client_data_sharing_level"] = patch.client_data_sharing_level
    return _guardrails


# Settings frequency handled by app.routes.data


@app.get("/data/presets")
def get_data_presets():
    return DATA_PRESETS

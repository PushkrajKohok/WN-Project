"""
WasteNot Always-On Intelligence Layer — FastAPI Backend.

Database-backed routes use Postgres/Supabase when DATABASE_URL is configured.
Each route keeps the existing mock fallback so the demo remains usable without
local database setup.
"""

from __future__ import annotations

import copy
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import FastAPI, HTTPException
from app.routes.data import router as data_router
from app.db import fetch_all, fetch_one, get_db_connection, is_db_configured
from app.services.ingestion_service import latest_ingestion_job_counts
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from mock_data import (
    ACTIONS,
    AGENT_LOGS,
    AGENTS,
    DASHBOARD_KPIS,
    DATA_PRESETS,
    GUARDRAILS,
    INGESTION_SETTINGS,
    KNOWLEDGE_GRAPH_EDGES,
    PATTERNS,
    RECOMMENDATIONS,
)

app = FastAPI(
    title="WasteNot Intelligence Layer API",
    description="Always-on multi-agent RAG intelligence layer for AI-powered ad optimization",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data_router)


_guardrails = copy.deepcopy(GUARDRAILS)


class GuardrailsPatch(BaseModel):
    confidence_threshold: Optional[float] = None
    spend_threshold_for_approval: Optional[int] = None
    client_data_sharing_level: Optional[str] = None


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def db_available() -> bool:
    return is_db_configured()


def execute(query: str, params: tuple[Any, ...] = ()) -> Optional[dict[str, Any]]:
    if not db_available():
        raise RuntimeError("Database is not configured.")
    with get_db_connection() as conn:
        row = conn.execute(query, params).fetchone()
        return row


def try_db(default: Any, fn):
    try:
        return fn()
    except Exception:
        return default


def normalize_risk(value: Optional[str]) -> str:
    return (value or "low").lower()


def normalize_status(value: Optional[str]) -> str:
    status = (value or "pending").strip().lower().replace(" ", "_")
    return {
        "generated": "pending",
        "pending_review": "pending",
        "executed": "approved",
    }.get(status, status)


def db_recommendation(row: dict[str, Any]) -> dict[str, Any]:
    brand_name = row.get("brand_name") or row["client_id"]
    benchmark = row.get("benchmark_strategy")
    evidence = row.get("evidence_summary") or "Recommendation generated from ingested performance signals."
    return {
        "id": row["recommendation_id"],
        "title": row["title"],
        "client_id": row["client_id"],
        "client_name": brand_name,
        "platform": row.get("target_platform") or "Unknown",
        "type": row.get("recommendation_type") or "optimization",
        "expected_savings": float(row.get("expected_weekly_savings") or 0),
        "confidence": float(row.get("confidence_score") or 0),
        "risk": normalize_risk(row.get("risk_level")),
        "status": normalize_status(row.get("status")),
        "decision_required": bool(row.get("decision_required")),
        "created_at": row.get("detected_at").isoformat() if row.get("detected_at") else None,
        "summary": evidence,
        "evidence": {
            "sql": "Loaded from recommendation_records joined to clients and benchmark evidence.",
            "graph": benchmark or "No supporting benchmark linked.",
            "vector": "Related rag_documents are available on the detail endpoint when ingested.",
        },
        "risk_assessment": f"{row.get('risk_level') or 'Unknown'} risk based on ingested confidence and approval policy.",
        "rollback_plan": "Use optimization_history and ad platform state to revert the target campaign if performance degrades.",
        "agent_trace": [
            {
                "agent": "Recommendation Engine",
                "action": evidence,
                "ts": row.get("detected_at").isoformat() if row.get("detected_at") else now_iso(),
            }
        ],
    }


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


@app.get("/dashboard/kpis")
def get_dashboard_kpis():
    return try_db(DASHBOARD_KPIS, lambda: get_dashboard_summary())


@app.get("/dashboard/summary")
def get_dashboard_summary():
    def db_summary():
        latest_job = fetch_one(
            """
            SELECT job_id, status, started_at, completed_at, row_counts, error_message
            FROM ingestion_jobs
            ORDER BY started_at DESC
            LIMIT 1
            """
        )
        row = fetch_one(
            """
            SELECT
                COALESCE(SUM(r.expected_weekly_savings), 0) AS total_expected_weekly_savings,
                COUNT(*) FILTER (WHERE lower(r.status) IN ('generated', 'pending review', 'pending')) AS active_recommendation_count,
                COUNT(*) FILTER (WHERE lower(r.risk_level) = 'high') AS high_risk_count,
                (SELECT COUNT(*) FROM optimization_history WHERE lower(status) IN ('executed', 'approved')) AS executed_action_count,
                (SELECT COUNT(*) FROM clients) AS total_clients,
                (SELECT COALESCE(SUM(spend), 0) FROM ad_performance_daily) AS total_spend,
                (SELECT COALESCE(AVG(roas), 0) FROM ad_performance_daily WHERE roas IS NOT NULL) AS average_roas
            FROM recommendation_records r
            """
        )
        return {
            "wasted_spend_saved": float(row["total_expected_weekly_savings"] or 0),
            "active_recommendations": int(row["active_recommendation_count"] or 0),
            "high_risk_alerts": int(row["high_risk_count"] or 0),
            "auto_actions_executed": int(row["executed_action_count"] or 0),
            "total_clients": int(row["total_clients"] or 0),
            "total_spend": float(row["total_spend"] or 0),
            "average_roas": float(row["average_roas"] or 0),
            "latest_ingestion_status": latest_job,
            "trend_7d": DASHBOARD_KPIS["trend_7d"],
        }

    return try_db(
        {
            **DASHBOARD_KPIS,
            "total_clients": 0,
            "total_spend": 0,
            "average_roas": 0,
            "latest_ingestion_status": latest_ingestion_job_counts(),
        },
        db_summary,
    )


# Router endpoints handled by app.routes.data


@app.get("/recommendations")
def get_recommendations(
    client_id: Optional[str] = None,
    platform: Optional[str] = None,
    risk: Optional[str] = None,
    status: Optional[str] = None,
):
    def db_recs():
        clauses = []
        params: list[Any] = []
        if client_id:
            clauses.append("r.client_id = %s")
            params.append(client_id)
        if platform:
            clauses.append("lower(r.target_platform) = lower(%s)")
            params.append(platform)
        if risk:
            clauses.append("lower(r.risk_level) = lower(%s)")
            params.append(risk)
        if status:
            clauses.append("lower(replace(r.status, ' ', '_')) = lower(%s)")
            params.append(status)
        where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        rows = fetch_all(
            f"""
            SELECT r.*, c.brand_name, c.brand_category, b.strategy AS benchmark_strategy
            FROM recommendation_records r
            LEFT JOIN clients c ON c.client_id = r.client_id
            LEFT JOIN cross_client_benchmarks b ON b.benchmark_id = r.supporting_benchmark_id
            {where}
            ORDER BY r.detected_at DESC NULLS LAST
            LIMIT 250
            """,
            tuple(params),
        )
        recs = [db_recommendation(row) for row in rows]
        return {"recommendations": recs, "total": len(recs), "source": "database"}

    fallback = RECOMMENDATIONS
    if client_id:
        fallback = [r for r in fallback if r["client_id"] == client_id]
    if platform:
        fallback = [r for r in fallback if r["platform"].lower() == platform.lower()]
    if risk:
        fallback = [r for r in fallback if r["risk"] == risk]
    if status:
        fallback = [r for r in fallback if r["status"] == status]
    return try_db({"recommendations": fallback, "total": len(fallback), "source": "mock"}, db_recs)


@app.get("/recommendations/{rec_id}")
def get_recommendation(rec_id: str):
    def db_rec():
        row = fetch_one(
            """
            SELECT r.*, c.brand_name, c.brand_category, b.strategy AS benchmark_strategy
            FROM recommendation_records r
            LEFT JOIN clients c ON c.client_id = r.client_id
            LEFT JOIN cross_client_benchmarks b ON b.benchmark_id = r.supporting_benchmark_id
            WHERE r.recommendation_id = %s
            """,
            (rec_id,),
        )
        if not row:
            raise HTTPException(status_code=404, detail="Recommendation not found")
        rec = db_recommendation(row)
        rec["supporting_benchmark"] = row.get("benchmark_strategy")
        rec["rag_documents"] = fetch_all(
            """
            SELECT doc_id, doc_type, source_table, source_record_id, chunk_id, embedding_group, text, updated_at
            FROM rag_documents
            WHERE source_record_id = %s OR client_id = %s
            ORDER BY updated_at DESC NULLS LAST
            LIMIT 12
            """,
            (rec_id, row["client_id"]),
        )
        rec["optimization_history"] = fetch_all(
            """
            SELECT *
            FROM optimization_history
            WHERE client_id = %s OR target_campaign_id = %s
            ORDER BY created_at DESC NULLS LAST
            LIMIT 12
            """,
            (row["client_id"], row.get("target_campaign_id")),
        )
        rec["source"] = "database"
        return rec

    fallback = next((rec for rec in RECOMMENDATIONS if rec["id"] == rec_id), None)
    if not fallback:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return try_db({**fallback, "source": "mock"}, db_rec)


@app.post("/recommendations/{rec_id}/approve")
def approve_recommendation(rec_id: str):
    def db_approve():
        row = execute(
            """
            UPDATE recommendation_records
            SET status = 'Approved', decision_required = false
            WHERE recommendation_id = %s
            RETURNING recommendation_id
            """,
            (rec_id,),
        )
        if not row:
            raise HTTPException(status_code=404, detail="Recommendation not found")
        return {"status": "approved", "recommendation_id": rec_id}

    for rec in RECOMMENDATIONS:
        if rec["id"] == rec_id:
            rec["status"] = "approved"
            rec["decision_required"] = False
            return try_db({"status": "approved", "recommendation_id": rec_id}, db_approve)
    return try_db(None, db_approve) or (_ for _ in ()).throw(HTTPException(status_code=404, detail="Recommendation not found"))


@app.post("/recommendations/{rec_id}/reject")
def reject_recommendation(rec_id: str):
    def db_reject():
        row = execute(
            """
            UPDATE recommendation_records
            SET status = 'Rejected', decision_required = false
            WHERE recommendation_id = %s
            RETURNING recommendation_id
            """,
            (rec_id,),
        )
        if not row:
            raise HTTPException(status_code=404, detail="Recommendation not found")
        return {"status": "rejected", "recommendation_id": rec_id}

    for rec in RECOMMENDATIONS:
        if rec["id"] == rec_id:
            rec["status"] = "rejected"
            rec["decision_required"] = False
            return try_db({"status": "rejected", "recommendation_id": rec_id}, db_reject)
    return try_db(None, db_reject) or (_ for _ in ()).throw(HTTPException(status_code=404, detail="Recommendation not found"))


@app.get("/agents/status")
def get_agents_status():
    return {"agents": AGENTS}


@app.get("/agents/logs")
def get_agent_logs(limit: int = 20):
    def db_logs():
        rows = fetch_all(
            """
            SELECT log_id AS id, agent, message, level, created_at AS ts
            FROM agent_logs
            ORDER BY created_at DESC
            LIMIT %s
            """,
            (limit,),
        )
        if rows:
            return {"logs": rows, "source": "database"}
        latest = fetch_one(
            "SELECT COUNT(*) AS recommendations, MAX(detected_at) AS latest FROM recommendation_records"
        )
        if latest and latest["recommendations"]:
            return {
                "logs": [
                    {
                        "id": "summary-recommendations",
                        "agent": "Recommendation Engine",
                        "message": f"Indexed {latest['recommendations']} ingested recommendation records for review.",
                        "level": "info",
                        "ts": latest["latest"] or now_iso(),
                    }
                ],
                "source": "database_summary",
            }
        return {"logs": AGENT_LOGS[:limit], "source": "mock"}

    return try_db({"logs": AGENT_LOGS[:limit], "source": "mock"}, db_logs)


@app.post("/agents/run-scan")
def run_agent_scan():
    return {
        "status": "started",
        "scan_id": str(uuid.uuid4())[:8],
        "message": "Agent scan cycle initiated. Public activity summaries will be generated from ingested records.",
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

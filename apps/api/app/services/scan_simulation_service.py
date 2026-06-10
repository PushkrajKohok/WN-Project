"""Deterministic public scan simulation for the Agent Workbench."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from app.db import get_db_connection, is_db_configured
from app.services.agent_log_service import create_agent_log
from app.services import recommendation_service

_fallback_runs: list[dict[str, Any]] = []
_fallback_steps: dict[str, list[dict[str, Any]]] = {}


def now() -> datetime:
    return datetime.now(timezone.utc)


def iso(value: datetime) -> str:
    return value.isoformat()


def fallback_runs() -> list[dict[str, Any]]:
    return _fallback_runs


def fallback_steps(run_id: str) -> list[dict[str, Any]]:
    return _fallback_steps.get(run_id, [])


def run_scan(payload: dict[str, Any]) -> dict[str, Any]:
    run_id = f"RUN_{uuid.uuid4().hex[:10]}"
    started = now()
    client_id: Optional[str] = payload.get("client_id")
    platform = payload.get("platform") or "All"
    scan_depth = payload.get("scan_depth") or "standard"

    new_recommendation = recommendation_service.create_simulated_recommendation(run_id, client_id, platform)
    summaries = [
        ("Data Scout", "SQL performance scan", "Data Scout scanned campaign performance, spend, ROAS, CPA, frequency, and schema drift signals."),
        ("Pattern Miner", "GraphRAG benchmark lookup", "Pattern Miner matched anonymized benchmark patterns and knowledge graph edges for similar brands."),
        ("Recommendation Engine", "Recommendation synthesis", "Recommendation Engine generated 1 optimization candidate with estimated weekly savings."),
        ("Evidence + Risk Grader", "Corrective RAG validation", "Risk Grader validated confidence, benchmark support, approval requirements, and rollback availability."),
        ("Human Interface", "Approval workflow", "Human Interface queued recommendation for review."),
        ("Action Executor", "Execution queue", "Action Executor is waiting for execution approval; external APIs are not connected in this prompt."),
    ]
    steps = []
    for index, (agent, tool, summary) in enumerate(summaries, start=1):
        step_started = started + timedelta(seconds=index * 8)
        step = {
            "step_id": f"STEP_{run_id}_{index}",
            "run_id": run_id,
            "step_order": index,
            "agent_name": agent,
            "status": "completed" if agent != "Action Executor" else "waiting",
            "tool_used": tool,
            "public_summary": summary,
            "related_entity_type": "recommendation" if index >= 3 else "run",
            "related_entity_id": new_recommendation["recommendation_id"] if index >= 3 else run_id,
            "started_at": iso(step_started),
            "completed_at": iso(step_started + timedelta(seconds=6)),
        }
        steps.append(step)

    completed = started + timedelta(seconds=58)
    run = {
        "run_id": run_id,
        "run_type": "optimization_scan",
        "status": "completed",
        "started_at": iso(started),
        "completed_at": iso(completed),
        "triggered_by": "manual",
        "summary": f"Completed {scan_depth} scan and generated 1 recommendation for operator review.",
        "error_message": None,
    }

    _fallback_runs.insert(0, run)
    _fallback_steps[run_id] = steps
    for step in steps:
        create_agent_log(
            step["agent_name"],
            step["public_summary"],
            "info" if step["status"] != "waiting" else "warning",
            related_entity_type=step["related_entity_type"],
            related_entity_id=step["related_entity_id"],
        )

    if is_db_configured():
        try:
            with get_db_connection() as conn:
                conn.execute(
                    """
                    INSERT INTO agent_runs (run_id, run_type, status, started_at, completed_at, triggered_by, summary, error_message)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (run_id) DO NOTHING
                    """,
                    (
                        run["run_id"],
                        run["run_type"],
                        run["status"],
                        run["started_at"],
                        run["completed_at"],
                        run["triggered_by"],
                        run["summary"],
                        run["error_message"],
                    ),
                )
                for step in steps:
                    conn.execute(
                        """
                        INSERT INTO agent_run_steps (
                            step_id, run_id, step_order, agent_name, status, tool_used, public_summary,
                            related_entity_type, related_entity_id, started_at, completed_at
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (step_id) DO NOTHING
                        """,
                        (
                            step["step_id"],
                            step["run_id"],
                            step["step_order"],
                            step["agent_name"],
                            step["status"],
                            step["tool_used"],
                            step["public_summary"],
                            step["related_entity_type"],
                            step["related_entity_id"],
                            step["started_at"],
                            step["completed_at"],
                        ),
                    )
        except Exception:
            pass

    return {
        "run_id": run_id,
        "status": "completed",
        "summary": run["summary"],
        "new_recommendation_ids": [new_recommendation["recommendation_id"]],
    }

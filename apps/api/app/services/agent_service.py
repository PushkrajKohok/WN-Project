"""Agent Workbench database-first service with deterministic fallback."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from app.db import fetch_all, fetch_one, is_db_configured
from app.services.agent_log_service import get_agent_logs
from app.services import scan_simulation_service

AGENT_NAMES = [
    "Data Scout",
    "Pattern Miner",
    "Recommendation Engine",
    "Evidence + Risk Grader",
    "Action Executor",
    "Human Interface",
]

AGENT_TASKS = {
    "Data Scout": "Scanning ad performance and schema drift events",
    "Pattern Miner": "Matching cross-client benchmarks and graph edges",
    "Recommendation Engine": "Synthesizing optimization candidates",
    "Evidence + Risk Grader": "Validating confidence, risk, and rollback readiness",
    "Action Executor": "Waiting for execution approval",
    "Human Interface": "Routing recommendations for operator review",
}


def iso(value: Any) -> Optional[str]:
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def list_statuses() -> dict[str, Any]:
    logs = get_agent_logs(limit=200)["items"]
    runs = list_runs(limit=1)["items"]
    latest_run = runs[0] if runs else None
    agents = []
    for name in AGENT_NAMES:
        latest = next((log for log in logs if log["agent_name"] == name), None)
        running = latest_run and latest_run["status"] in ("queued", "running")
        waiting = name == "Action Executor" and latest_run and latest_run["status"] == "completed"
        open_errors = sum(1 for log in logs if log["agent_name"] == name and log["severity"] == "error")
        agents.append(
            {
                "agent_name": name,
                "status": "running" if running else "waiting" if waiting else "completed" if latest else "idle",
                "current_task": AGENT_TASKS[name],
                "last_seen_at": latest["created_at"] if latest else now_iso(),
                "health": "failed" if open_errors else "healthy",
                "tasks_completed_today": sum(1 for log in logs if log["agent_name"] == name),
                "open_errors": open_errors,
            }
        )
    return {"agents": agents, "source": "database" if is_db_configured() else "mock"}


def list_logs(
    agent_name: Optional[str] = None,
    severity: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> dict[str, Any]:
    return get_agent_logs(limit=limit, offset=offset, agent_name=agent_name, severity=severity, search=search)


def list_runs(limit: int = 20) -> dict[str, Any]:
    if is_db_configured():
        try:
            rows = fetch_all(
                """
                SELECT run_id, run_type, status, started_at, completed_at, triggered_by, summary, error_message
                FROM agent_runs
                ORDER BY started_at DESC NULLS LAST
                LIMIT %s
                """,
                (limit,),
            )
            return {"items": [run_item(row) for row in rows], "source": "database"}
        except Exception:
            pass
    runs = scan_simulation_service.fallback_runs()
    if not runs:
        runs = [default_run()]
    return {"items": runs[:limit], "source": "mock"}


def get_run_detail(run_id: str) -> dict[str, Any]:
    if is_db_configured():
        try:
            run = fetch_one(
                """
                SELECT run_id, run_type, status, started_at, completed_at, triggered_by, summary, error_message
                FROM agent_runs
                WHERE run_id = %s
                """,
                (run_id,),
            )
            if run:
                steps = fetch_all(
                    """
                    SELECT *
                    FROM agent_run_steps
                    WHERE run_id = %s
                    ORDER BY step_order
                    """,
                    (run_id,),
                )
                return {"run": run_item(run), "steps": [step_item(step) for step in steps], "source": "database"}
        except Exception:
            pass
    runs = scan_simulation_service.fallback_runs()
    run = next((item for item in runs if item["run_id"] == run_id), None) or default_run()
    steps = scan_simulation_service.fallback_steps(run["run_id"]) or default_steps(run["run_id"])
    return {"run": run, "steps": steps, "source": "mock"}


def run_item(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "run_id": row.get("run_id"),
        "run_type": row.get("run_type"),
        "status": row.get("status"),
        "started_at": iso(row.get("started_at")),
        "completed_at": iso(row.get("completed_at")),
        "triggered_by": row.get("triggered_by"),
        "summary": row.get("summary"),
        "error_message": row.get("error_message"),
    }


def step_item(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "step_id": row.get("step_id"),
        "run_id": row.get("run_id"),
        "step_order": int(row.get("step_order") or 0),
        "agent_name": row.get("agent_name"),
        "status": row.get("status"),
        "tool_used": row.get("tool_used"),
        "public_summary": row.get("public_summary"),
        "related_entity_type": row.get("related_entity_type"),
        "related_entity_id": row.get("related_entity_id"),
        "started_at": iso(row.get("started_at")),
        "completed_at": iso(row.get("completed_at")),
    }


def run_scan(payload: dict[str, Any]) -> dict[str, Any]:
    return scan_simulation_service.run_scan(payload)


def current_investigation() -> dict[str, Any]:
    runs = list_runs(limit=1)["items"]
    if not runs:
        return {"empty": True, "message": "No agent runs yet. Generate and ingest synthetic data, then run an optimization scan."}
    detail = get_run_detail(runs[0]["run_id"])
    recommendation_ids = [
        step["related_entity_id"]
        for step in detail["steps"]
        if step.get("related_entity_type") == "recommendation" and step.get("related_entity_id")
    ]
    return {
        "empty": False,
        "run": detail["run"],
        "current_issue": "Campaign performance scan found optimization candidates requiring evidence review.",
        "agents_involved": AGENT_NAMES,
        "recommendation_ids": sorted(set(recommendation_ids)),
        "evidence_summary": "Public summaries combine SQL performance scans, GraphRAG benchmark lookup, RAG document retrieval, and guardrail validation.",
        "risk_outcome": "Human review remains required for material spend and risk-sensitive changes.",
        "next_action": "Open the generated recommendation or run another scan after fresh ingestion.",
    }


def default_run() -> dict[str, Any]:
    return {
        "run_id": "RUN_DEMO",
        "run_type": "optimization_scan",
        "status": "completed",
        "started_at": now_iso(),
        "completed_at": now_iso(),
        "triggered_by": "demo",
        "summary": "Demo scan completed across campaign performance, benchmarks, risk rules, and approval readiness.",
        "error_message": None,
    }


def default_steps(run_id: str) -> list[dict[str, Any]]:
    base = now_iso()
    return [
        {
            "step_id": f"STEP_{run_id}_{index}",
            "run_id": run_id,
            "step_order": index,
            "agent_name": name,
            "status": "completed" if name != "Action Executor" else "waiting",
            "tool_used": tool,
            "public_summary": summary,
            "related_entity_type": "run",
            "related_entity_id": run_id,
            "started_at": base,
            "completed_at": base,
        }
        for index, (name, tool, summary) in enumerate(
            [
                ("Data Scout", "SQL performance scan", "Scanned campaign performance and schema freshness."),
                ("Pattern Miner", "GraphRAG benchmark lookup", "Matched anonymized benchmarks for similar brands."),
                ("Recommendation Engine", "Recommendation synthesis", "Prepared optimization candidates for review."),
                ("Evidence + Risk Grader", "Guardrail validation", "Validated confidence, risk, and approval requirements."),
                ("Human Interface", "Approval workflow", "Queued recommendations for human review."),
                ("Action Executor", "Execution queue", "Waiting for execution approval."),
            ],
            start=1,
        )
    ]

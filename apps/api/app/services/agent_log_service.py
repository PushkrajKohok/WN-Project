"""Public agent activity logs with database persistence and in-memory fallback."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from app.db import fetch_all, get_db_connection, is_db_configured
from mock_data import AGENT_LOGS

_fallback_logs: list[dict[str, Any]] = []


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _normalize_log(row: dict[str, Any]) -> dict[str, Any]:
    ts = row.get("ts") or row.get("created_at") or now_iso()
    if hasattr(ts, "isoformat"):
        ts = ts.isoformat()
    return {
        "id": row.get("id") or row.get("log_id") or f"log-{uuid.uuid4().hex[:10]}",
        "log_id": row.get("log_id") or row.get("id") or f"log-{uuid.uuid4().hex[:10]}",
        "agent": row.get("agent") or row.get("agent_name") or "System",
        "agent_name": row.get("agent_name") or row.get("agent") or "System",
        "message": row.get("message") or "",
        "level": row.get("level") or row.get("severity") or "info",
        "severity": row.get("severity") or row.get("level") or "info",
        "ts": ts,
        "created_at": ts,
        "related_entity_type": row.get("related_entity_type"),
        "related_entity_id": row.get("related_entity_id"),
    }


def create_agent_log(
    agent: str,
    message: str,
    level: str = "info",
    job_id: Optional[str] = None,
    related_entity_type: Optional[str] = None,
    related_entity_id: Optional[str] = None,
) -> dict[str, Any]:
    log = {
        "id": f"log-{uuid.uuid4().hex[:10]}",
        "agent": agent,
        "message": message,
        "level": level,
        "ts": now_iso(),
        "related_entity_type": related_entity_type,
        "related_entity_id": related_entity_id,
    }

    _fallback_logs.insert(0, log)

    if is_db_configured():
        try:
            with get_db_connection() as conn:
                conn.execute(
                    """
                    INSERT INTO agent_logs (
                        log_id, job_id, agent, message, level,
                        related_entity_type, related_entity_id, created_at
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, now())
                    """,
                    (log["id"], job_id, agent, message, level, related_entity_type, related_entity_id),
                )
        except Exception:
            pass

    return log


def create_generation_logs(job_id: Optional[str] = None) -> None:
    create_agent_log("Data Scout", "Data Scout started synthetic data generation.", "info", job_id)
    create_agent_log("Data Scout", "Data Scout validated generated CSV files.", "success", job_id)


def create_ingestion_logs(
    row_counts: Optional[dict[str, int]] = None,
    job_id: Optional[str] = None,
) -> None:
    counts = row_counts or {}
    if counts.get("ad_performance_daily", 0) > 0:
        create_agent_log(
            "Data Scout",
            "Data Scout loaded ad performance records into Postgres.",
            "success",
            job_id,
        )
    create_agent_log(
        "Pattern Miner",
        "Pattern Miner indexed cross-client benchmarks.",
        "info",
        job_id,
    )
    create_agent_log(
        "Pattern Miner",
        "Pattern Miner prepared knowledge graph edges.",
        "info",
        job_id,
    )
    if counts.get("recommendation_records", 0) > 0:
        create_agent_log(
            "Recommendation Engine",
            "Recommendation Engine detected recommendation records.",
            "success",
            job_id,
        )
    create_agent_log(
        "Evidence + Risk Grader",
        "Evidence + Risk Grader marked recommendations ready for review.",
        "info",
        job_id,
    )
    create_agent_log(
        "Action Executor",
        "Action Executor is idle until approval is granted.",
        "info",
        job_id,
    )


def create_ingestion_failure_log(message: str, job_id: Optional[str] = None) -> None:
    create_agent_log("Data Scout", message, "warning", job_id)


def get_agent_logs(
    limit: int = 20,
    offset: int = 0,
    agent_name: Optional[str] = None,
    severity: Optional[str] = None,
    search: Optional[str] = None,
) -> dict[str, Any]:
    if is_db_configured():
        try:
            clauses: list[str] = []
            params: list[Any] = []
            if agent_name:
                clauses.append("agent = %s")
                params.append(agent_name)
            if severity:
                clauses.append("level = %s")
                params.append(severity)
            if search:
                clauses.append("message ILIKE %s")
                params.append(f"%{search}%")
            where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
            rows = fetch_all(
                f"""
                SELECT log_id AS id, log_id, agent, agent AS agent_name, message, level, level AS severity,
                       related_entity_type, related_entity_id, created_at AS ts
                FROM agent_logs
                {where}
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
                """,
                tuple(params + [limit, offset]),
            )
            total = fetch_all(f"SELECT COUNT(*) AS total FROM agent_logs {where}", tuple(params))
            items = [_normalize_log(row) for row in rows]
            return {"items": items, "logs": items, "total": int(total[0]["total"] if total else len(items)), "source": "database"}
        except Exception:
            pass

    logs = [_normalize_log(row) for row in _fallback_logs]
    if not logs:
        logs = [_normalize_log(row) for row in AGENT_LOGS]
    if agent_name:
        logs = [log for log in logs if log["agent_name"] == agent_name]
    if severity:
        logs = [log for log in logs if log["severity"] == severity]
    if search:
        logs = [log for log in logs if search.lower() in log["message"].lower()]
    items = logs[offset : offset + limit]
    return {"items": items, "logs": items, "total": len(logs), "source": "fallback"}

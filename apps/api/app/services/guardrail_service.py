"""Guardrail settings, impact preview, and audit-log service."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from fastapi import HTTPException

from app.db import fetch_all, fetch_one, get_db_connection, is_db_configured
from app.services.agent_log_service import create_agent_log, get_agent_logs
from mock_data import GUARDRAILS, RECOMMENDATIONS

PRIVACY_MODES = {"aggregated_only", "k_anonymized", "internal_firewalled"}

DEFAULT_GUARDRAILS = {
    "confidence_threshold": 0.75,
    "auto_execute_confidence_threshold": 0.90,
    "max_auto_execute_weekly_savings": 2500,
    "high_risk_requires_approval": True,
    "medium_risk_requires_approval": True,
    "budget_changes_require_approval": True,
    "campaign_pause_requires_approval": True,
    "rollback_required_for_execution": True,
    "fresh_data_required": True,
    "max_data_staleness_hours": 24,
    "auto_execute_low_risk_audience_refresh": True,
    "auto_execute_tracking_fix": False,
    "auto_execute_budget_shift": False,
    "auto_execute_campaign_pause": False,
    "cross_client_privacy_mode": "aggregated_only",
    "require_benchmark_support": True,
    "min_benchmark_sample_size": 10,
    "min_benchmark_confidence": 0.65,
}

_fallback_settings = {
    **DEFAULT_GUARDRAILS,
    "confidence_threshold": GUARDRAILS.get("confidence_threshold", DEFAULT_GUARDRAILS["confidence_threshold"]),
    "updated_at": None,
    "source": "mock",
}


def number(value: Any) -> float:
    if value is None:
        return 0.0
    if isinstance(value, Decimal):
        return float(value)
    return float(value)


def iso(value: Any) -> str | None:
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def settings_payload(row: dict[str, Any], source: str) -> dict[str, Any]:
    payload = {**DEFAULT_GUARDRAILS, **(row or {})}
    for key in (
        "confidence_threshold",
        "auto_execute_confidence_threshold",
        "max_auto_execute_weekly_savings",
        "min_benchmark_confidence",
    ):
        payload[key] = number(payload.get(key))
    payload["min_benchmark_sample_size"] = int(payload.get("min_benchmark_sample_size") or 1)
    payload["max_data_staleness_hours"] = int(payload.get("max_data_staleness_hours") or 24)
    payload["updated_at"] = iso(payload.get("updated_at"))
    payload["source"] = source
    return payload


def get_guardrails() -> dict[str, Any]:
    if is_db_configured():
        try:
            ensure_defaults()
            row = fetch_one("SELECT * FROM guardrail_settings ORDER BY id ASC LIMIT 1") or {}
            return settings_payload(row, "database")
        except Exception:
            pass
    return settings_payload(_fallback_settings, "mock")


def ensure_defaults() -> None:
    with get_db_connection() as conn:
        conn.execute(
            """
            INSERT INTO guardrail_settings (
                id, confidence_threshold, auto_execute_confidence_threshold,
                max_auto_execute_weekly_savings, high_risk_requires_approval,
                medium_risk_requires_approval, budget_changes_require_approval,
                campaign_pause_requires_approval, rollback_required_for_execution,
                fresh_data_required, max_data_staleness_hours,
                auto_execute_low_risk_audience_refresh, auto_execute_tracking_fix,
                auto_execute_budget_shift, auto_execute_campaign_pause,
                cross_client_privacy_mode, require_benchmark_support,
                min_benchmark_sample_size, min_benchmark_confidence, updated_at
            )
            VALUES (1, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, now())
            ON CONFLICT (id) DO NOTHING
            """,
            (
                DEFAULT_GUARDRAILS["confidence_threshold"],
                DEFAULT_GUARDRAILS["auto_execute_confidence_threshold"],
                DEFAULT_GUARDRAILS["max_auto_execute_weekly_savings"],
                DEFAULT_GUARDRAILS["high_risk_requires_approval"],
                DEFAULT_GUARDRAILS["medium_risk_requires_approval"],
                DEFAULT_GUARDRAILS["budget_changes_require_approval"],
                DEFAULT_GUARDRAILS["campaign_pause_requires_approval"],
                DEFAULT_GUARDRAILS["rollback_required_for_execution"],
                DEFAULT_GUARDRAILS["fresh_data_required"],
                DEFAULT_GUARDRAILS["max_data_staleness_hours"],
                DEFAULT_GUARDRAILS["auto_execute_low_risk_audience_refresh"],
                DEFAULT_GUARDRAILS["auto_execute_tracking_fix"],
                DEFAULT_GUARDRAILS["auto_execute_budget_shift"],
                DEFAULT_GUARDRAILS["auto_execute_campaign_pause"],
                DEFAULT_GUARDRAILS["cross_client_privacy_mode"],
                DEFAULT_GUARDRAILS["require_benchmark_support"],
                DEFAULT_GUARDRAILS["min_benchmark_sample_size"],
                DEFAULT_GUARDRAILS["min_benchmark_confidence"],
            ),
        )


def validate_update(payload: dict[str, Any], current: dict[str, Any] | None = None) -> dict[str, Any]:
    allowed = set(DEFAULT_GUARDRAILS)
    clean = {key: value for key, value in payload.items() if key in allowed and value is not None}
    merged = {**(current or get_guardrails()), **clean}
    for key in ("confidence_threshold", "auto_execute_confidence_threshold", "min_benchmark_confidence"):
        if key in clean and not 0 <= float(clean[key]) <= 1:
            raise HTTPException(status_code=400, detail=f"{key} must be between 0 and 1.")
    if float(merged["auto_execute_confidence_threshold"]) < float(merged["confidence_threshold"]):
        raise HTTPException(status_code=400, detail="auto_execute_confidence_threshold must be greater than or equal to confidence_threshold.")
    if "max_auto_execute_weekly_savings" in clean and float(clean["max_auto_execute_weekly_savings"]) < 0:
        raise HTTPException(status_code=400, detail="max_auto_execute_weekly_savings must be greater than or equal to 0.")
    if "max_data_staleness_hours" in clean and int(clean["max_data_staleness_hours"]) < 1:
        raise HTTPException(status_code=400, detail="max_data_staleness_hours must be at least 1.")
    if "min_benchmark_sample_size" in clean and int(clean["min_benchmark_sample_size"]) < 1:
        raise HTTPException(status_code=400, detail="min_benchmark_sample_size must be at least 1.")
    if "cross_client_privacy_mode" in clean and clean["cross_client_privacy_mode"] not in PRIVACY_MODES:
        raise HTTPException(status_code=400, detail="cross_client_privacy_mode must be aggregated_only, k_anonymized, or internal_firewalled.")
    return clean


def update_guardrails(payload: dict[str, Any]) -> dict[str, Any]:
    current = get_guardrails()
    clean = validate_update(payload, current)
    if not clean:
        return current
    if is_db_configured():
        try:
            ensure_defaults()
            assignments = ", ".join(f"{key} = %s" for key in clean)
            params = list(clean.values())
            with get_db_connection() as conn:
                conn.execute(f"UPDATE guardrail_settings SET {assignments}, updated_at = now() WHERE id = 1", tuple(params))
            create_agent_log("Human Interface", "Guardrail settings were updated by operator.", "info", related_entity_type="guardrails", related_entity_id="settings")
            return get_guardrails()
        except Exception:
            pass
    _fallback_settings.update(clean)
    create_agent_log("Human Interface", "Guardrail settings were updated by operator.", "info", related_entity_type="guardrails", related_entity_id="settings")
    return settings_payload(_fallback_settings, "mock")


def reset_guardrails() -> dict[str, Any]:
    if is_db_configured():
        try:
            ensure_defaults()
            columns = ", ".join(f"{key} = %s" for key in DEFAULT_GUARDRAILS)
            with get_db_connection() as conn:
                conn.execute(f"UPDATE guardrail_settings SET {columns}, updated_at = now() WHERE id = 1", tuple(DEFAULT_GUARDRAILS.values()))
            create_agent_log("Human Interface", "Guardrail settings were reset to defaults by operator.", "info", related_entity_type="guardrails", related_entity_id="settings")
            return get_guardrails()
        except Exception:
            pass
    _fallback_settings.clear()
    _fallback_settings.update({**DEFAULT_GUARDRAILS, "updated_at": None, "source": "mock"})
    create_agent_log("Human Interface", "Guardrail settings were reset to defaults by operator.", "info", related_entity_type="guardrails", related_entity_id="settings")
    return settings_payload(_fallback_settings, "mock")


def get_guardrail_impact_preview() -> dict[str, Any]:
    settings = get_guardrails()
    recommendations = recommendation_rows()
    counts = {
        "total_recommendations": len(recommendations),
        "auto_execute_eligible": 0,
        "human_approval_required": 0,
        "needs_more_evidence": 0,
        "blocked_by_guardrails": 0,
        "high_risk_blocked_or_review": 0,
        "budget_or_pause_review": 0,
        "low_confidence_review": 0,
        "missing_benchmark_review": 0,
        "source": "database" if is_db_configured() else "mock",
    }
    for rec in recommendations:
        outcome = classify_recommendation(rec, settings)
        counts[outcome] += 1
        if rec["risk_level"] == "High" and outcome in {"human_approval_required", "blocked_by_guardrails"}:
            counts["high_risk_blocked_or_review"] += 1
        if is_budget_or_pause(rec) and outcome == "human_approval_required":
            counts["budget_or_pause_review"] += 1
        if rec["confidence_score"] < settings["confidence_threshold"]:
            counts["low_confidence_review"] += 1
        if settings["require_benchmark_support"] and not rec.get("supporting_benchmark_id"):
            counts["missing_benchmark_review"] += 1
    return counts


def recommendation_rows() -> list[dict[str, Any]]:
    if is_db_configured():
        try:
            rows = fetch_all(
                """
                SELECT recommendation_id, recommendation_type, target_platform, supporting_benchmark_id,
                       expected_weekly_savings, confidence_score, risk_level, decision_required, status
                FROM recommendation_records
                ORDER BY detected_at DESC NULLS LAST
                LIMIT 500
                """
            )
            return [recommendation_item(row) for row in rows]
        except Exception:
            pass
    return [recommendation_item(row) for row in RECOMMENDATIONS]


def recommendation_item(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "recommendation_id": row.get("recommendation_id") or row.get("id"),
        "recommendation_type": row.get("recommendation_type") or row.get("type") or "",
        "target_platform": row.get("target_platform") or row.get("platform") or "",
        "supporting_benchmark_id": row.get("supporting_benchmark_id") or row.get("benchmark_id"),
        "expected_weekly_savings": number(row.get("expected_weekly_savings", row.get("expected_savings", 0))),
        "confidence_score": number(row.get("confidence_score", row.get("confidence", 0))),
        "risk_level": str(row.get("risk_level") or row.get("risk") or "Medium").capitalize(),
        "decision_required": row.get("decision_required") or ("human_approval" if str(row.get("risk", "")).lower() != "low" else "auto_execute_allowed"),
        "status": row.get("status"),
    }


def classify_recommendation(rec: dict[str, Any], settings: dict[str, Any]) -> str:
    if settings["fresh_data_required"] and False:
        return "blocked_by_guardrails"
    if settings["cross_client_privacy_mode"] not in PRIVACY_MODES:
        return "blocked_by_guardrails"
    if rec["confidence_score"] < settings["confidence_threshold"]:
        return "needs_more_evidence"
    if settings["require_benchmark_support"] and not rec.get("supporting_benchmark_id"):
        return "needs_more_evidence"
    if rec["risk_level"] == "High" and settings["high_risk_requires_approval"]:
        return "human_approval_required"
    if rec["risk_level"] == "Medium" and settings["medium_risk_requires_approval"]:
        return "human_approval_required"
    if is_budget_or_pause(rec) and (settings["budget_changes_require_approval"] or settings["campaign_pause_requires_approval"]):
        return "human_approval_required"
    if auto_execute_allowed(rec, settings):
        return "auto_execute_eligible"
    return "human_approval_required"


def is_budget_or_pause(rec: dict[str, Any]) -> bool:
    text = str(rec.get("recommendation_type") or "").lower()
    return any(term in text for term in ("budget", "bid", "pause", "campaign"))


def auto_execute_allowed(rec: dict[str, Any], settings: dict[str, Any]) -> bool:
    rec_type = str(rec.get("recommendation_type") or "").lower()
    type_allowed = (
        ("audience" in rec_type and settings["auto_execute_low_risk_audience_refresh"])
        or ("tracking" in rec_type and settings["auto_execute_tracking_fix"])
        or ("budget" in rec_type and settings["auto_execute_budget_shift"])
        or ("pause" in rec_type and settings["auto_execute_campaign_pause"])
    )
    return (
        rec["risk_level"] == "Low"
        and rec["confidence_score"] >= settings["auto_execute_confidence_threshold"]
        and rec["expected_weekly_savings"] <= settings["max_auto_execute_weekly_savings"]
        and type_allowed
        and rec.get("decision_required") in {"auto_execute_allowed", "human_approval", None}
    )


def get_guardrail_audit_log(limit: int = 50) -> dict[str, Any]:
    if is_db_configured():
        try:
            rows = fetch_all(
                """
                SELECT log_id, agent AS agent_name, message, level AS severity, created_at
                FROM agent_logs
                WHERE agent IN ('Human Interface', 'Evidence + Risk Grader', 'Action Executor')
                   OR message ILIKE '%guardrail%'
                   OR message ILIKE '%approval%'
                   OR message ILIKE '%risk%'
                   OR message ILIKE '%threshold%'
                ORDER BY created_at DESC
                LIMIT %s
                """,
                (limit,),
            )
            return {"items": [audit_item(row) for row in rows], "source": "database"}
        except Exception:
            pass
    logs = get_agent_logs(limit=200).get("items", [])
    filtered = [
        log for log in logs
        if log["agent_name"] in {"Human Interface", "Evidence + Risk Grader", "Action Executor"}
        or any(term in log["message"].lower() for term in ("guardrail", "approval", "risk", "threshold"))
    ]
    return {"items": [audit_item(log) for log in filtered[:limit]], "source": "mock"}


def audit_item(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "log_id": row.get("log_id") or row.get("id"),
        "agent_name": row.get("agent_name") or row.get("agent"),
        "message": row.get("message"),
        "severity": row.get("severity") or row.get("level") or "info",
        "created_at": iso(row.get("created_at") or row.get("ts")),
    }

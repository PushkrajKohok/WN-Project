"""Recommendation queue service with database-first behavior and mock fallback."""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Optional

from fastapi import HTTPException

from app.db import fetch_all, fetch_one, get_db_connection, is_db_configured
from app.services import evidence_service
from app.services.agent_log_service import create_agent_log
from mock_data import CLIENTS, RECOMMENDATIONS

STATUSES = ["new", "approved", "executed", "dismissed", "needs_more_evidence"]
DECISIONS = ["human_approval", "auto_execute_allowed"]
RISK_LEVELS = ["Low", "Medium", "High"]
SORT_COLUMNS = {
    "detected_at": "r.detected_at",
    "expected_weekly_savings": "r.expected_weekly_savings",
    "confidence_score": "r.confidence_score",
    "risk_level": "risk_rank",
}

_mock_records = [dict(rec) for rec in RECOMMENDATIONS]


def number(value: Any) -> float:
    if isinstance(value, Decimal):
        return float(value)
    if value is None:
        return 0.0
    return float(value)


def iso(value: Any) -> Optional[str]:
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def normalize_status(value: Optional[str]) -> str:
    status = (value or "new").strip().lower().replace(" ", "_")
    return {
        "pending": "new",
        "rejected": "dismissed",
        "auto_approved": "approved",
        "generated": "new",
    }.get(status, status)


def normalize_decision(value: Any, risk: Optional[str] = None) -> str:
    if isinstance(value, bool):
        return "human_approval" if value else "auto_execute_allowed"
    decision = str(value or "").strip().lower()
    if decision in DECISIONS:
        return decision
    return "auto_execute_allowed" if (risk or "").lower() == "low" else "human_approval"


def recommendation_item(row: dict[str, Any]) -> dict[str, Any]:
    risk = row.get("risk_level") or row.get("risk") or "Low"
    return {
        "recommendation_id": row.get("recommendation_id") or row.get("id"),
        "client_id": row.get("client_id"),
        "brand_name": row.get("brand_name") or row.get("client_name") or row.get("client_id"),
        "brand_category": row.get("brand_category"),
        "monthly_ad_spend_band": row.get("monthly_ad_spend_band"),
        "recommendation_type": row.get("recommendation_type") or row.get("type") or "optimization",
        "title": row.get("title"),
        "target_platform": row.get("target_platform") or row.get("platform") or "Unknown",
        "target_campaign_id": row.get("target_campaign_id"),
        "evidence_summary": row.get("evidence_summary") or row.get("summary") or "",
        "supporting_benchmark_id": row.get("supporting_benchmark_id"),
        "expected_weekly_savings": number(row.get("expected_weekly_savings") or row.get("expected_savings")),
        "expected_roas_lift_pct": number(row.get("expected_roas_lift_pct")),
        "confidence_score": number(row.get("confidence_score") or row.get("confidence")),
        "risk_level": str(risk).capitalize(),
        "decision_required": normalize_decision(row.get("decision_required"), str(risk)),
        "status": normalize_status(row.get("status")),
        "detected_at": iso(row.get("detected_at") or row.get("created_at")),
    }


def detail_item(row: dict[str, Any]) -> dict[str, Any]:
    item = recommendation_item(row)
    evidence = item["evidence_summary"] or "Recommendation generated from performance and benchmark signals."
    return {
        "id": item["recommendation_id"],
        "title": item["title"],
        "client_id": item["client_id"],
        "client_name": item["brand_name"],
        "platform": item["target_platform"],
        "type": item["recommendation_type"],
        "expected_savings": item["expected_weekly_savings"],
        "confidence": item["confidence_score"],
        "risk": item["risk_level"].lower(),
        "status": item["status"],
        "decision_required": item["status"] in ("new", "needs_more_evidence", "approved"),
        "created_at": item["detected_at"],
        "summary": evidence,
        "evidence": {
            "sql": "Loaded from recommendation_records joined to clients and benchmark evidence.",
            "graph": row.get("benchmark_strategy") or "Supporting benchmark evidence will be expanded in Prompt 6.",
            "vector": "RAG document retrieval is planned for Prompt 6.",
        },
        "risk_assessment": f"{item['risk_level']} risk based on confidence, expected savings, and guardrail policy.",
        "rollback_plan": "Approved actions are not executed yet. Rollback details will be attached when execution is implemented.",
        "agent_trace": [
            {
                "agent": "Recommendation Engine",
                "action": evidence,
                "ts": item["detected_at"],
            }
        ],
    }


def client_item(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "client_id": row.get("client_id"),
        "brand_name": row.get("brand_name") or row.get("client_name") or row.get("client_id"),
        "brand_category": row.get("brand_category"),
        "monthly_ad_spend_band": row.get("monthly_ad_spend_band"),
        "avg_order_value": number(row.get("avg_order_value")),
        "gross_margin_pct": number(row.get("gross_margin_pct")),
        "data_consent_status": row.get("data_consent_status") or "aggregated_only",
    }


def mock_client(recommendation: dict[str, Any]) -> dict[str, Any]:
    client = next((item for item in CLIENTS if item["id"] == recommendation["client_id"]), None)
    return {
        "client_id": recommendation["client_id"],
        "brand_name": recommendation["brand_name"],
        "brand_category": recommendation.get("brand_category") or (client or {}).get("vertical"),
        "monthly_ad_spend_band": recommendation.get("monthly_ad_spend_band") or "$10k-$50k",
        "avg_order_value": 92.0,
        "gross_margin_pct": 0.58,
        "data_consent_status": "synthetic_demo",
    }


def detail_response(row: dict[str, Any], source: str) -> dict[str, Any]:
    recommendation = recommendation_item(row)
    client = client_item(row) if source == "database" else mock_client(recommendation)
    recommendation["brand_category"] = recommendation.get("brand_category") or client.get("brand_category")
    recommendation["monthly_ad_spend_band"] = recommendation.get("monthly_ad_spend_band") or client.get("monthly_ad_spend_band")
    evidence = evidence_service.get_recommendation_evidence(recommendation)
    risk_validation = evidence_service.get_risk_validation(recommendation)
    agent_trace = evidence_service.get_agent_trace(recommendation)
    rollback_plan = evidence_service.get_rollback_plan(recommendation)
    return {
        "recommendation": recommendation,
        "client": client,
        "campaign": evidence["sql_evidence"]["campaign_settings"],
        "evidence": evidence,
        "risk_validation": risk_validation,
        "agent_trace": agent_trace,
        "rollback_plan": rollback_plan,
        "related_history": rollback_plan["related_past_actions"],
        "source": source,
    }


def where_sql(clauses: list[str]) -> str:
    return f"WHERE {' AND '.join(clauses)}" if clauses else ""


def build_filters(filters: dict[str, Any]) -> tuple[list[str], list[Any]]:
    clauses: list[str] = []
    params: list[Any] = []
    if filters.get("client_id"):
        clauses.append("r.client_id = %s")
        params.append(filters["client_id"])
    if filters.get("platform"):
        clauses.append("lower(r.target_platform) = lower(%s)")
        params.append(filters["platform"])
    if filters.get("risk_level"):
        clauses.append("lower(r.risk_level) = lower(%s)")
        params.append(filters["risk_level"])
    if filters.get("status"):
        clauses.append("lower(r.status) = lower(%s)")
        params.append(filters["status"])
    if filters.get("decision_required"):
        clauses.append("lower(CAST(r.decision_required AS TEXT)) = lower(%s)")
        params.append(filters["decision_required"])
    if filters.get("search"):
        pattern = f"%{filters['search']}%"
        clauses.append(
            """
            (
                r.title ILIKE %s OR r.evidence_summary ILIKE %s OR c.brand_name ILIKE %s
                OR r.recommendation_type ILIKE %s OR r.target_platform ILIKE %s
                OR r.target_campaign_id ILIKE %s
            )
            """
        )
        params.extend([pattern] * 6)
    return clauses, params


def list_recommendations(filters: dict[str, Any]) -> dict[str, Any]:
    if not is_db_configured():
        return mock_list_recommendations(filters)

    clauses, params = build_filters(filters)
    sort_by = filters.get("sort_by") if filters.get("sort_by") in SORT_COLUMNS else "detected_at"
    sort_dir = "ASC" if str(filters.get("sort_dir", "desc")).lower() == "asc" else "DESC"
    sort_expr = SORT_COLUMNS[sort_by]
    if sort_by == "risk_level":
        sort_expr = "CASE lower(r.risk_level) WHEN 'high' THEN 3 WHEN 'medium' THEN 2 WHEN 'low' THEN 1 ELSE 0 END"
    limit = int(filters.get("limit") or 50)
    offset = int(filters.get("offset") or 0)
    try:
        rows = fetch_all(
            f"""
            SELECT r.*, c.brand_name, c.brand_category, b.strategy AS benchmark_strategy
            FROM recommendation_records r
            LEFT JOIN clients c ON c.client_id = r.client_id
            LEFT JOIN cross_client_benchmarks b ON b.benchmark_id = r.supporting_benchmark_id
            {where_sql(clauses)}
            ORDER BY {sort_expr} {sort_dir} NULLS LAST
            LIMIT %s OFFSET %s
            """,
            tuple(params + [limit, offset]),
        )
        total = fetch_one(
            f"""
            SELECT COUNT(*) AS total
            FROM recommendation_records r
            LEFT JOIN clients c ON c.client_id = r.client_id
            {where_sql(clauses)}
            """,
            tuple(params),
        )
        return {
            "items": [recommendation_item(row) for row in rows],
            "total": int((total or {}).get("total") or 0),
            "limit": limit,
            "offset": offset,
            "source": "database",
        }
    except Exception:
        return mock_list_recommendations(filters)


def mock_list_recommendations(filters: dict[str, Any]) -> dict[str, Any]:
    items = [recommendation_item(rec) for rec in _mock_records]
    search = (filters.get("search") or "").lower()
    if filters.get("client_id"):
        items = [item for item in items if item["client_id"] == filters["client_id"]]
    if filters.get("platform"):
        items = [item for item in items if item["target_platform"].lower() == filters["platform"].lower()]
    if filters.get("risk_level"):
        items = [item for item in items if item["risk_level"].lower() == filters["risk_level"].lower()]
    if filters.get("status"):
        items = [item for item in items if item["status"] == filters["status"]]
    if filters.get("decision_required"):
        items = [item for item in items if item["decision_required"] == filters["decision_required"]]
    if search:
        items = [
            item
            for item in items
            if search in " ".join(
                [
                    item["title"],
                    item["brand_name"],
                    item["recommendation_type"],
                    item["target_platform"],
                    item.get("target_campaign_id") or "",
                    item["evidence_summary"],
                ]
            ).lower()
        ]
    sort_by = filters.get("sort_by") or "detected_at"
    reverse = filters.get("sort_dir", "desc") != "asc"
    risk_rank = {"High": 3, "Medium": 2, "Low": 1}
    if sort_by == "risk_level":
        items.sort(key=lambda item: risk_rank.get(item["risk_level"], 0), reverse=reverse)
    else:
        items.sort(key=lambda item: item.get(sort_by) or "", reverse=reverse)
    total = len(items)
    offset = int(filters.get("offset") or 0)
    limit = int(filters.get("limit") or 50)
    return {"items": items[offset : offset + limit], "total": total, "limit": limit, "offset": offset, "source": "mock"}


def get_recommendation_detail(recommendation_id: str) -> dict[str, Any]:
    if is_db_configured():
        try:
            row = fetch_one(
                """
                SELECT
                    r.*,
                    c.brand_name,
                    c.brand_category,
                    c.monthly_ad_spend_band,
                    c.avg_order_value,
                    c.gross_margin_pct,
                    c.data_consent_status,
                    b.strategy AS benchmark_strategy
                FROM recommendation_records r
                LEFT JOIN clients c ON c.client_id = r.client_id
                LEFT JOIN cross_client_benchmarks b ON b.benchmark_id = r.supporting_benchmark_id
                WHERE r.recommendation_id = %s
                """,
                (recommendation_id,),
            )
            if row:
                return detail_response(row, "database")
        except Exception:
            pass
    rec = next((item for item in _mock_records if item["id"] == recommendation_id), None)
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return detail_response(rec, "mock")


def get_recommendation_evidence(recommendation_id: str) -> dict[str, Any]:
    return get_recommendation_detail(recommendation_id)["evidence"]


def get_recommendation_agent_trace(recommendation_id: str) -> list[dict[str, Any]]:
    return get_recommendation_detail(recommendation_id)["agent_trace"]


def get_recommendation_risk_validation(recommendation_id: str) -> dict[str, Any]:
    return get_recommendation_detail(recommendation_id)["risk_validation"]


def get_recommendation_rollback_plan(recommendation_id: str) -> dict[str, Any]:
    return get_recommendation_detail(recommendation_id)["rollback_plan"]


def get_recommendation_facets() -> dict[str, Any]:
    if not is_db_configured():
        return mock_recommendation_facets()
    try:
        clients = fetch_all(
            """
            SELECT DISTINCT c.client_id, c.brand_name, c.brand_category
            FROM clients c
            INNER JOIN recommendation_records r ON r.client_id = c.client_id
            ORDER BY c.brand_name
            """
        )
        platforms = [
            row["target_platform"]
            for row in fetch_all(
                "SELECT DISTINCT target_platform FROM recommendation_records WHERE target_platform IS NOT NULL ORDER BY target_platform"
            )
        ]
        return {
            "clients": clients,
            "platforms": platforms or ["Meta", "Google"],
            "risk_levels": RISK_LEVELS,
            "statuses": STATUSES,
            "decision_required": DECISIONS,
            "source": "database",
        }
    except Exception:
        return mock_recommendation_facets()


def mock_recommendation_facets() -> dict[str, Any]:
    clients = [
        {"client_id": client["id"], "brand_name": client["name"], "brand_category": client["vertical"]}
        for client in CLIENTS
    ]
    return {
        "clients": clients,
        "platforms": ["Meta", "Google"],
        "risk_levels": RISK_LEVELS,
        "statuses": STATUSES,
        "decision_required": DECISIONS,
        "source": "mock",
    }


def get_recommendation_summary() -> dict[str, Any]:
    if not is_db_configured():
        items = [recommendation_item(rec) for rec in _mock_records]
        return summary_from_items(items, "mock")
    try:
        row = fetch_one(
            """
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE lower(status) = 'new') AS new,
                COUNT(*) FILTER (WHERE lower(status) = 'approved') AS approved,
                COUNT(*) FILTER (WHERE lower(status) = 'executed') AS executed,
                COUNT(*) FILTER (WHERE lower(status) = 'dismissed') AS dismissed,
                COUNT(*) FILTER (WHERE lower(status) = 'needs_more_evidence') AS needs_more_evidence,
                COUNT(*) FILTER (
                    WHERE lower(CAST(decision_required AS TEXT)) IN ('human_approval', 'true', 't', '1')
                ) AS human_approval_required,
                COUNT(*) FILTER (
                    WHERE lower(CAST(decision_required AS TEXT)) IN ('auto_execute_allowed', 'false', 'f', '0')
                ) AS auto_execute_allowed,
                COUNT(*) FILTER (WHERE lower(risk_level) = 'high') AS high_risk,
                COALESCE(SUM(expected_weekly_savings) FILTER (
                    WHERE lower(status) IN ('new', 'approved', 'needs_more_evidence')
                ), 0) AS estimated_weekly_savings
            FROM recommendation_records
            """
        )
        return {
            "total": int(row["total"] or 0),
            "new": int(row["new"] or 0),
            "approved": int(row["approved"] or 0),
            "executed": int(row["executed"] or 0),
            "dismissed": int(row["dismissed"] or 0),
            "needs_more_evidence": int(row["needs_more_evidence"] or 0),
            "human_approval_required": int(row["human_approval_required"] or 0),
            "auto_execute_allowed": int(row["auto_execute_allowed"] or 0),
            "high_risk": int(row["high_risk"] or 0),
            "estimated_weekly_savings": number(row["estimated_weekly_savings"]),
            "source": "database",
        }
    except Exception:
        items = [recommendation_item(rec) for rec in _mock_records]
        return summary_from_items(items, "mock")


def summary_from_items(items: list[dict[str, Any]], source: str) -> dict[str, Any]:
    return {
        "total": len(items),
        "new": sum(1 for item in items if item["status"] == "new"),
        "approved": sum(1 for item in items if item["status"] == "approved"),
        "executed": sum(1 for item in items if item["status"] == "executed"),
        "dismissed": sum(1 for item in items if item["status"] == "dismissed"),
        "needs_more_evidence": sum(1 for item in items if item["status"] == "needs_more_evidence"),
        "human_approval_required": sum(1 for item in items if item["decision_required"] == "human_approval"),
        "auto_execute_allowed": sum(1 for item in items if item["decision_required"] == "auto_execute_allowed"),
        "high_risk": sum(1 for item in items if item["risk_level"] == "High"),
        "estimated_weekly_savings": sum(item["expected_weekly_savings"] for item in items if item["status"] in ("new", "approved", "needs_more_evidence")),
        "source": source,
    }


def update_recommendation_status(
    recommendation_id: str,
    status: str,
    agent: str,
    message: str,
    level: str = "info",
) -> dict[str, Any]:
    if is_db_configured():
        try:
            with get_db_connection() as conn:
                row = conn.execute(
                    """
                    UPDATE recommendation_records
                    SET status = %s
                    WHERE recommendation_id = %s
                    RETURNING *
                    """,
                    (status, recommendation_id),
                ).fetchone()
                if not row:
                    raise HTTPException(status_code=404, detail="Recommendation not found")
            create_agent_log(agent, message, level, related_entity_type="recommendation", related_entity_id=recommendation_id)
            return get_recommendation_detail(recommendation_id)
        except HTTPException:
            raise
        except Exception:
            pass

    rec = next((item for item in _mock_records if item["id"] == recommendation_id), None)
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    rec["status"] = status
    rec["decision_required"] = status == "needs_more_evidence"
    create_agent_log(agent, message, level, related_entity_type="recommendation", related_entity_id=recommendation_id)
    return recommendation_item(rec)


def approve_recommendation(recommendation_id: str, approved_by: str, note: Optional[str] = None) -> dict[str, Any]:
    return update_recommendation_status(
        recommendation_id,
        "approved",
        "Human Interface",
        f"Recommendation {recommendation_id} approved by {approved_by}.",
    )


def reject_recommendation(recommendation_id: str, rejected_by: str, reason: str) -> dict[str, Any]:
    return update_recommendation_status(
        recommendation_id,
        "dismissed",
        "Human Interface",
        f"Recommendation {recommendation_id} rejected. Reason: {reason}",
        "warning",
    )


def mark_needs_more_evidence(recommendation_id: str, requested_by: str, note: Optional[str] = None) -> dict[str, Any]:
    return update_recommendation_status(
        recommendation_id,
        "needs_more_evidence",
        "Evidence + Risk Grader",
        f"Additional evidence requested for recommendation {recommendation_id}.",
        "info",
    )


def create_simulated_recommendation(run_id: str, client_id: Optional[str] = None, platform: str = "Meta") -> dict[str, Any]:
    recommendation_id = f"rec-scan-{run_id[-6:]}"
    existing = next((item for item in _mock_records if item.get("id") == recommendation_id), None)
    if existing:
        return recommendation_item(existing)

    client = next((item for item in CLIENTS if item["id"] == client_id), None) or CLIENTS[0]
    record = {
        "id": recommendation_id,
        "client_id": client["id"],
        "client_name": client["name"],
        "brand_category": client["vertical"],
        "title": "Budget Shift: Reallocate spend from weak ROAS cohort",
        "platform": platform if platform in ("Meta", "Google") else client.get("platform", "Meta"),
        "type": "budget_shift",
        "summary": "Data Scout detected elevated CPA and weak ROAS in a high-spend campaign segment. Pattern Miner found similar brands improved efficiency by shifting budget toward stronger cohorts.",
        "expected_savings": 6400.0,
        "expected_roas_lift_pct": 0.074,
        "confidence": 0.84,
        "risk": "medium",
        "decision_required": True,
        "status": "pending",
        "created_at": iso(datetime.now(timezone.utc)),
    }
    _mock_records.insert(0, record)
    return recommendation_item(record)

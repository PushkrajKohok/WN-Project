"""Database-backed dashboard aggregation with mock fallback."""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Optional

from app.db import fetch_all, fetch_one, is_db_configured
from app.services.agent_log_service import get_agent_logs
from app.services.ingestion_service import latest_ingestion_job_counts
from mock_data import AGENT_LOGS, CLIENTS, DASHBOARD_KPIS, RECOMMENDATIONS


def number(value: Any) -> float:
    if isinstance(value, Decimal):
        return float(value)
    if value is None:
        return 0.0
    return float(value)


def integer(value: Any) -> int:
    if value is None:
        return 0
    return int(value)


def iso(value: Any) -> Optional[str]:
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def platform_clause(alias: str, platform: Optional[str], clauses: list[str], params: list[Any]) -> None:
    if platform and platform.lower() != "all":
        clauses.append(f"lower({alias}) = lower(%s)")
        params.append(platform)


def client_clause(alias: str, client_id: Optional[str], clauses: list[str], params: list[Any]) -> None:
    if client_id and client_id != "all":
        clauses.append(f"{alias} = %s")
        params.append(client_id)


def where_sql(clauses: list[str]) -> str:
    return f"WHERE {' AND '.join(clauses)}" if clauses else ""


def mock_summary() -> dict[str, Any]:
    latest = latest_ingestion_job_counts()
    return {
        "total_clients": len(CLIENTS),
        "total_spend": 0,
        "total_revenue": 0,
        "avg_roas": 0,
        "avg_cpa": 0,
        "total_purchases": 0,
        "active_recommendations": DASHBOARD_KPIS["active_recommendations"],
        "high_risk_alerts": DASHBOARD_KPIS["high_risk_alerts"],
        "executed_actions": DASHBOARD_KPIS["auto_actions_executed"],
        "rolled_back_actions": 0,
        "estimated_weekly_savings": DASHBOARD_KPIS["wasted_spend_saved"],
        "latest_ingestion_status": latest["status"] if latest else "mock",
        "latest_ingestion_at": latest.get("completed_at") if latest else None,
        "schema_drift_open_items": 0,
        "cross_client_patterns": 47,
        "knowledge_graph_edges": 156,
        "source": "mock",
        "is_empty": False,
    }


def mock_performance_trend() -> list[dict[str, Any]]:
    values = DASHBOARD_KPIS["trend_7d"]["wasted_spend_saved"]
    return [
        {
            "date": f"2026-06-{index + 2:02d}",
            "spend": value * 0.8,
            "revenue": value * 2.2,
            "roas": 2.75,
            "cpa": 42.0,
            "purchases": 100 + index * 8,
            "source": "mock",
        }
        for index, value in enumerate(values)
    ]


def mock_risk_distribution() -> list[dict[str, Any]]:
    counts = {"Low": 0, "Medium": 0, "High": 0}
    for rec in RECOMMENDATIONS:
        counts[rec["risk"].capitalize()] += 1
    return [{"risk_level": key, "count": value, "source": "mock"} for key, value in counts.items()]


def mock_clients() -> list[dict[str, Any]]:
    return [
        {
            "client_id": client["id"],
            "brand_name": client["name"],
            "brand_category": client["vertical"],
            "monthly_ad_spend_band": "Demo",
            "source": "mock",
        }
        for client in CLIENTS
    ]


def get_summary(
    client_id: Optional[str] = None,
    days: int = 30,
    platform: Optional[str] = None,
) -> dict[str, Any]:
    if not is_db_configured():
        return mock_summary()

    perf_clauses = ["date >= CURRENT_DATE - (%s::int * INTERVAL '1 day')"]
    perf_params: list[Any] = [days]
    client_clause("client_id", client_id, perf_clauses, perf_params)
    platform_clause("platform", platform, perf_clauses, perf_params)

    rec_clauses = ["detected_at >= now() - (%s::int * INTERVAL '1 day')"]
    rec_params: list[Any] = [days]
    client_clause("client_id", client_id, rec_clauses, rec_params)
    platform_clause("target_platform", platform, rec_clauses, rec_params)

    opt_clauses = ["created_at >= now() - (%s::int * INTERVAL '1 day')"]
    opt_params: list[Any] = [days]
    client_clause("client_id", client_id, opt_clauses, opt_params)
    platform_clause("target_platform", platform, opt_clauses, opt_params)

    client_count_clauses: list[str] = []
    client_count_params: list[Any] = []
    client_clause("client_id", client_id, client_count_clauses, client_count_params)

    try:
        perf = fetch_one(
            f"""
            SELECT
                COALESCE(SUM(spend), 0) AS total_spend,
                COALESCE(SUM(revenue), 0) AS total_revenue,
                COALESCE(SUM(purchases), 0) AS total_purchases
            FROM ad_performance_daily
            {where_sql(perf_clauses)}
            """,
            tuple(perf_params),
        ) or {}
        rec = fetch_one(
            f"""
            SELECT
                COUNT(*) FILTER (
                    WHERE lower(status) IN ('new', 'needs_more_evidence', 'approved')
                ) AS active_recommendations,
                COUNT(*) FILTER (
                    WHERE lower(risk_level) = 'high'
                      AND lower(status) NOT IN ('dismissed', 'executed')
                ) AS high_risk_alerts,
                COALESCE(SUM(expected_weekly_savings) FILTER (
                    WHERE lower(status) IN ('new', 'needs_more_evidence', 'approved')
                ), 0) AS estimated_weekly_savings
            FROM recommendation_records
            {where_sql(rec_clauses)}
            """,
            tuple(rec_params),
        ) or {}
        opt = fetch_one(
            f"""
            SELECT
                COUNT(*) FILTER (WHERE lower(status) = 'executed') AS executed_actions,
                COUNT(*) FILTER (
                    WHERE rollback_flag = true OR lower(status) = 'rolled back'
                ) AS rolled_back_actions
            FROM optimization_history
            {where_sql(opt_clauses)}
            """,
            tuple(opt_params),
        ) or {}
        counts = fetch_one(
            f"""
            SELECT
                (SELECT COUNT(*) FROM clients {where_sql(client_count_clauses)}) AS total_clients,
                (SELECT COUNT(*) FROM schema_versions WHERE lower(status) IN ('monitoring', 'needs_review')) AS schema_drift_open_items,
                (SELECT COUNT(*) FROM cross_client_benchmarks) AS cross_client_patterns,
                (SELECT COUNT(*) FROM knowledge_graph_edges) AS knowledge_graph_edges
            """,
            tuple(client_count_params),
        ) or {}
        latest = fetch_one(
            """
            SELECT status, completed_at, started_at
            FROM ingestion_jobs
            ORDER BY started_at DESC
            LIMIT 1
            """
        )

        total_spend = number(perf.get("total_spend"))
        total_revenue = number(perf.get("total_revenue"))
        total_purchases = integer(perf.get("total_purchases"))
        return {
            "total_clients": integer(counts.get("total_clients")),
            "total_spend": total_spend,
            "total_revenue": total_revenue,
            "avg_roas": total_revenue / total_spend if total_spend > 0 else 0,
            "avg_cpa": total_spend / total_purchases if total_purchases > 0 else 0,
            "total_purchases": total_purchases,
            "active_recommendations": integer(rec.get("active_recommendations")),
            "high_risk_alerts": integer(rec.get("high_risk_alerts")),
            "executed_actions": integer(opt.get("executed_actions")),
            "rolled_back_actions": integer(opt.get("rolled_back_actions")),
            "estimated_weekly_savings": number(rec.get("estimated_weekly_savings")),
            "latest_ingestion_status": latest.get("status") if latest else None,
            "latest_ingestion_at": iso((latest or {}).get("completed_at") or (latest or {}).get("started_at")),
            "schema_drift_open_items": integer(counts.get("schema_drift_open_items")),
            "cross_client_patterns": integer(counts.get("cross_client_patterns")),
            "knowledge_graph_edges": integer(counts.get("knowledge_graph_edges")),
            "source": "database",
            "is_empty": integer(counts.get("total_clients")) == 0 and total_spend == 0,
        }
    except Exception:
        return mock_summary()


def get_performance_trend(
    client_id: Optional[str] = None,
    days: int = 30,
    platform: Optional[str] = None,
) -> list[dict[str, Any]]:
    if not is_db_configured():
        return mock_performance_trend()

    clauses = ["date >= CURRENT_DATE - (%s::int * INTERVAL '1 day')"]
    params: list[Any] = [days]
    client_clause("client_id", client_id, clauses, params)
    platform_clause("platform", platform, clauses, params)
    try:
        rows = fetch_all(
            f"""
            SELECT
                date,
                COALESCE(SUM(spend), 0) AS spend,
                COALESCE(SUM(revenue), 0) AS revenue,
                COALESCE(SUM(purchases), 0) AS purchases
            FROM ad_performance_daily
            {where_sql(clauses)}
            GROUP BY date
            ORDER BY date
            """,
            tuple(params),
        )
        trend = []
        for row in rows:
            spend = number(row["spend"])
            revenue = number(row["revenue"])
            purchases = integer(row["purchases"])
            trend.append(
                {
                    "date": iso(row["date"]),
                    "spend": spend,
                    "revenue": revenue,
                    "roas": revenue / spend if spend > 0 else 0,
                    "cpa": spend / purchases if purchases > 0 else 0,
                    "purchases": purchases,
                }
            )
        return trend
    except Exception:
        return mock_performance_trend()


def get_risk_distribution(
    client_id: Optional[str] = None,
    platform: Optional[str] = None,
) -> list[dict[str, Any]]:
    if not is_db_configured():
        return mock_risk_distribution()

    clauses: list[str] = []
    params: list[Any] = []
    client_clause("client_id", client_id, clauses, params)
    platform_clause("target_platform", platform, clauses, params)
    try:
        rows = fetch_all(
            f"""
            SELECT initcap(lower(risk_level)) AS risk_level, COUNT(*) AS count
            FROM recommendation_records
            {where_sql(clauses)}
            GROUP BY initcap(lower(risk_level))
            """,
            tuple(params),
        )
        values = {row["risk_level"]: integer(row["count"]) for row in rows}
        return [{"risk_level": risk, "count": values.get(risk, 0)} for risk in ["Low", "Medium", "High"]]
    except Exception:
        return mock_risk_distribution()


def get_priority_recommendations(
    limit: int = 5,
    client_id: Optional[str] = None,
    platform: Optional[str] = None,
) -> list[dict[str, Any]]:
    if not is_db_configured():
        priority = sorted(
            RECOMMENDATIONS,
            key=lambda rec: (
                {"high": 0, "medium": 1, "low": 2}.get(rec["risk"], 3),
                -float(rec["expected_savings"]),
            ),
        )[:limit]
        return [
            {
                "recommendation_id": rec["id"],
                "client_id": rec["client_id"],
                "brand_name": rec["client_name"],
                "title": rec["title"],
                "recommendation_type": rec["type"],
                "target_platform": rec["platform"],
                "target_campaign_id": None,
                "expected_weekly_savings": rec["expected_savings"],
                "expected_roas_lift_pct": 0,
                "confidence_score": rec["confidence"],
                "risk_level": rec["risk"].capitalize(),
                "decision_required": rec["decision_required"],
                "status": rec["status"],
                "detected_at": rec["created_at"],
                "source": "mock",
            }
            for rec in priority
        ]

    clauses = ["lower(r.status) IN ('new', 'needs_more_evidence', 'approved')"]
    params: list[Any] = []
    client_clause("r.client_id", client_id, clauses, params)
    platform_clause("r.target_platform", platform, clauses, params)
    try:
        rows = fetch_all(
            f"""
            SELECT
                r.recommendation_id,
                r.client_id,
                c.brand_name,
                r.title,
                r.recommendation_type,
                r.target_platform,
                r.target_campaign_id,
                r.expected_weekly_savings,
                r.expected_roas_lift_pct,
                r.confidence_score,
                r.risk_level,
                r.decision_required,
                r.status,
                r.detected_at
            FROM recommendation_records r
            LEFT JOIN clients c ON c.client_id = r.client_id
            {where_sql(clauses)}
            ORDER BY
                CASE lower(r.risk_level) WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
                r.expected_weekly_savings DESC NULLS LAST,
                CASE lower(r.status) WHEN 'new' THEN 0 WHEN 'needs_more_evidence' THEN 1 WHEN 'approved' THEN 2 ELSE 3 END
            LIMIT %s
            """,
            tuple(params + [limit]),
        )
        return [
            {
                **dict(row),
                "expected_weekly_savings": number(row.get("expected_weekly_savings")),
                "expected_roas_lift_pct": number(row.get("expected_roas_lift_pct")),
                "confidence_score": number(row.get("confidence_score")),
                "detected_at": iso(row.get("detected_at")),
            }
            for row in rows
        ]
    except Exception:
        return get_priority_recommendations(limit)


def get_agent_activity(limit: int = 8) -> list[dict[str, Any]]:
    if is_db_configured():
        logs = get_agent_logs(limit=limit).get("logs", [])
    else:
        logs = AGENT_LOGS[:limit]
    if not logs:
        summary = get_summary()
        logs = [
            {
                "agent": "Recommendation Engine",
                "message": f"Monitoring {summary['active_recommendations']} active recommendations.",
                "level": "info",
                "ts": now_iso(),
            }
        ]
    return [
        {
            "timestamp": log.get("ts") or log.get("created_at") or now_iso(),
            "agent_name": log.get("agent") or "System",
            "status": log.get("level") or "info",
            "message": log.get("message") or "",
            "severity": log.get("level") or "info",
            "related_entity_type": log.get("related_entity_type"),
            "related_entity_id": log.get("related_entity_id") or log.get("job_id"),
        }
        for log in logs[:limit]
    ]


def get_clients() -> list[dict[str, Any]]:
    if not is_db_configured():
        return mock_clients()
    try:
        return fetch_all(
            """
            SELECT client_id, brand_name, brand_category, monthly_ad_spend_band
            FROM clients
            ORDER BY brand_name
            """
        )
    except Exception:
        return mock_clients()

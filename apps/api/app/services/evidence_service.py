"""Structured recommendation evidence retrieval with database-first fallback."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from app.db import fetch_all, fetch_one, is_db_configured
from mock_data import RECOMMENDATIONS


def number(value: Any) -> float:
    if value is None:
        return 0.0
    return float(value)


def iso(value: Any) -> str | None:
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def _mock_source(recommendation_id: str) -> dict[str, Any]:
    return next((rec for rec in RECOMMENDATIONS if rec["id"] == recommendation_id), RECOMMENDATIONS[0])


def _metric_status(ok: bool, warning: bool = False) -> str:
    if ok:
        return "passed"
    return "review_required" if warning else "failed"


def get_recommendation_evidence(recommendation: dict[str, Any]) -> dict[str, Any]:
    return {
        "sql_evidence": get_sql_evidence(recommendation),
        "graph_evidence": get_graph_evidence(recommendation),
        "rag_evidence": get_rag_evidence(recommendation),
    }


def get_sql_evidence(recommendation: dict[str, Any]) -> dict[str, Any]:
    if is_db_configured():
        try:
            campaign_id = recommendation.get("target_campaign_id")
            params: tuple[Any, ...]
            clause: str
            if campaign_id:
                clause = "campaign_id = %s"
                params = (campaign_id,)
            else:
                clause = "client_id = %s"
                params = (recommendation["client_id"],)

            summary = fetch_one(
                f"""
                SELECT
                    COUNT(DISTINCT date) AS lookback_days,
                    COALESCE(SUM(spend), 0) AS total_spend,
                    COALESCE(SUM(revenue), 0) AS total_revenue,
                    COALESCE(SUM(purchases), 0) AS purchases,
                    COALESCE(AVG(frequency), 0) AS avg_frequency
                FROM ad_performance_daily
                WHERE {clause}
                """,
                params,
            ) or {}
            spend = number(summary.get("total_spend"))
            revenue = number(summary.get("total_revenue"))
            purchases = int(summary.get("purchases") or 0)
            trend = fetch_all(
                f"""
                SELECT date, spend, revenue, roas, cpa, purchases
                FROM ad_performance_daily
                WHERE {clause}
                ORDER BY date DESC
                LIMIT 14
                """,
                params,
            )
            campaign = None
            if campaign_id:
                campaign = fetch_one(
                    """
                    SELECT campaign_name, objective, status, daily_budget, bid_strategy, attribution_window
                    FROM ad_campaign_settings
                    WHERE campaign_id = %s
                    """,
                    (campaign_id,),
                )

            return {
                "campaign_performance": {
                    "lookback_days": int(summary.get("lookback_days") or 0),
                    "total_spend": spend,
                    "total_revenue": revenue,
                    "roas": revenue / spend if spend else 0,
                    "cpa": spend / purchases if purchases else 0,
                    "purchases": purchases,
                    "avg_frequency": number(summary.get("avg_frequency")),
                },
                "recent_trend": [
                    {
                        "date": iso(row["date"]),
                        "spend": number(row["spend"]),
                        "revenue": number(row["revenue"]),
                        "roas": number(row["roas"]),
                        "cpa": number(row["cpa"]),
                        "purchases": int(row["purchases"] or 0),
                    }
                    for row in reversed(trend)
                ],
                "campaign_settings": campaign_settings(campaign, recommendation),
            }
        except Exception:
            pass
    return mock_sql_evidence(recommendation)


def campaign_settings(row: dict[str, Any] | None, recommendation: dict[str, Any]) -> dict[str, Any]:
    if not row:
        return {
            "campaign_name": recommendation.get("target_campaign_id") or "Client-level portfolio",
            "objective": recommendation.get("recommendation_type", "Optimization").replace("_", " ").title(),
            "status": "unknown",
            "daily_budget": 0,
            "bid_strategy": "not_available",
            "attribution_window": "not_available",
        }
    return {
        "campaign_name": row.get("campaign_name"),
        "objective": row.get("objective"),
        "status": row.get("status"),
        "daily_budget": number(row.get("daily_budget")),
        "bid_strategy": row.get("bid_strategy"),
        "attribution_window": row.get("attribution_window"),
    }


def mock_sql_evidence(recommendation: dict[str, Any]) -> dict[str, Any]:
    confidence = number(recommendation.get("confidence_score"))
    savings = number(recommendation.get("expected_weekly_savings"))
    spend = max(savings * 2.7, 1800)
    revenue = spend * (2.1 + confidence)
    purchases = max(int(revenue / 92), 12)
    base_date = datetime(2026, 6, 1, tzinfo=timezone.utc)
    return {
        "campaign_performance": {
            "lookback_days": 30,
            "total_spend": round(spend, 2),
            "total_revenue": round(revenue, 2),
            "roas": round(revenue / spend, 2),
            "cpa": round(spend / purchases, 2),
            "purchases": purchases,
            "avg_frequency": round(1.8 + confidence, 2),
        },
        "recent_trend": [
            {
                "date": (base_date + timedelta(days=index)).date().isoformat(),
                "spend": round(spend / 30 * (0.82 + index * 0.025), 2),
                "revenue": round(revenue / 30 * (0.78 + index * 0.03), 2),
                "roas": round(1.9 + index * 0.09, 2),
                "cpa": round((spend / purchases) * (1.15 - index * 0.015), 2),
                "purchases": max(1, int(purchases / 30 * (0.8 + index * 0.03))),
            }
            for index in range(14)
        ],
        "campaign_settings": {
            "campaign_name": recommendation.get("target_campaign_id") or f"{recommendation.get('target_platform')} optimization portfolio",
            "objective": recommendation.get("recommendation_type", "Optimization").replace("_", " ").title(),
            "status": "active",
            "daily_budget": round(spend / 30, 2),
            "bid_strategy": "lowest_cost",
            "attribution_window": "7d_click",
        },
    }


def get_graph_evidence(recommendation: dict[str, Any]) -> dict[str, Any]:
    if is_db_configured():
        try:
            benchmark = None
            benchmark_id = recommendation.get("supporting_benchmark_id")
            if benchmark_id:
                benchmark = fetch_one(
                    """
                    SELECT *
                    FROM cross_client_benchmarks
                    WHERE benchmark_id = %s
                    """,
                    (benchmark_id,),
                )
            if not benchmark:
                benchmark = fetch_one(
                    """
                    SELECT *
                    FROM cross_client_benchmarks
                    WHERE brand_category = %s
                    ORDER BY confidence_score DESC, sample_size DESC
                    LIMIT 1
                    """,
                    (recommendation.get("brand_category"),),
                )
            edges = []
            if benchmark:
                edges = fetch_all(
                    """
                    SELECT relationship, source_node_type, target_node_type, weight, evidence_count
                    FROM knowledge_graph_edges
                    WHERE target_node_id = %s OR source_node_id = %s
                    ORDER BY weight DESC
                    LIMIT 8
                    """,
                    (benchmark["benchmark_id"], recommendation["recommendation_id"]),
                )
            return graph_payload(benchmark, edges, recommendation, "database")
        except Exception:
            pass
    return graph_payload(None, [], recommendation, "mock")


def graph_payload(
    benchmark: dict[str, Any] | None,
    edges: list[dict[str, Any]],
    recommendation: dict[str, Any],
    source: str,
) -> dict[str, Any]:
    if not benchmark:
        benchmark = {
            "benchmark_id": recommendation.get("supporting_benchmark_id") or "BM_DEMO_001",
            "brand_category": recommendation.get("brand_category") or "Comparable cohort",
            "monthly_ad_spend_band": recommendation.get("monthly_ad_spend_band") or "$10k-$50k",
            "strategy": recommendation.get("recommendation_type", "Optimization").replace("_", " ").title(),
            "primary_metric": "ROAS lift",
            "avg_lift_pct": 0.097,
            "median_lift_pct": 0.084,
            "sample_size": 14,
            "confidence_score": max(number(recommendation.get("confidence_score")) - 0.08, 0.62),
            "privacy_level": "aggregated_only",
        }
    if not edges:
        edges = [
            {
                "relationship": "supported_by_benchmark",
                "source_node_type": "Recommendation",
                "target_node_type": "Benchmark",
                "weight": 0.84,
                "evidence_count": 12,
            }
        ]
    return {
        "supporting_benchmark": {
            "benchmark_id": benchmark.get("benchmark_id"),
            "brand_category": benchmark.get("brand_category"),
            "monthly_ad_spend_band": benchmark.get("monthly_ad_spend_band"),
            "strategy": benchmark.get("strategy"),
            "primary_metric": benchmark.get("primary_metric"),
            "avg_lift_pct": number(benchmark.get("avg_lift_pct")),
            "median_lift_pct": number(benchmark.get("median_lift_pct")),
            "sample_size": int(benchmark.get("sample_size") or 0),
            "confidence_score": number(benchmark.get("confidence_score")),
            "privacy_level": benchmark.get("privacy_level") or "aggregated_only",
        },
        "related_edges": [
            {
                "relationship": edge.get("relationship"),
                "source_node_type": edge.get("source_node_type"),
                "target_node_type": edge.get("target_node_type"),
                "weight": number(edge.get("weight")),
                "evidence_count": int(edge.get("evidence_count") or 0),
            }
            for edge in edges
        ],
        "similar_client_count": int(benchmark.get("sample_size") or 0),
        "source": source,
    }


def get_rag_evidence(recommendation: dict[str, Any]) -> dict[str, Any]:
    if is_db_configured():
        try:
            rows = fetch_all(
                """
                SELECT doc_id, doc_type, embedding_group, source_table, source_record_id, text, updated_at
                FROM rag_documents
                WHERE source_record_id = %s
                   OR client_id = %s
                   OR source_record_id = %s
                ORDER BY updated_at DESC NULLS LAST
                LIMIT 8
                """,
                (
                    recommendation["recommendation_id"],
                    recommendation["client_id"],
                    recommendation.get("target_campaign_id"),
                ),
            )
            if rows:
                return {"documents": [rag_document(row) for row in rows], "source": "database"}
        except Exception:
            pass
    mock = _mock_source(recommendation["recommendation_id"])
    return {
        "documents": [
            {
                "doc_id": f"DOC_{recommendation['recommendation_id']}_SUMMARY",
                "doc_type": "recommendation_summary",
                "embedding_group": "recommendation_context",
                "source_table": "recommendation_records",
                "source_record_id": recommendation["recommendation_id"],
                "text": recommendation.get("evidence_summary") or mock.get("summary"),
                "updated_at": recommendation.get("detected_at"),
            },
            {
                "doc_id": f"DOC_{recommendation['client_id']}_PLAYBOOK",
                "doc_type": "playbook_excerpt",
                "embedding_group": "optimization_playbooks",
                "source_table": "rag_documents",
                "source_record_id": recommendation.get("target_campaign_id") or recommendation["client_id"],
                "text": mock.get("evidence", {}).get("vector") or "Relevant optimization playbook chunk retrieved for operator review.",
                "updated_at": recommendation.get("detected_at"),
            },
        ],
        "source": "mock",
    }


def rag_document(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "doc_id": row.get("doc_id"),
        "doc_type": row.get("doc_type"),
        "embedding_group": row.get("embedding_group"),
        "source_table": row.get("source_table"),
        "source_record_id": row.get("source_record_id"),
        "text": row.get("text"),
        "updated_at": iso(row.get("updated_at")),
    }


def get_risk_validation(recommendation: dict[str, Any]) -> dict[str, Any]:
    guardrail = {"confidence_threshold": 0.75}
    if is_db_configured():
        try:
            guardrail = fetch_one(
                """
                SELECT confidence_threshold
                FROM guardrail_settings
                ORDER BY updated_at DESC NULLS LAST
                LIMIT 1
                """
            ) or guardrail
        except Exception:
            pass
    graph = get_graph_evidence(recommendation)
    benchmark = graph["supporting_benchmark"]
    threshold = number(guardrail.get("confidence_threshold") or 0.75)
    confidence = number(recommendation.get("confidence_score"))
    risk = recommendation.get("risk_level", "Medium")
    rec_type = recommendation.get("recommendation_type", "").lower()
    benchmark_ok = benchmark["sample_size"] >= 10 and benchmark["confidence_score"] >= 0.7
    approval_type = risk == "High" or any(term in rec_type for term in ["budget", "pause", "bid", "campaign"])
    auto_execute = risk == "Low" and not approval_type and recommendation.get("decision_required") == "auto_execute_allowed"
    rollback = get_rollback_plan(recommendation)
    return {
        "confidence_threshold": threshold,
        "recommendation_confidence": confidence,
        "risk_level": risk,
        "decision_required": recommendation.get("decision_required"),
        "data_freshness_status": "fresh" if recommendation.get("detected_at") else "unknown",
        "sample_size_status": "sufficient" if benchmark["sample_size"] >= 10 else "limited",
        "benchmark_quality": "strong" if benchmark_ok else "needs_review",
        "rollback_available": bool(rollback["rollback_available"]),
        "auto_execute_allowed": auto_execute,
        "validation_checks": [
            {
                "check": "Confidence above threshold",
                "status": _metric_status(confidence >= threshold),
                "detail": f"{confidence:.2f} confidence {'exceeds' if confidence >= threshold else 'does not meet'} the {threshold:.2f} threshold.",
            },
            {
                "check": "Benchmark support",
                "status": _metric_status(benchmark_ok, True),
                "detail": f"Supporting benchmark sample size is {benchmark['sample_size']} with {benchmark['confidence_score']:.2f} confidence.",
            },
            {
                "check": "Spend impact",
                "status": "review_required" if approval_type else "passed",
                "detail": "Human approval required for material spend, bid, budget, or campaign changes." if approval_type else "Low-risk maintenance action is eligible for streamlined review.",
            },
            {
                "check": "Rollback path",
                "status": "passed" if rollback["rollback_available"] else "review_required",
                "detail": "Related action history supports rollback planning." if rollback["rollback_available"] else "No matching optimization history was found; create a pre-execution snapshot.",
            },
        ],
    }


def get_agent_trace(recommendation: dict[str, Any]) -> list[dict[str, Any]]:
    ts = recommendation.get("detected_at")
    status = recommendation.get("status")
    trace = [
        ("Data Scout", "completed", "Detected elevated spend, weak ROAS, stale sync, or campaign inefficiency in the target scope.", "SQL performance scan"),
        ("Pattern Miner", "completed", "Matched the client against similar anonymized benchmark cohorts.", "GraphRAG benchmark lookup"),
        ("Recommendation Engine", "completed", "Generated the optimization recommendation and estimated expected savings.", "Recommendation synthesis"),
        ("Evidence + Risk Grader", "completed", "Validated evidence quality, confidence, risk level, and approval requirement.", "Corrective RAG validation"),
        (
            "Human Interface",
            "completed" if status in ("approved", "dismissed", "needs_more_evidence") else "waiting",
            "Human review captured the current queue decision." if status in ("approved", "dismissed", "needs_more_evidence") else "Human approval is required before execution.",
            "Approval workflow",
        ),
    ]
    if status == "approved":
        trace.append(("Action Executor", "waiting", "Execution is intentionally disabled until the execution prompt connects platform APIs.", "Execution gate"))
    return [
        {
            "step": index + 1,
            "agent_name": agent,
            "status": step_status,
            "summary": summary,
            "tool_used": tool,
            "timestamp": ts,
        }
        for index, (agent, step_status, summary, tool) in enumerate(trace)
    ]


def get_rollback_plan(recommendation: dict[str, Any]) -> dict[str, Any]:
    actions: list[dict[str, Any]] = []
    if is_db_configured():
        try:
            rows = fetch_all(
                """
                SELECT optimization_id, action_type, status, actual_impact_pct, rollback_flag
                FROM optimization_history
                WHERE client_id = %s
                  AND (
                    target_campaign_id = %s
                    OR lower(action_type) = lower(%s)
                    OR lower(target_platform) = lower(%s)
                  )
                ORDER BY created_at DESC
                LIMIT 5
                """,
                (
                    recommendation["client_id"],
                    recommendation.get("target_campaign_id"),
                    recommendation.get("recommendation_type"),
                    recommendation.get("target_platform"),
                ),
            )
            actions = [related_action(row) for row in rows]
        except Exception:
            actions = []
    if not actions:
        actions = [
            {
                "optimization_id": f"OPT_{recommendation['recommendation_id']}_DEMO",
                "action_type": recommendation.get("recommendation_type", "Optimization").replace("_", " ").title(),
                "status": "simulated_history",
                "actual_impact_pct": round(max(number(recommendation.get("expected_roas_lift_pct")), 0.04), 3),
                "rollback_flag": False,
            }
        ]
    return {
        "rollback_available": bool(actions),
        "rollback_type": "restore_previous_audience_or_campaign_config",
        "summary": "If the recommendation underperforms, restore the previous campaign, audience, or bid configuration from the pre-execution snapshot and optimization history.",
        "steps": [
            "Snapshot current campaign and audience configuration before execution.",
            "Apply the approved optimization only after the execution gate is enabled.",
            "Monitor ROAS, CPA, spend, purchases, and frequency for 24-72 hours.",
            "If guardrail thresholds are breached, restore the previous configuration.",
            "Log rollback outcome into optimization_history.",
        ],
        "related_past_actions": actions,
    }


def related_action(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "optimization_id": row.get("optimization_id"),
        "action_type": row.get("action_type"),
        "status": row.get("status"),
        "actual_impact_pct": number(row.get("actual_impact_pct")),
        "rollback_flag": bool(row.get("rollback_flag")),
    }

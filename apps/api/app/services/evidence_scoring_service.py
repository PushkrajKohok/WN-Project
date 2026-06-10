"""Corrective RAG evidence scoring for hybrid retrieval payloads."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.services.guardrail_service import get_guardrails


def number(value: Any) -> float:
    if value is None:
        return 0.0
    return float(value)


def clamp(value: float) -> float:
    return max(0.0, min(1.0, value))


def freshness_from_dates(*values: Any) -> float:
    dates = []
    for value in values:
        if not value:
            continue
        if hasattr(value, "timestamp"):
            dates.append(value)
        else:
            try:
                dates.append(datetime.fromisoformat(str(value).replace("Z", "+00:00")))
            except ValueError:
                continue
    if not dates:
        return 0.35
    latest = max(dates)
    if latest.tzinfo is None:
        latest = latest.replace(tzinfo=timezone.utc)
    age_days = max((datetime.now(timezone.utc) - latest).total_seconds() / 86400, 0)
    return clamp(1 - age_days / 30)


def score_evidence(
    recommendation: dict[str, Any],
    sql_context: dict[str, Any],
    rag_documents: list[dict[str, Any]],
    graph_context: dict[str, Any],
    benchmark_context: list[dict[str, Any]],
) -> dict[str, Any]:
    settings = get_guardrails()
    performance = sql_context.get("performance_summary") or {}
    has_campaign_data = bool(performance.get("scope") == "campaign" and number(performance.get("spend")) > 0)
    has_client_data = bool(performance.get("scope") == "client" and number(performance.get("spend")) > 0)
    sql_score = 1.0 if has_campaign_data else 0.7 if has_client_data else 0.3 if performance else 0.15

    top_docs = rag_documents[:5]
    rag_score = sum(number(doc.get("relevance_score")) for doc in top_docs) / max(len(top_docs), 1)

    benchmark = (benchmark_context or [{}])[0]
    benchmark_conf = number(benchmark.get("confidence_score"))
    benchmark_sample = number(benchmark.get("sample_size"))
    edge_count = len(graph_context.get("edges", []))
    graph_score = clamp((benchmark_conf * 0.55) + min(benchmark_sample / 30, 1) * 0.30 + min(edge_count / 6, 1) * 0.15)

    trend_dates = [point.get("date") for point in sql_context.get("recent_trend", [])]
    doc_dates = [doc.get("updated_at") for doc in rag_documents]
    freshness_score = freshness_from_dates(*(trend_dates + doc_dates))

    rec_conf = number(recommendation.get("confidence_score"))
    guardrail_compliance = clamp(rec_conf / max(number(settings.get("confidence_threshold")), 0.01))
    if recommendation.get("risk_level") == "High" and settings.get("high_risk_requires_approval"):
        guardrail_compliance = min(guardrail_compliance, 0.72)
    if settings.get("require_benchmark_support") and not recommendation.get("supporting_benchmark_id"):
        guardrail_compliance = min(guardrail_compliance, 0.55)

    overall = (
        sql_score * 0.30
        + rag_score * 0.20
        + graph_score * 0.25
        + freshness_score * 0.15
        + guardrail_compliance * 0.10
    )
    decision = "strong_evidence" if overall >= 0.80 else "moderate_evidence" if overall >= 0.60 else "weak_evidence"
    review_required = (
        decision == "weak_evidence"
        or rec_conf < number(settings.get("confidence_threshold"))
        or recommendation.get("risk_level") == "High"
        or (settings.get("require_benchmark_support") and not recommendation.get("supporting_benchmark_id"))
    )

    reasons = []
    if performance:
        reasons.append("Campaign or client performance data exists for the recommendation scope.")
    if benchmark_context:
        reasons.append("Supporting benchmark context is available for GraphRAG validation.")
    if rag_documents:
        reasons.append("RAG documents include relevant recommendation, campaign, client, or benchmark context.")
    if rec_conf >= number(settings.get("confidence_threshold")):
        reasons.append("Recommendation confidence is above the current guardrail threshold.")
    else:
        reasons.append("Recommendation confidence is below the current guardrail threshold.")

    return {
        "overall_score": round(overall, 3),
        "sql_score": round(sql_score, 3),
        "rag_score": round(rag_score, 3),
        "graph_score": round(graph_score, 3),
        "freshness_score": round(freshness_score, 3),
        "guardrail_compliance": round(guardrail_compliance, 3),
        "recommendation": decision,
        "decision": decision,
        "review_required": review_required,
        "score_breakdown": {
            "sql_evidence": round(sql_score, 3),
            "rag_document_relevance": round(rag_score, 3),
            "graph_benchmark_support": round(graph_score, 3),
            "data_freshness": round(freshness_score, 3),
            "guardrail_compliance": round(guardrail_compliance, 3),
        },
        "reasons": reasons,
    }

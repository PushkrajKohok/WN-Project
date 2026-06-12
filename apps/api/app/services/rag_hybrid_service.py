"""Hybrid SQL + vector + keyword + graph retrieval for explainable RAG."""

from __future__ import annotations

from typing import Any, Optional

from app.db import fetch_all, is_db_configured
from app.services import embedding_service, openai_service, rag_service
from app.services.agent_log_service import create_agent_log


def clamp(value: float) -> float:
    return round(max(0.0, min(1.0, value)), 3)


def mean(values: list[float], default: float = 0.0) -> float:
    values = [value for value in values if value is not None]
    return sum(values) / len(values) if values else default


def hybrid_search(
    query: str,
    *,
    recommendation_id: Optional[str] = None,
    client_id: Optional[str] = None,
    campaign_id: Optional[str] = None,
    limit: int = 10,
) -> dict[str, Any]:
    limit = max(1, min(int(limit or 10), 25))
    recommendation = rag_service.get_recommendation(recommendation_id) if recommendation_id else None
    if not recommendation:
        recommendation = rag_service.fallback_recommendation(query, client_id)
    if campaign_id:
        recommendation["target_campaign_id"] = campaign_id

    sql_context = rag_service.retrieve_sql_context(recommendation)
    keyword_results = rag_service.retrieve_rag_documents(query, recommendation, limit)
    graph_context = rag_service.retrieve_graph_context(recommendation)
    benchmark_context = rag_service.retrieve_benchmark_context(recommendation)
    vector_results: list[dict[str, Any]] = []
    vector_error = None
    mode = "fallback_keyword"

    try:
        vector_results = embedding_service.vector_search_rag_documents(
            query,
            limit=limit,
            filters={"client_id": client_id or recommendation.get("client_id")},
        )
        mode = "vector_hybrid"
    except Exception as exc:
        vector_error = str(exc)

    sql_score = 0.8 if sql_context.get("performance_summary") else 0.35
    vector_score = mean([float(item.get("similarity_score") or 0) for item in vector_results], 0.0)
    keyword_score = mean([float(item.get("relevance_score") or 0) for item in keyword_results], 0.0)
    graph_score = clamp(mean([float(item.get("weight") or 0) for item in graph_context.get("edges", [])], 0.55))
    freshness_score = 0.8 if sql_context.get("performance_summary", {}).get("latest_date") else 0.5
    guardrail_score = 0.75 if str(recommendation.get("risk_level", "")).lower() != "high" else 0.55

    if mode == "vector_hybrid":
        final_score = (
            sql_score * 0.25
            + vector_score * 0.30
            + keyword_score * 0.10
            + graph_score * 0.20
            + freshness_score * 0.10
            + guardrail_score * 0.05
        )
    else:
        final_score = (
            sql_score * 0.40
            + keyword_score * 0.30
            + graph_score * 0.15
            + freshness_score * 0.10
            + guardrail_score * 0.05
        )

    review_required = (
        final_score < 0.68
        or str(recommendation.get("risk_level", "")).lower() == "high"
        or recommendation.get("decision_required") == "human_approval"
    )
    evidence_score = {
        "sql_score": clamp(sql_score),
        "vector_score": clamp(vector_score),
        "keyword_score": clamp(keyword_score),
        "graph_score": clamp(graph_score),
        "freshness_score": clamp(freshness_score),
        "guardrail_score": clamp(guardrail_score),
        "final_score": clamp(final_score),
        "review_required": review_required,
        "mode": mode,
    }
    trace = [
        {"step": 1, "retriever": "SQL Retriever", "summary": "Loaded structured recommendation, client, campaign, and performance context.", "status": "completed"},
        {"step": 2, "retriever": "Vector RAG Retriever", "summary": f"Retrieved {len(vector_results)} vector matches." if vector_results else f"Vector search unavailable; using keyword fallback. {vector_error or ''}".strip(), "status": "completed" if vector_results else "fallback"},
        {"step": 3, "retriever": "Keyword Retriever", "summary": f"Retrieved {len(keyword_results)} deterministic document matches.", "status": "completed"},
        {"step": 4, "retriever": "GraphRAG Retriever", "summary": f"Retrieved {len(graph_context.get('edges', []))} graph edges and {len(benchmark_context)} benchmarks.", "status": "completed"},
        {"step": 5, "retriever": "Corrective RAG Scorer", "summary": f"Weighted hybrid score: {clamp(final_score)}.", "status": "completed"},
    ]
    return {
        "mode": mode,
        "query": query,
        "recommendation_id": recommendation.get("recommendation_id"),
        "client_id": recommendation.get("client_id"),
        "sql_context": sql_context,
        "vector_results": vector_results,
        "keyword_results": keyword_results,
        "graph_context": graph_context.get("edges", []),
        "benchmark_context": benchmark_context,
        "evidence_score": evidence_score,
        "final_score": clamp(final_score),
        "review_required": review_required,
        "retrieval_trace": trace,
        "vector_error": vector_error,
    }


def explain_recommendation_with_llm(recommendation_id: str) -> dict[str, Any]:
    recommendation = rag_service.get_recommendation(recommendation_id)
    if not recommendation:
        raise ValueError("Recommendation not found.")
    evidence = hybrid_search(
        f"{recommendation.get('title')} {recommendation.get('evidence_summary')}",
        recommendation_id=recommendation_id,
        client_id=recommendation.get("client_id"),
        campaign_id=recommendation.get("target_campaign_id"),
        limit=8,
    )
    system_prompt = """
You produce concise public-facing recommendation explanations for WasteNot operators.
Return JSON only. Do not reveal hidden chain-of-thought. Do not make execution decisions.
Guardrails remain deterministic and approval_required must match the supplied evidence.
Schema: summary, why_now, evidence_used, risk_notes, recommended_action, approval_required, confidence_adjustment.
"""
    try:
        explanation = openai_service.get_chat_completion_json_or_text(
            "recommendation_llm_explanation",
            system_prompt=system_prompt,
            user_payload={"recommendation": recommendation, "hybrid_evidence": evidence},
            response_json=True,
        )
    except RuntimeError as exc:
        return {
            "status": "unavailable",
            "recommendation_id": recommendation_id,
            "error_message": str(exc),
            "hybrid_evidence": evidence,
        }

    explanation.setdefault("approval_required", evidence["review_required"])
    explanation.setdefault("confidence_adjustment", 0)
    create_agent_log(
        "Human Interface",
        f"Generated public LLM explanation for {recommendation_id}.",
        "info",
        related_entity_type="recommendation",
        related_entity_id=recommendation_id,
    )
    return {
        "status": "completed",
        "recommendation_id": recommendation_id,
        "explanation": explanation,
        "hybrid_evidence": evidence,
        "notice": "LLM explanation only. Guardrails still control approval and execution.",
    }


def agent_llm_scan_summary() -> dict[str, Any]:
    logs: list[dict[str, Any]] = []
    recommendations: list[dict[str, Any]] = []
    if is_db_configured():
        try:
            logs = fetch_all(
                """
                SELECT log_id, agent_name, severity, message, created_at, related_entity_type, related_entity_id
                FROM agent_logs
                ORDER BY created_at DESC NULLS LAST
                LIMIT 30
                """
            )
        except Exception:
            logs = []
        try:
            recommendations = fetch_all(
                """
                SELECT recommendation_id, client_id, title, risk_level, confidence_score, status, detected_at
                FROM recommendation_records
                ORDER BY detected_at DESC NULLS LAST
                LIMIT 10
                """
            )
        except Exception:
            recommendations = []

    system_prompt = """
You summarize WasteNot agent activity for operators. Return JSON only with:
summary, operational_risks, recommended_followups, cited_evidence_ids.
Use only supplied public logs and recommendation records. Do not reveal chain-of-thought.
"""
    try:
        summary = openai_service.get_chat_completion_json_or_text(
            "agent_scan_summary",
            system_prompt=system_prompt,
            user_payload={"logs": logs, "recommendations": recommendations},
            response_json=True,
        )
    except RuntimeError as exc:
        return {"status": "unavailable", "error_message": str(exc), "logs_considered": len(logs)}
    return {"status": "completed", "summary": summary, "logs_considered": len(logs), "recommendations_considered": len(recommendations)}

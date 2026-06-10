"""Deterministic hybrid RAG retrieval over SQL, documents, and graph context."""

from __future__ import annotations

import re
from decimal import Decimal
from typing import Any

from fastapi import HTTPException

from app.db import fetch_all, fetch_one, is_db_configured
from app.services.agent_log_service import create_agent_log
from app.services.evidence_scoring_service import score_evidence
from mock_data import KNOWLEDGE_GRAPH_EDGES, PATTERNS, RECOMMENDATIONS

STOPWORDS = {"the", "a", "an", "and", "or", "to", "for", "from", "of", "in", "on", "with", "why", "should", "we", "is", "are"}


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


def jsonable(value: Any) -> Any:
    if isinstance(value, Decimal):
        return float(value)
    if hasattr(value, "isoformat"):
        return value.isoformat()
    if isinstance(value, dict):
        return {key: jsonable(item) for key, item in value.items()}
    if isinstance(value, list):
        return [jsonable(item) for item in value]
    return value


def tokens(text: str) -> set[str]:
    return {token for token in re.findall(r"[a-z0-9]+", (text or "").lower()) if token not in STOPWORDS and len(token) > 1}


def recommendation_item(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "recommendation_id": row.get("recommendation_id") or row.get("id"),
        "client_id": row.get("client_id") or "demo-client",
        "title": row.get("title"),
        "recommendation_type": row.get("recommendation_type") or row.get("type") or "",
        "target_platform": row.get("target_platform") or row.get("platform"),
        "target_campaign_id": row.get("target_campaign_id"),
        "evidence_summary": row.get("evidence_summary") or row.get("summary"),
        "supporting_benchmark_id": row.get("supporting_benchmark_id"),
        "expected_weekly_savings": number(row.get("expected_weekly_savings", row.get("expected_savings", 0))),
        "confidence_score": number(row.get("confidence_score", row.get("confidence", 0))),
        "risk_level": str(row.get("risk_level") or row.get("risk") or "Medium").capitalize(),
        "decision_required": row.get("decision_required"),
        "detected_at": iso(row.get("detected_at") or row.get("created_at")),
    }


def get_recommendation(recommendation_id: str | None) -> dict[str, Any] | None:
    if not recommendation_id:
        return None
    if is_db_configured():
        try:
            row = fetch_one("SELECT * FROM recommendation_records WHERE recommendation_id = %s", (recommendation_id,))
            if row:
                return recommendation_item(row)
        except Exception:
            pass
    row = next((item for item in RECOMMENDATIONS if item["id"] == recommendation_id or item.get("recommendation_id") == recommendation_id), None)
    return recommendation_item(row) if row else None


def search_rag(request: dict[str, Any]) -> dict[str, Any]:
    query = request.get("query") or ""
    recommendation = get_recommendation(request.get("recommendation_id")) or fallback_recommendation(query, request.get("client_id"))
    top_k = int(request.get("top_k") or 8)
    sql_context = retrieve_sql_context(recommendation) if request.get("include_sql", True) else {}
    rag_documents = retrieve_rag_documents(query, recommendation, top_k) if request.get("include_rag_docs", True) else []
    graph_context = retrieve_graph_context(recommendation) if request.get("include_graph", True) else {"edges": []}
    benchmark_context = retrieve_benchmark_context(recommendation)
    evidence_score = score_evidence(recommendation, sql_context, rag_documents, graph_context, benchmark_context)
    trace = retrieval_trace(sql_context, rag_documents, graph_context, evidence_score)
    create_agent_log("Pattern Miner", f"Performed RAG retrieval for query '{query[:80]}'.", "info", related_entity_type="recommendation", related_entity_id=recommendation.get("recommendation_id"))
    create_agent_log("Evidence + Risk Grader", f"Scored hybrid evidence as {evidence_score['decision']}.", "info", related_entity_type="recommendation", related_entity_id=recommendation.get("recommendation_id"))
    return {
        "query": query,
        "client_id": recommendation.get("client_id"),
        "recommendation_id": recommendation.get("recommendation_id"),
        "recommendation": recommendation,
        "results": {
            "sql_context": sql_context,
            "rag_documents": rag_documents,
            "graph_context": graph_context.get("edges", []),
            "benchmark_context": benchmark_context,
        },
        "sql_context": sql_context,
        "rag_documents": rag_documents,
        "graph_context": graph_context,
        "benchmark_context": benchmark_context,
        "evidence_score": evidence_score,
        "retrieval_trace": trace,
        "source": "database" if is_db_configured() else "mock",
    }


def fallback_recommendation(query: str, client_id: str | None) -> dict[str, Any]:
    row = RECOMMENDATIONS[0]
    rec = recommendation_item(row)
    rec["client_id"] = client_id or rec["client_id"]
    rec["title"] = rec["title"] or query
    return rec


def get_rag_for_recommendation(recommendation_id: str) -> dict[str, Any]:
    rec = get_recommendation(recommendation_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return search_rag({
        "query": f"{rec.get('title')} {rec.get('evidence_summary') or ''}",
        "client_id": rec.get("client_id"),
        "recommendation_id": recommendation_id,
        "top_k": 8,
        "include_sql": True,
        "include_graph": True,
        "include_rag_docs": True,
    })


def score_evidence_for_recommendation(recommendation_id: str) -> dict[str, Any]:
    payload = get_rag_for_recommendation(recommendation_id)
    score = payload["evidence_score"]
    return {
        "recommendation_id": recommendation_id,
        "overall_score": score["overall_score"],
        "score_breakdown": score["score_breakdown"],
        "decision": score["decision"],
        "review_required": score["review_required"],
        "reasons": score["reasons"],
    }


def retrieve_sql_context(recommendation: dict[str, Any]) -> dict[str, Any]:
    if is_db_configured():
        try:
            client = fetch_one("SELECT * FROM clients WHERE client_id = %s", (recommendation["client_id"],)) or {}
            campaign = {}
            if recommendation.get("target_campaign_id"):
                campaign = fetch_one("SELECT * FROM ad_campaign_settings WHERE campaign_id = %s", (recommendation["target_campaign_id"],)) or {}
            performance = performance_summary(recommendation)
            trend = recent_trend(recommendation)
            history = fetch_all(
                """
                SELECT optimization_id, action_type, status, actual_impact_pct, rollback_flag, created_at
                FROM optimization_history
                WHERE client_id = %s
                ORDER BY created_at DESC NULLS LAST
                LIMIT 8
                """,
                (recommendation["client_id"],),
            )
            return {"client": jsonable(client), "campaign": jsonable(campaign), "performance_summary": performance, "recent_trend": trend, "optimization_history": [normalize_history(row) for row in history]}
        except Exception:
            pass
    return mock_sql_context(recommendation)


def performance_summary(recommendation: dict[str, Any]) -> dict[str, Any]:
    campaign_id = recommendation.get("target_campaign_id")
    if campaign_id:
        row = fetch_one(
            """
            SELECT 'campaign' AS scope, SUM(spend) AS spend, SUM(revenue) AS revenue, AVG(roas) AS roas, AVG(cpa) AS cpa, SUM(purchases) AS purchases, MAX(date) AS latest_date
            FROM ad_performance_daily
            WHERE campaign_id = %s
            """,
            (campaign_id,),
        )
        if row and number(row.get("spend")) > 0:
            return normalize_performance(row)
    row = fetch_one(
        """
        SELECT 'client' AS scope, SUM(spend) AS spend, SUM(revenue) AS revenue, AVG(roas) AS roas, AVG(cpa) AS cpa, SUM(purchases) AS purchases, MAX(date) AS latest_date
        FROM ad_performance_daily
        WHERE client_id = %s
        """,
        (recommendation["client_id"],),
    ) or {}
    return normalize_performance(row)


def recent_trend(recommendation: dict[str, Any]) -> list[dict[str, Any]]:
    rows = fetch_all(
        """
        SELECT date, SUM(spend) AS spend, SUM(revenue) AS revenue, AVG(roas) AS roas, AVG(cpa) AS cpa, SUM(purchases) AS purchases
        FROM ad_performance_daily
        WHERE client_id = %s
        GROUP BY date
        ORDER BY date DESC
        LIMIT 30
        """,
        (recommendation["client_id"],),
    )
    return [normalize_performance(row) for row in rows]


def normalize_performance(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "scope": row.get("scope"),
        "date": iso(row.get("date")),
        "spend": number(row.get("spend")),
        "revenue": number(row.get("revenue")),
        "roas": number(row.get("roas")),
        "cpa": number(row.get("cpa")),
        "purchases": int(row.get("purchases") or 0),
        "latest_date": iso(row.get("latest_date")),
    }


def normalize_history(row: dict[str, Any]) -> dict[str, Any]:
    return {**row, "actual_impact_pct": number(row.get("actual_impact_pct")), "created_at": iso(row.get("created_at"))}


def mock_sql_context(recommendation: dict[str, Any]) -> dict[str, Any]:
    return {
        "client": {"client_id": recommendation["client_id"], "brand_name": "Demo Brand"},
        "campaign": {"campaign_id": recommendation.get("target_campaign_id"), "campaign_name": recommendation.get("title")},
        "performance_summary": {"scope": "client", "spend": 18500, "revenue": 42100, "roas": 2.27, "cpa": 39.5, "purchases": 242, "latest_date": recommendation.get("detected_at")},
        "recent_trend": [],
        "optimization_history": [],
    }


def retrieve_rag_documents(query: str, recommendation: dict[str, Any], top_k: int) -> list[dict[str, Any]]:
    docs = []
    if is_db_configured():
        try:
            rows = fetch_all(
                """
                SELECT doc_id, client_id, doc_type, source_table, source_record_id, chunk_id, embedding_group, text, updated_at
                FROM rag_documents
                WHERE source_record_id IN (%s, %s, %s)
                   OR client_id = %s
                   OR text ILIKE %s
                   OR embedding_group IN ('recommendation_context', 'campaign_context', 'decision_history', 'benchmark_context', 'client_context')
                LIMIT 250
                """,
                (
                    recommendation.get("recommendation_id"),
                    recommendation.get("target_campaign_id"),
                    recommendation.get("supporting_benchmark_id"),
                    recommendation.get("client_id"),
                    f"%{query[:80]}%",
                ),
            )
            docs = [document_item(row, query, recommendation) for row in rows]
        except Exception:
            docs = []
    if not docs:
        docs = mock_documents(query, recommendation)
    return sorted(docs, key=lambda doc: doc["relevance_score"], reverse=True)[:top_k]


def document_item(row: dict[str, Any], query: str, recommendation: dict[str, Any]) -> dict[str, Any]:
    text = row.get("text") or ""
    query_tokens = tokens(query + " " + str(recommendation.get("title") or ""))
    doc_tokens = tokens(text)
    overlap = len(query_tokens & doc_tokens) / max(len(query_tokens), 1)
    score = overlap
    if row.get("client_id") == recommendation.get("client_id"):
        score += 0.15
    if row.get("source_record_id") in {recommendation.get("recommendation_id"), recommendation.get("target_campaign_id"), recommendation.get("supporting_benchmark_id")}:
        score += 0.25
    if row.get("embedding_group") in {"recommendation_context", "campaign_context", "benchmark_context"}:
        score += 0.12
    return {
        "doc_id": row.get("doc_id"),
        "client_id": row.get("client_id"),
        "doc_type": row.get("doc_type"),
        "source_table": row.get("source_table"),
        "source_record_id": row.get("source_record_id"),
        "chunk_id": row.get("chunk_id"),
        "embedding_group": row.get("embedding_group"),
        "text": text,
        "snippet": text[:240],
        "updated_at": iso(row.get("updated_at")),
        "relevance_score": round(min(score, 1.0), 3),
    }


def mock_documents(query: str, recommendation: dict[str, Any]) -> list[dict[str, Any]]:
    base = [
        "Recommendation context links recent buyer exclusions to reduced wasted prospecting spend.",
        "Campaign context shows spend inefficiency and stale audience targeting symptoms.",
        "Benchmark context supports similar actions across anonymized cohorts.",
    ]
    return [
        document_item({
            "doc_id": f"rag-demo-{idx}",
            "client_id": recommendation.get("client_id"),
            "doc_type": "demo_context",
            "source_table": "recommendation_records",
            "source_record_id": recommendation.get("recommendation_id"),
            "chunk_id": idx,
            "embedding_group": ["recommendation_context", "campaign_context", "benchmark_context"][idx - 1],
            "text": text,
            "updated_at": recommendation.get("detected_at"),
        }, query, recommendation)
        for idx, text in enumerate(base, 1)
    ]


def retrieve_graph_context(recommendation: dict[str, Any]) -> dict[str, Any]:
    keys = [recommendation.get("client_id"), recommendation.get("target_campaign_id"), recommendation.get("supporting_benchmark_id")]
    if is_db_configured():
        try:
            rows = fetch_all(
                """
                SELECT edge_id, source_node_type, source_node_id, relationship, target_node_type, target_node_id, weight, evidence_count, last_updated_at
                FROM knowledge_graph_edges
                WHERE source_node_id = ANY(%s) OR target_node_id = ANY(%s) OR relationship IN ('similar_to', 'supported_by_benchmark', 'matches_pattern')
                ORDER BY weight DESC
                LIMIT 25
                """,
                (keys, keys),
            )
            return {"edges": [edge_item(row) for row in rows], "similar_client_edge_count": len(rows)}
        except Exception:
            pass
    rows = [
        {"edge_id": f"edge-{idx}", "source_node_id": edge["source"], "target_node_id": edge["target"], "relationship": edge["relation"], "weight": edge["weight"], "evidence_count": idx + 4, "last_updated_at": None}
        for idx, edge in enumerate(KNOWLEDGE_GRAPH_EDGES[:6], 1)
    ]
    return {"edges": [edge_item(row) for row in rows], "similar_client_edge_count": len(rows)}


def edge_item(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "edge_id": row.get("edge_id"),
        "source": row.get("source_node_id"),
        "target": row.get("target_node_id"),
        "relationship": row.get("relationship"),
        "weight": number(row.get("weight")),
        "evidence_count": int(row.get("evidence_count") or 0),
        "last_updated_at": iso(row.get("last_updated_at")),
    }


def retrieve_benchmark_context(recommendation: dict[str, Any]) -> list[dict[str, Any]]:
    benchmark_id = recommendation.get("supporting_benchmark_id")
    if is_db_configured():
        try:
            if benchmark_id:
                rows = fetch_all("SELECT * FROM cross_client_benchmarks WHERE benchmark_id = %s", (benchmark_id,))
            else:
                rows = fetch_all(
                    """
                    SELECT b.*
                    FROM cross_client_benchmarks b
                    LEFT JOIN clients c ON c.client_id = %s
                    WHERE b.brand_category = c.brand_category OR b.strategy ILIKE %s
                    ORDER BY b.confidence_score DESC, b.sample_size DESC, b.avg_lift_pct DESC
                    LIMIT 5
                    """,
                    (recommendation.get("client_id"), f"%{recommendation.get('recommendation_type', '')}%"),
                )
            return [benchmark_item(row) for row in rows]
        except Exception:
            pass
    return [benchmark_item(item) for item in PATTERNS[:3]]


def benchmark_item(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "benchmark_id": row.get("benchmark_id") or row.get("id"),
        "brand_category": row.get("brand_category") or row.get("category"),
        "monthly_ad_spend_band": row.get("monthly_ad_spend_band") or row.get("spend_band"),
        "strategy": row.get("strategy"),
        "avg_lift_pct": number(row.get("avg_lift_pct", row.get("avg_lift", 0))) / (100 if number(row.get("avg_lift", 0)) > 1 else 1),
        "sample_size": int(row.get("sample_size") or 0),
        "confidence_score": number(row.get("confidence_score", row.get("confidence", 0))),
        "privacy_level": row.get("privacy_level"),
    }


def retrieval_trace(sql_context: dict[str, Any], docs: list[dict[str, Any]], graph: dict[str, Any], score: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {"step": 1, "retriever": "SQL Retriever", "summary": "Loaded campaign performance and settings." if sql_context else "SQL context skipped or unavailable.", "status": "completed"},
        {"step": 2, "retriever": "RAG Document Retriever", "summary": f"Retrieved {len(docs)} relevant text chunks from rag_documents.", "status": "completed"},
        {"step": 3, "retriever": "GraphRAG Retriever", "summary": f"Retrieved {len(graph.get('edges', []))} graph edges for similar strategy support.", "status": "completed"},
        {"step": 4, "retriever": "Corrective Evidence Scorer", "summary": f"Scored evidence quality as {score['decision']}.", "status": "completed"},
    ]


def list_documents(filters: dict[str, Any]) -> dict[str, Any]:
    limit = int(filters.get("limit") or 50)
    offset = int(filters.get("offset") or 0)
    if is_db_configured():
        try:
            clauses, params = [], []
            for key in ("client_id", "doc_type", "embedding_group"):
                if filters.get(key):
                    clauses.append(f"{key} = %s")
                    params.append(filters[key])
            if filters.get("search"):
                clauses.append("text ILIKE %s")
                params.append(f"%{filters['search']}%")
            where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
            rows = fetch_all(f"SELECT * FROM rag_documents {where} ORDER BY updated_at DESC NULLS LAST LIMIT %s OFFSET %s", tuple(params + [limit, offset]))
            total = fetch_one(f"SELECT COUNT(*) AS total FROM rag_documents {where}", tuple(params)) or {}
            return {"items": [document_item(row, filters.get("search") or "", {}) for row in rows], "total": int(total.get("total") or 0), "limit": limit, "offset": offset, "source": "database"}
        except Exception:
            pass
    docs = mock_documents(filters.get("search") or "recommendation context", recommendation_item(RECOMMENDATIONS[0]))
    return {"items": docs[offset: offset + limit], "total": len(docs), "limit": limit, "offset": offset, "source": "mock"}


def get_facets() -> dict[str, Any]:
    if is_db_configured():
        try:
            return {
                "doc_types": [row["doc_type"] for row in fetch_all("SELECT DISTINCT doc_type FROM rag_documents WHERE doc_type IS NOT NULL ORDER BY doc_type")],
                "embedding_groups": [row["embedding_group"] for row in fetch_all("SELECT DISTINCT embedding_group FROM rag_documents WHERE embedding_group IS NOT NULL ORDER BY embedding_group")],
                "source_tables": [row["source_table"] for row in fetch_all("SELECT DISTINCT source_table FROM rag_documents WHERE source_table IS NOT NULL ORDER BY source_table")],
                "source": "database",
            }
        except Exception:
            pass
    return {"doc_types": ["demo_context"], "embedding_groups": ["recommendation_context", "campaign_context", "benchmark_context"], "source_tables": ["recommendation_records"], "source": "mock"}


def rebuild_index() -> dict[str, Any]:
    count = 0
    if is_db_configured():
        try:
            row = fetch_one("SELECT COUNT(*) AS total FROM rag_documents") or {}
            count = int(row.get("total") or 0)
        except Exception:
            count = 0
    else:
        count = 3
    create_agent_log("Pattern Miner", f"RAG document index rebuild simulated for {count} documents.", "success", related_entity_type="rag", related_entity_id="index")
    return {"status": "completed", "documents_indexed": count, "embedding_mode": "simulated_keyword_semantic"}

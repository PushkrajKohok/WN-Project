"""Privacy-safe cross-client benchmark and graph pattern service."""

from __future__ import annotations

from decimal import Decimal
from typing import Any, Optional

from fastapi import HTTPException

from app.db import fetch_all, fetch_one, is_db_configured
from mock_data import KNOWLEDGE_GRAPH_EDGES, PATTERNS, RECOMMENDATIONS

SORT_COLUMNS = {
    "avg_lift_pct": "b.avg_lift_pct",
    "confidence_score": "b.confidence_score",
    "sample_size": "b.sample_size",
    "generated_at": "b.generated_at",
}


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


def benchmark_item(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "benchmark_id": row.get("benchmark_id") or row.get("id"),
        "anonymized_cohort_id": row.get("anonymized_cohort_id") or f"COHORT_{row.get('id', 'demo')}",
        "brand_category": row.get("brand_category") or row.get("category"),
        "monthly_ad_spend_band": row.get("monthly_ad_spend_band") or row.get("spend_band"),
        "strategy": row.get("strategy"),
        "primary_metric": row.get("primary_metric") or "ROAS",
        "avg_lift_pct": number(row.get("avg_lift_pct", row.get("avg_lift", 0))) / (100 if number(row.get("avg_lift", 0)) > 1 else 1),
        "median_lift_pct": number(row.get("median_lift_pct", row.get("avg_lift", 0))) / (100 if number(row.get("avg_lift", 0)) > 1 else 1),
        "sample_size": int(row.get("sample_size") or 0),
        "confidence_score": number(row.get("confidence_score", row.get("confidence", 0))),
        "privacy_level": normalize_privacy(row.get("privacy_level")),
        "generated_at": iso(row.get("generated_at")),
        "related_recommendation_count": int(row.get("related_recommendation_count") or 0),
    }


def normalize_privacy(value: Any) -> str:
    privacy = str(value or "aggregated_only")
    if privacy == "anonymized":
        return "k_anonymized"
    if privacy == "aggregated":
        return "aggregated_only"
    return privacy


def filters_sql(filters: dict[str, Any]) -> tuple[str, list[Any]]:
    clauses: list[str] = []
    params: list[Any] = []
    mapping = {
        "brand_category": "b.brand_category = %s",
        "spend_band": "b.monthly_ad_spend_band = %s",
        "metric": "b.primary_metric = %s",
        "privacy_level": "b.privacy_level = %s",
    }
    for key, clause in mapping.items():
        if filters.get(key):
            clauses.append(clause)
            params.append(filters[key])
    if filters.get("strategy"):
        clauses.append("b.strategy = %s")
        params.append(filters["strategy"])
    if filters.get("search"):
        clauses.append(
            "(b.strategy ILIKE %s OR b.brand_category ILIKE %s OR b.monthly_ad_spend_band ILIKE %s OR b.primary_metric ILIKE %s OR b.privacy_level ILIKE %s)"
        )
        params.extend([f"%{filters['search']}%"] * 5)
    return (f"WHERE {' AND '.join(clauses)}" if clauses else "", params)


def mock_benchmarks(filters: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    filters = filters or {}
    items = [benchmark_item(item) for item in PATTERNS]
    if filters.get("brand_category"):
        items = [item for item in items if item["brand_category"] == filters["brand_category"]]
    if filters.get("spend_band"):
        items = [item for item in items if item["monthly_ad_spend_band"] == filters["spend_band"]]
    if filters.get("metric"):
        items = [item for item in items if item["primary_metric"] == filters["metric"]]
    if filters.get("privacy_level"):
        items = [item for item in items if item["privacy_level"] == filters["privacy_level"]]
    if filters.get("search"):
        search = filters["search"].lower()
        items = [
            item for item in items
            if search in " ".join([item["strategy"], item["brand_category"], item["monthly_ad_spend_band"], item["primary_metric"], item["privacy_level"]]).lower()
        ]
    return items


def get_summary(filters: dict[str, Any]) -> dict[str, Any]:
    if is_db_configured():
        try:
            where, params = filters_sql(filters)
            row = fetch_one(
                f"""
                SELECT COUNT(*) AS total_benchmarks,
                       COUNT(DISTINCT brand_category) AS unique_categories,
                       COUNT(DISTINCT monthly_ad_spend_band) AS unique_spend_bands,
                       AVG(confidence_score) AS avg_confidence,
                       AVG(avg_lift_pct) AS avg_lift_pct,
                       SUM(sample_size) AS total_sample_size
                FROM cross_client_benchmarks b
                {where}
                """,
                tuple(params),
            ) or {}
            graph = fetch_one("SELECT COUNT(*) AS total_graph_edges FROM knowledge_graph_edges") or {}
            privacy_rows = fetch_all(
                f"SELECT privacy_level, COUNT(*) AS count FROM cross_client_benchmarks b {where} GROUP BY privacy_level",
                tuple(params),
            )
            return summary_payload(row, int(graph.get("total_graph_edges") or 0), privacy_rows, "database")
        except Exception:
            pass
    items = mock_benchmarks(filters)
    privacy = {}
    for item in items:
        privacy[item["privacy_level"]] = privacy.get(item["privacy_level"], 0) + 1
    return {
        "total_benchmarks": len(items),
        "total_graph_edges": len(KNOWLEDGE_GRAPH_EDGES),
        "unique_categories": len({item["brand_category"] for item in items}),
        "unique_spend_bands": len({item["monthly_ad_spend_band"] for item in items}),
        "avg_confidence": sum(item["confidence_score"] for item in items) / max(len(items), 1),
        "avg_lift_pct": sum(item["avg_lift_pct"] for item in items) / max(len(items), 1),
        "total_sample_size": sum(item["sample_size"] for item in items),
        "privacy_levels": privacy,
        "source": "mock",
    }


def summary_payload(row: dict[str, Any], graph_edges: int, privacy_rows: list[dict[str, Any]], source: str) -> dict[str, Any]:
    return {
        "total_benchmarks": int(row.get("total_benchmarks") or 0),
        "total_graph_edges": graph_edges,
        "unique_categories": int(row.get("unique_categories") or 0),
        "unique_spend_bands": int(row.get("unique_spend_bands") or 0),
        "avg_confidence": number(row.get("avg_confidence")),
        "avg_lift_pct": number(row.get("avg_lift_pct")),
        "total_sample_size": int(row.get("total_sample_size") or 0),
        "privacy_levels": {item["privacy_level"]: int(item["count"]) for item in privacy_rows},
        "source": source,
    }


def list_benchmarks(filters: dict[str, Any]) -> dict[str, Any]:
    limit = int(filters.get("limit") or 50)
    offset = int(filters.get("offset") or 0)
    if is_db_configured():
        try:
            where, params = filters_sql(filters)
            sort_by = filters.get("sort_by") if filters.get("sort_by") in SORT_COLUMNS else "confidence_score"
            sort_dir = "ASC" if str(filters.get("sort_dir")).lower() == "asc" else "DESC"
            rows = fetch_all(
                f"""
                SELECT b.*, COALESCE(r.related_recommendation_count, 0) AS related_recommendation_count
                FROM cross_client_benchmarks b
                LEFT JOIN (
                    SELECT supporting_benchmark_id, COUNT(*) AS related_recommendation_count
                    FROM recommendation_records
                    WHERE supporting_benchmark_id IS NOT NULL
                    GROUP BY supporting_benchmark_id
                ) r ON r.supporting_benchmark_id = b.benchmark_id
                {where}
                ORDER BY {SORT_COLUMNS[sort_by]} {sort_dir} NULLS LAST
                LIMIT %s OFFSET %s
                """,
                tuple(params + [limit, offset]),
            )
            total = fetch_one(f"SELECT COUNT(*) AS total FROM cross_client_benchmarks b {where}", tuple(params)) or {}
            return {"items": [benchmark_item(row) for row in rows], "total": int(total.get("total") or 0), "limit": limit, "offset": offset, "source": "database"}
        except Exception:
            pass
    items = mock_benchmarks(filters)
    reverse = filters.get("sort_dir", "desc") != "asc"
    sort_by = filters.get("sort_by") or "confidence_score"
    items.sort(key=lambda item: item.get(sort_by) or 0, reverse=reverse)
    return {"items": items[offset : offset + limit], "total": len(items), "limit": limit, "offset": offset, "source": "mock"}


def get_facets() -> dict[str, Any]:
    if is_db_configured():
        try:
            return {
                "brand_categories": [row["brand_category"] for row in fetch_all("SELECT DISTINCT brand_category FROM cross_client_benchmarks ORDER BY brand_category")],
                "spend_bands": [row["monthly_ad_spend_band"] for row in fetch_all("SELECT DISTINCT monthly_ad_spend_band FROM cross_client_benchmarks ORDER BY monthly_ad_spend_band")],
                "metrics": [row["primary_metric"] for row in fetch_all("SELECT DISTINCT primary_metric FROM cross_client_benchmarks WHERE primary_metric IS NOT NULL ORDER BY primary_metric")],
                "privacy_levels": [row["privacy_level"] for row in fetch_all("SELECT DISTINCT privacy_level FROM cross_client_benchmarks ORDER BY privacy_level")],
                "source": "database",
            }
        except Exception:
            pass
    items = mock_benchmarks()
    return {
        "brand_categories": sorted({item["brand_category"] for item in items}),
        "spend_bands": sorted({item["monthly_ad_spend_band"] for item in items}),
        "metrics": sorted({item["primary_metric"] for item in items} | {"CPA", "Wasted Spend", "CAC"}),
        "privacy_levels": ["aggregated_only", "k_anonymized", "internal_firewalled"],
        "source": "mock",
    }


def strategy_lift(filters: dict[str, Any]) -> list[dict[str, Any]]:
    limit = int(filters.get("limit") or 10)
    if is_db_configured():
        try:
            where, params = filters_sql(filters)
            rows = fetch_all(
                f"""
                SELECT strategy, AVG(avg_lift_pct) AS avg_lift_pct, AVG(median_lift_pct) AS median_lift_pct,
                       AVG(confidence_score) AS avg_confidence, SUM(sample_size) AS sample_size, COUNT(*) AS benchmark_count
                FROM cross_client_benchmarks b
                {where}
                GROUP BY strategy
                ORDER BY AVG(avg_lift_pct) DESC
                LIMIT %s
                """,
                tuple(params + [limit]),
            )
            return [lift_item(row) for row in rows]
        except Exception:
            pass
    grouped: dict[str, list[dict[str, Any]]] = {}
    for item in mock_benchmarks(filters):
        grouped.setdefault(item["strategy"], []).append(item)
    rows = []
    for strategy, values in grouped.items():
        rows.append({
            "strategy": strategy,
            "avg_lift_pct": sum(v["avg_lift_pct"] for v in values) / len(values),
            "median_lift_pct": sum(v["median_lift_pct"] for v in values) / len(values),
            "avg_confidence": sum(v["confidence_score"] for v in values) / len(values),
            "sample_size": sum(v["sample_size"] for v in values),
            "benchmark_count": len(values),
        })
    return sorted(rows, key=lambda row: row["avg_lift_pct"], reverse=True)[:limit]


def lift_item(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "strategy": row["strategy"],
        "avg_lift_pct": number(row["avg_lift_pct"]),
        "median_lift_pct": number(row["median_lift_pct"]),
        "avg_confidence": number(row["avg_confidence"]),
        "sample_size": int(row["sample_size"] or 0),
        "benchmark_count": int(row["benchmark_count"] or 0),
    }


def graph(filters: dict[str, Any]) -> dict[str, Any]:
    limit = int(filters.get("limit") or 100)
    if is_db_configured():
        try:
            clauses = []
            params = []
            if filters.get("relationship"):
                clauses.append("relationship = %s")
                params.append(filters["relationship"])
            where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
            rows = fetch_all(
                f"""
                SELECT edge_id, source_node_type, source_node_id, relationship, target_node_type, target_node_id, weight, evidence_count, last_updated_at
                FROM knowledge_graph_edges
                {where}
                ORDER BY weight DESC
                LIMIT %s
                """,
                tuple(params + [limit]),
            )
            return graph_payload(rows, "database")
        except Exception:
            pass
    rows = [
        {
            "edge_id": f"KG_DEMO_{idx}",
            "source_node_type": "Client" if idx < 8 else "Benchmark",
            "source_node_id": edge["source"],
            "relationship": edge["relation"],
            "target_node_type": "Benchmark",
            "target_node_id": edge["target"],
            "weight": edge["weight"],
            "evidence_count": 8 + idx,
            "last_updated_at": None,
        }
        for idx, edge in enumerate(KNOWLEDGE_GRAPH_EDGES, 1)
    ][:limit]
    return graph_payload(rows, "mock")


def graph_payload(rows: list[dict[str, Any]], source: str) -> dict[str, Any]:
    nodes: dict[str, dict[str, Any]] = {}
    edges = []
    for row in rows:
        public_ids: dict[str, str] = {}
        for side in ("source", "target"):
            node_id = row[f"{side}_node_id"]
            node_type = row[f"{side}_node_type"]
            public_id = anonymized_node_id(node_id, node_type)
            public_ids[side] = public_id
            nodes[public_id] = {
                "id": public_id,
                "type": node_type,
                "label": anonymized_label(node_id, node_type),
                "metadata": {"privacy": "anonymized_cross_client"},
            }
        edges.append({
            "id": row.get("edge_id") or f"{row['source_node_id']}->{row['target_node_id']}",
            "source": public_ids["source"],
            "target": public_ids["target"],
            "relationship": row["relationship"],
            "weight": number(row["weight"]),
            "evidence_count": int(row.get("evidence_count") or 0),
            "last_updated_at": iso(row.get("last_updated_at")),
        })
    return {"nodes": list(nodes.values()), "edges": edges, "source": source}


def stable_suffix(value: str) -> int:
    return sum((index + 1) * ord(char) for index, char in enumerate(str(value))) % 1000


def anonymized_node_id(node_id: str, node_type: str) -> str:
    prefix = "".join(char for char in node_type.lower() if char.isalnum()) or "node"
    return f"{prefix}-{stable_suffix(str(node_id) + node_type):03d}"


def anonymized_label(node_id: str, node_type: str) -> str:
    suffix = stable_suffix(str(node_id))
    if node_type.lower() == "client":
        return f"Similar Brand {suffix:03d}"
    if node_type.lower() == "benchmark":
        return f"Benchmark Cohort {suffix:03d}"
    return f"{node_type} {suffix:03d}"


def benchmark_detail(benchmark_id: str) -> dict[str, Any]:
    if is_db_configured():
        try:
            row = fetch_one("SELECT * FROM cross_client_benchmarks WHERE benchmark_id = %s", (benchmark_id,))
            if row:
                recommendations = fetch_all(
                    """
                    SELECT r.*, c.brand_name, c.brand_category
                    FROM recommendation_records r
                    LEFT JOIN clients c ON c.client_id = r.client_id
                    WHERE r.supporting_benchmark_id = %s
                    ORDER BY r.detected_at DESC
                    LIMIT 20
                    """,
                    (benchmark_id,),
                )
                docs = fetch_all(
                    """
                    SELECT doc_id, doc_type, source_table, source_record_id, embedding_group, text, updated_at
                    FROM rag_documents
                    WHERE source_record_id = %s OR source_table = 'cross_client_benchmarks'
                    ORDER BY updated_at DESC NULLS LAST
                    LIMIT 8
                    """,
                    (benchmark_id,),
                )
                edges = fetch_all(
                    """
                    SELECT edge_id, source_node_type, source_node_id, relationship, target_node_type, target_node_id, weight, evidence_count, last_updated_at
                    FROM knowledge_graph_edges
                    WHERE source_node_id = %s OR target_node_id = %s
                    LIMIT 20
                    """,
                    (benchmark_id, benchmark_id),
                )
                return detail_payload(benchmark_item(row), recommendations, docs, edges, "database")
        except Exception:
            pass
    benchmark = next((item for item in mock_benchmarks() if item["benchmark_id"] == benchmark_id), None)
    if not benchmark:
        raise HTTPException(status_code=404, detail="Benchmark not found")
    recs = [rec for rec in RECOMMENDATIONS[:3]]
    return detail_payload(benchmark, recs, [], [], "mock")


def detail_payload(benchmark: dict[str, Any], recommendations: list[dict[str, Any]], docs: list[dict[str, Any]], edges: list[dict[str, Any]], source: str) -> dict[str, Any]:
    related_recommendations = [
        {
            "recommendation_id": rec.get("recommendation_id") or rec.get("id"),
            "title": rec.get("title"),
            "brand_name": rec.get("brand_name") or rec.get("client_name"),
            "target_platform": rec.get("target_platform") or rec.get("platform"),
            "expected_weekly_savings": number(rec.get("expected_weekly_savings", rec.get("expected_savings"))),
            "confidence_score": number(rec.get("confidence_score", rec.get("confidence"))),
            "risk_level": str(rec.get("risk_level") or rec.get("risk") or "Low").capitalize(),
            "status": rec.get("status"),
        }
        for rec in recommendations
    ]
    return {
        "benchmark": benchmark,
        "related_recommendations": related_recommendations,
        "related_rag_documents": docs,
        "related_graph_edges": graph_payload(edges, source)["edges"] if edges else [],
        "privacy_note": "This benchmark is aggregated and anonymized. It can support strategy decisions without exposing raw client records, customer lists, or private campaign credentials.",
        "source": source,
    }

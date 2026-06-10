"""Recursive learning loop service for outcome feedback and memory updates."""

from __future__ import annotations

import uuid
from decimal import Decimal
from typing import Any

from fastapi import HTTPException

from app.db import fetch_all, fetch_one, get_db_connection, is_db_configured
from app.services.agent_log_service import create_agent_log
from mock_data import ACTIONS

_fallback_events: list[dict[str, Any]] = []
_fallback_outcomes: list[dict[str, Any]] = []
_fallback_scores: dict[str, dict[str, Any]] = {}
_fallback_memory: list[dict[str, Any]] = []


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


def summary() -> dict[str, Any]:
    if is_db_configured():
        try:
            learning = fetch_one("SELECT COUNT(*) AS total, MAX(created_at) AS last_at FROM learning_events") or {}
            outcomes = fetch_one(
                """
                SELECT COUNT(*) AS total,
                       COUNT(*) FILTER (WHERE outcome_label = 'positive_lift') AS successful,
                       COUNT(*) FILTER (WHERE outcome_label = 'rolled_back') AS rolled_back,
                       AVG(measured_impact_pct) AS avg_impact
                FROM outcome_measurements
                """
            ) or {}
            scores = fetch_one("SELECT COUNT(*) AS total FROM strategy_learning_scores") or {}
            memories = fetch_one("SELECT COUNT(*) AS total FROM rag_documents WHERE embedding_group = 'learning_memory'") or {}
            return {
                "total_learning_events": int(learning.get("total") or 0),
                "outcomes_measured": int(outcomes.get("total") or 0),
                "successful_outcomes": int(outcomes.get("successful") or 0),
                "rolled_back_outcomes": int(outcomes.get("rolled_back") or 0),
                "avg_measured_impact_pct": number(outcomes.get("avg_impact")),
                "strategies_tracked": int(scores.get("total") or 0),
                "rag_docs_created": int(memories.get("total") or 0),
                "benchmarks_updated": int(learning.get("total") or 0),
                "graph_edges_updated": int(learning.get("total") or 0),
                "last_learning_cycle_at": iso(learning.get("last_at")),
                "source": "database",
            }
        except Exception:
            pass
    return {
        "total_learning_events": len(_fallback_events),
        "outcomes_measured": len(_fallback_outcomes),
        "successful_outcomes": len([item for item in _fallback_outcomes if item["outcome_label"] == "positive_lift"]),
        "rolled_back_outcomes": len([item for item in _fallback_outcomes if item["outcome_label"] == "rolled_back"]),
        "avg_measured_impact_pct": avg([item["measured_impact_pct"] for item in _fallback_outcomes]),
        "strategies_tracked": len(_fallback_scores),
        "rag_docs_created": len(_fallback_memory),
        "benchmarks_updated": len(_fallback_events),
        "graph_edges_updated": len(_fallback_events),
        "last_learning_cycle_at": _fallback_events[0]["created_at"] if _fallback_events else None,
        "source": "mock",
    }


def avg(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0


def run_cycle(payload: dict[str, Any]) -> dict[str, Any]:
    window_days = int(payload.get("window_days") or 30)
    client_id = payload.get("client_id")
    if is_db_configured():
        try:
            actions = fetch_learning_actions(client_id)
            events_created = outcomes_created = rag_created = benchmarks_updated = graph_updated = 0
            for action in actions:
                if measurement_exists(action["optimization_id"], window_days):
                    continue
                measurement = measure_action(action, window_days)
                event = learning_event_from(action, measurement)
                rag_doc = memory_doc_from(event, action)
                with get_db_connection() as conn:
                    insert_measurement(conn, measurement)
                    insert_learning_event(conn, event)
                    insert_memory_doc(conn, rag_doc)
                    update_strategy_score(conn, event, action)
                    update_benchmark(conn, action, measurement)
                    update_graph_edges(conn, action, measurement)
                events_created += 1
                outcomes_created += 1
                rag_created += 1
                benchmarks_updated += 1 if action.get("supporting_benchmark_id") else 0
                graph_updated += 1
            create_learning_logs(outcomes_created, rag_created, events_created)
            return {
                "status": "completed",
                "learning_events_created": events_created,
                "outcome_measurements_created": outcomes_created,
                "rag_documents_created": rag_created,
                "benchmarks_updated": benchmarks_updated,
                "graph_edges_updated": graph_updated,
                "summary": "Learning cycle completed and updated recursive memory.",
                "source": "database",
            }
        except Exception:
            pass
    return run_fallback_cycle(window_days, client_id)


def fetch_learning_actions(client_id: str | None) -> list[dict[str, Any]]:
    params: list[Any] = []
    where = "WHERE o.status IN ('Executed', 'Rolled Back')"
    if client_id:
        where += " AND o.client_id = %s"
        params.append(client_id)
    return fetch_all(
        f"""
        SELECT o.*, c.brand_name, c.brand_category, c.monthly_ad_spend_band,
               r.recommendation_id, r.supporting_benchmark_id
        FROM optimization_history o
        LEFT JOIN clients c ON c.client_id = o.client_id
        LEFT JOIN recommendation_records r ON r.client_id = o.client_id
             AND (r.target_campaign_id = o.target_campaign_id OR lower(r.recommendation_type) = lower(o.action_type))
        {where}
        ORDER BY o.created_at DESC NULLS LAST
        LIMIT 25
        """,
        tuple(params),
    )


def measurement_exists(optimization_id: str, window_days: int) -> bool:
    row = fetch_one(
        "SELECT measurement_id FROM outcome_measurements WHERE optimization_id = %s AND measurement_window_days = %s LIMIT 1",
        (optimization_id, window_days),
    )
    return bool(row)


def measure_action(action: dict[str, Any], window_days: int) -> dict[str, Any]:
    before = performance_window(action, -14, -1)
    after = performance_window(action, 1, 14)
    label = outcome_label(action, before, after)
    impact = measured_impact(action, before, after, label)
    return {
        "measurement_id": f"MEAS_{uuid.uuid4().hex[:12]}",
        "recommendation_id": action.get("recommendation_id"),
        "optimization_id": action.get("optimization_id"),
        "client_id": action.get("client_id"),
        "campaign_id": action.get("target_campaign_id"),
        "platform": action.get("target_platform"),
        "measurement_window_days": window_days,
        "spend_before": before["spend"],
        "spend_after": after["spend"],
        "revenue_before": before["revenue"],
        "revenue_after": after["revenue"],
        "roas_before": before["roas"],
        "roas_after": after["roas"],
        "cpa_before": before["cpa"],
        "cpa_after": after["cpa"],
        "purchases_before": before["purchases"],
        "purchases_after": after["purchases"],
        "measured_impact_pct": impact,
        "outcome_label": label,
    }


def performance_window(action: dict[str, Any], start_offset: int, end_offset: int) -> dict[str, Any]:
    row = fetch_one(
        """
        SELECT SUM(spend) AS spend, SUM(revenue) AS revenue, AVG(roas) AS roas, AVG(cpa) AS cpa, SUM(purchases) AS purchases
        FROM ad_performance_daily
        WHERE client_id = %s
          AND (%s IS NULL OR campaign_id = %s)
          AND date BETWEEN (%s::timestamptz + (%s || ' days')::interval)::date
                       AND (%s::timestamptz + (%s || ' days')::interval)::date
        """,
        (
            action.get("client_id"),
            action.get("target_campaign_id"),
            action.get("target_campaign_id"),
            action.get("created_at"),
            start_offset,
            action.get("created_at"),
            end_offset,
        ),
    ) or {}
    spend = number(row.get("spend"))
    revenue = number(row.get("revenue"))
    purchases = int(row.get("purchases") or 0)
    return {
        "spend": spend,
        "revenue": revenue,
        "roas": number(row.get("roas")) or (revenue / spend if spend else 0),
        "cpa": number(row.get("cpa")) or (spend / purchases if purchases else 0),
        "purchases": purchases,
    }


def outcome_label(action: dict[str, Any], before: dict[str, Any], after: dict[str, Any]) -> str:
    if action.get("rollback_flag") or action.get("status") == "Rolled Back":
        return "rolled_back"
    if before["spend"] < 50 or after["spend"] < 50 or before["purchases"] < 1 or after["purchases"] < 1:
        return "insufficient_data"
    roas_delta = after["roas"] - before["roas"]
    cpa_delta = before["cpa"] - after["cpa"]
    if roas_delta > 0.05 or cpa_delta > 2:
        return "positive_lift"
    if roas_delta < -0.05 or cpa_delta < -2:
        return "negative"
    return "neutral"


def measured_impact(action: dict[str, Any], before: dict[str, Any], after: dict[str, Any], label: str) -> float:
    if label == "rolled_back":
        return -0.05
    if label == "insufficient_data":
        return 0.0
    if before["roas"]:
        return (after["roas"] - before["roas"]) / before["roas"]
    if before["cpa"]:
        return (before["cpa"] - after["cpa"]) / before["cpa"]
    return number(action.get("actual_impact_pct"))


def learning_event_from(action: dict[str, Any], measurement: dict[str, Any]) -> dict[str, Any]:
    before = number(action.get("confidence_score") or 0.75)
    impact = measurement["measured_impact_pct"]
    after = max(0.30, min(0.99, before + (0.04 if impact > 0 else -0.05 if impact < 0 else 0)))
    event_id = f"LEARN_{uuid.uuid4().hex[:12]}"
    summary_text = f"Strategy {action.get('action_type')} on {action.get('target_platform')} produced {measurement['outcome_label']} with measured impact {impact:.1%}."
    return {
        "event_id": event_id,
        "source_type": "optimization",
        "source_id": action.get("optimization_id"),
        "client_id": action.get("client_id"),
        "strategy": action.get("action_type"),
        "platform": action.get("target_platform"),
        "outcome_type": measurement["outcome_label"],
        "outcome_status": "completed",
        "expected_impact_pct": number(action.get("expected_impact_pct")),
        "actual_impact_pct": impact,
        "confidence_before": before,
        "confidence_after": after,
        "benchmark_id": action.get("supporting_benchmark_id"),
        "graph_edge_id": None,
        "rag_doc_id": f"RAG_{event_id}",
        "learning_summary": summary_text,
    }


def memory_doc_from(event: dict[str, Any], action: dict[str, Any]) -> dict[str, Any]:
    return {
        "doc_id": event["rag_doc_id"],
        "client_id": event["client_id"],
        "doc_type": "learning_outcome_summary",
        "source_table": "learning_events",
        "source_record_id": event["event_id"],
        "chunk_id": 1,
        "embedding_group": "learning_memory",
        "text": f"Learning event {event['event_id']}: Strategy {event['strategy']} for {action.get('brand_category') or 'similar'} brands in spend band {action.get('monthly_ad_spend_band') or 'unknown'} on {event['platform']} produced {event['outcome_type']} of {event['actual_impact_pct']:.1%}. Future recommendations for similar clients should adjust confidence using this outcome.",
    }


def insert_measurement(conn, item: dict[str, Any]) -> None:
    conn.execute(
        """
        INSERT INTO outcome_measurements (
            measurement_id, recommendation_id, optimization_id, client_id, campaign_id, platform,
            measurement_window_days, spend_before, spend_after, revenue_before, revenue_after,
            roas_before, roas_after, cpa_before, cpa_after, purchases_before, purchases_after,
            measured_impact_pct, outcome_label
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        tuple(item.values()),
    )


def insert_learning_event(conn, item: dict[str, Any]) -> None:
    conn.execute(
        """
        INSERT INTO learning_events (
            event_id, source_type, source_id, client_id, strategy, platform, outcome_type, outcome_status,
            expected_impact_pct, actual_impact_pct, confidence_before, confidence_after, benchmark_id,
            graph_edge_id, rag_doc_id, learning_summary
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        tuple(item.values()),
    )


def insert_memory_doc(conn, item: dict[str, Any]) -> None:
    conn.execute(
        """
        INSERT INTO rag_documents (doc_id, client_id, doc_type, source_table, source_record_id, chunk_id, embedding_group, text, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, now())
        """,
        tuple(item.values()),
    )


def update_strategy_score(conn, event: dict[str, Any], action: dict[str, Any]) -> None:
    key = strategy_key(action)
    existing = fetch_one("SELECT * FROM strategy_learning_scores WHERE strategy_key = %s", (key,)) if is_db_configured() else None
    total = int((existing or {}).get("total_trials") or 0) + 1
    successful = int((existing or {}).get("successful_trials") or 0) + (1 if event["outcome_type"] == "positive_lift" else 0)
    rolled = int((existing or {}).get("rolled_back_trials") or 0) + (1 if event["outcome_type"] == "rolled_back" else 0)
    avg_impact = rolling_avg(number((existing or {}).get("avg_actual_impact_pct")), total, event["actual_impact_pct"])
    avg_confidence = rolling_avg(number((existing or {}).get("avg_confidence")), total, event["confidence_after"])
    success_rate = successful / total
    rollback_penalty = min(rolled / total, 0.5)
    # Learning score is intentionally simple and explainable for the MVP.
    learning_score = max(0, min(1, 0.45 * success_rate + 0.35 * max(min(avg_impact / 0.20, 1), 0) + 0.20 * avg_confidence - rollback_penalty))
    conn.execute(
        """
        INSERT INTO strategy_learning_scores (
            strategy_key, strategy, brand_category, spend_band, platform, total_trials, successful_trials,
            rolled_back_trials, avg_actual_impact_pct, avg_confidence, learning_score, last_updated_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, now())
        ON CONFLICT (strategy_key) DO UPDATE SET
            total_trials = EXCLUDED.total_trials,
            successful_trials = EXCLUDED.successful_trials,
            rolled_back_trials = EXCLUDED.rolled_back_trials,
            avg_actual_impact_pct = EXCLUDED.avg_actual_impact_pct,
            avg_confidence = EXCLUDED.avg_confidence,
            learning_score = EXCLUDED.learning_score,
            last_updated_at = now()
        """,
        (key, action.get("action_type"), action.get("brand_category"), action.get("monthly_ad_spend_band"), action.get("target_platform"), total, successful, rolled, avg_impact, avg_confidence, learning_score),
    )


def rolling_avg(previous: float, total: int, new_value: float) -> float:
    if total <= 1:
        return new_value
    return ((previous * (total - 1)) + new_value) / total


def strategy_key(action: dict[str, Any]) -> str:
    return "|".join(str(action.get(key) or "unknown") for key in ("action_type", "brand_category", "monthly_ad_spend_band", "target_platform"))


def update_benchmark(conn, action: dict[str, Any], measurement: dict[str, Any]) -> None:
    benchmark_id = action.get("supporting_benchmark_id")
    if not benchmark_id:
        return
    delta = 0.02 if measurement["outcome_label"] == "positive_lift" else -0.03 if measurement["outcome_label"] in {"negative", "rolled_back"} else 0
    conn.execute(
        "UPDATE cross_client_benchmarks SET confidence_score = LEAST(0.99, GREATEST(0.30, confidence_score + %s)) WHERE benchmark_id = %s",
        (delta, benchmark_id),
    )


def update_graph_edges(conn, action: dict[str, Any], measurement: dict[str, Any]) -> None:
    delta = 0.03 if measurement["outcome_label"] == "positive_lift" else -0.04 if measurement["outcome_label"] in {"negative", "rolled_back"} else 0
    conn.execute(
        """
        UPDATE knowledge_graph_edges
        SET weight = LEAST(1.0, GREATEST(0.1, weight + %s)), evidence_count = evidence_count + 1
        WHERE source_node_id IN (%s, %s) OR target_node_id IN (%s, %s)
        """,
        (delta, action.get("client_id"), action.get("target_campaign_id"), action.get("client_id"), action.get("target_campaign_id")),
    )


def create_learning_logs(outcomes: int, rag_docs: int, events: int) -> None:
    create_agent_log("Pattern Miner", f"Pattern Miner measured outcomes for {outcomes} executed optimizations.", "info", related_entity_type="learning", related_entity_id="cycle")
    create_agent_log("Recommendation Engine", "Recommendation Engine updated strategy learning scores.", "success", related_entity_type="learning", related_entity_id="cycle")
    create_agent_log("Evidence + Risk Grader", f"Evidence + Risk Grader recalibrated confidence using {events} learning events.", "info", related_entity_type="learning", related_entity_id="cycle")
    create_agent_log("Pattern Miner", f"RAG memory updated with {rag_docs} learning outcome summaries.", "success", related_entity_type="learning", related_entity_id="cycle")


def run_fallback_cycle(window_days: int, client_id: str | None) -> dict[str, Any]:
    actions = [item for item in ACTIONS if item["status"] in {"executed", "rolled_back"}]
    if client_id:
        actions = [item for item in actions if item.get("client_id") == client_id]
    created = 0
    for action in actions[:5]:
        source_id = action["id"]
        if any(item["source_id"] == source_id for item in _fallback_events):
            continue
        label = "rolled_back" if action["status"] == "rolled_back" else "positive_lift"
        measured = -0.05 if label == "rolled_back" else 0.07
        outcome = {
            "measurement_id": f"MEAS_{uuid.uuid4().hex[:8]}",
            "recommendation_id": action.get("recommendation_id"),
            "optimization_id": source_id,
            "client_id": action.get("client_id") or action["client_name"],
            "campaign_id": None,
            "platform": "Meta" if "Shopping" not in action["title"] else "Google",
            "measurement_window_days": window_days,
            "spend_before": 1000,
            "spend_after": 920,
            "revenue_before": 2400,
            "revenue_after": 2700,
            "roas_before": 2.4,
            "roas_after": 2.93,
            "cpa_before": 42,
            "cpa_after": 36,
            "purchases_before": 57,
            "purchases_after": 75,
            "measured_impact_pct": measured,
            "outcome_label": label,
            "created_at": action.get("executed_at"),
        }
        event = {
            "event_id": f"LEARN_{uuid.uuid4().hex[:8]}",
            "source_type": "optimization",
            "source_id": source_id,
            "client_id": outcome["client_id"],
            "strategy": action["type"],
            "platform": outcome["platform"],
            "outcome_type": label,
            "outcome_status": "completed",
            "expected_impact_pct": 0.08,
            "actual_impact_pct": measured,
            "confidence_before": 0.78,
            "confidence_after": 0.83 if measured > 0 else 0.70,
            "benchmark_id": None,
            "graph_edge_id": None,
            "rag_doc_id": f"RAG_LEARN_{uuid.uuid4().hex[:8]}",
            "learning_summary": f"Strategy {action['type']} produced {label} with measured impact {measured:.1%}.",
            "created_at": action.get("executed_at"),
        }
        _fallback_outcomes.insert(0, outcome)
        _fallback_events.insert(0, event)
        _fallback_memory.insert(0, {
            "doc_id": event["rag_doc_id"],
            "client_id": event["client_id"],
            "doc_type": "learning_outcome_summary",
            "embedding_group": "learning_memory",
            "text": event["learning_summary"],
            "updated_at": event["created_at"],
        })
        key = f"{event['strategy']}|demo|demo|{event['platform']}"
        _fallback_scores[key] = {
            "strategy_key": key,
            "strategy": event["strategy"],
            "brand_category": "Demo",
            "spend_band": "Demo",
            "platform": event["platform"],
            "total_trials": 1,
            "successful_trials": 1 if label == "positive_lift" else 0,
            "rolled_back_trials": 1 if label == "rolled_back" else 0,
            "avg_actual_impact_pct": measured,
            "avg_confidence": event["confidence_after"],
            "learning_score": 0.76 if label == "positive_lift" else 0.42,
            "last_updated_at": event["created_at"],
        }
        created += 1
    create_learning_logs(created, created, created)
    return {"status": "completed", "learning_events_created": created, "outcome_measurements_created": created, "rag_documents_created": created, "benchmarks_updated": created, "graph_edges_updated": created, "summary": "Learning cycle completed and updated recursive memory.", "source": "mock"}


def events(filters: dict[str, Any]) -> dict[str, Any]:
    limit, offset = int(filters.get("limit") or 50), int(filters.get("offset") or 0)
    if is_db_configured():
        try:
            where, params = filter_sql(filters, {"client_id": "client_id", "strategy": "strategy", "outcome_type": "outcome_type"})
            rows = fetch_all(f"SELECT * FROM learning_events {where} ORDER BY created_at DESC LIMIT %s OFFSET %s", tuple(params + [limit, offset]))
            total = fetch_one(f"SELECT COUNT(*) AS total FROM learning_events {where}", tuple(params)) or {}
            return {"items": [jsonable(row) for row in rows], "total": int(total.get("total") or 0), "limit": limit, "offset": offset, "source": "database"}
        except Exception:
            pass
    items = filter_items(_fallback_events, filters, ["client_id", "strategy", "outcome_type"])
    return {"items": items[offset: offset + limit], "total": len(items), "limit": limit, "offset": offset, "source": "mock"}


def outcomes(filters: dict[str, Any]) -> dict[str, Any]:
    limit, offset = int(filters.get("limit") or 50), int(filters.get("offset") or 0)
    if is_db_configured():
        try:
            where, params = filter_sql(filters, {"client_id": "o.client_id", "platform": "o.platform", "outcome_label": "o.outcome_label"})
            rows = fetch_all(f"SELECT o.*, c.brand_name FROM outcome_measurements o LEFT JOIN clients c ON c.client_id = o.client_id {where} ORDER BY o.created_at DESC LIMIT %s OFFSET %s", tuple(params + [limit, offset]))
            total = fetch_one(f"SELECT COUNT(*) AS total FROM outcome_measurements o {where}", tuple(params)) or {}
            return {"items": [jsonable(row) for row in rows], "total": int(total.get("total") or 0), "limit": limit, "offset": offset, "source": "database"}
        except Exception:
            pass
    items = filter_items(_fallback_outcomes, filters, ["client_id", "platform", "outcome_label"])
    return {"items": items[offset: offset + limit], "total": len(items), "limit": limit, "offset": offset, "source": "mock"}


def strategy_scores(filters: dict[str, Any]) -> dict[str, Any]:
    limit = int(filters.get("limit") or 50)
    if is_db_configured():
        try:
            where, params = filter_sql(filters, {"brand_category": "brand_category", "spend_band": "spend_band", "platform": "platform"})
            sort_by = filters.get("sort_by") if filters.get("sort_by") in {"learning_score", "total_trials", "avg_actual_impact_pct", "successful_trials"} else "learning_score"
            sort_dir = "ASC" if str(filters.get("sort_dir")).lower() == "asc" else "DESC"
            rows = fetch_all(f"SELECT * FROM strategy_learning_scores {where} ORDER BY {sort_by} {sort_dir} LIMIT %s", tuple(params + [limit]))
            return {"items": [jsonable(row) for row in rows], "source": "database"}
        except Exception:
            pass
    return {"items": list(_fallback_scores.values())[:limit], "source": "mock"}


def memory_updates() -> dict[str, Any]:
    if is_db_configured():
        try:
            rows = fetch_all(
                "SELECT doc_id, client_id, doc_type, source_table, source_record_id, embedding_group, text, updated_at FROM rag_documents WHERE embedding_group = 'learning_memory' AND doc_type = 'learning_outcome_summary' ORDER BY updated_at DESC NULLS LAST LIMIT 20"
            )
            return {"items": [jsonable(row) for row in rows], "source": "database"}
        except Exception:
            pass
    return {"items": _fallback_memory[:20], "source": "mock"}


def promote_to_benchmark(payload: dict[str, Any]) -> dict[str, Any]:
    key = payload.get("strategy_key")
    if not key:
        raise HTTPException(status_code=400, detail="strategy_key is required.")
    score = fetch_one("SELECT * FROM strategy_learning_scores WHERE strategy_key = %s", (key,)) if is_db_configured() else _fallback_scores.get(key)
    if not score:
        raise HTTPException(status_code=404, detail="Strategy learning score not found.")
    if int(score.get("total_trials") or 0) < 3 or number(score.get("learning_score")) < 0.70 or int(score.get("rolled_back_trials") or 0) > 1:
        raise HTTPException(status_code=400, detail="Strategy does not meet promotion criteria yet.")
    benchmark_id = f"LEARN_BENCH_{uuid.uuid4().hex[:10]}"
    benchmark = {
        "benchmark_id": benchmark_id,
        "brand_category": score.get("brand_category"),
        "monthly_ad_spend_band": score.get("spend_band"),
        "strategy": score.get("strategy"),
        "avg_lift_pct": number(score.get("avg_actual_impact_pct")),
        "sample_size": int(score.get("total_trials") or 0),
        "confidence_score": number(score.get("avg_confidence")),
        "privacy_level": "aggregated_only",
    }
    if is_db_configured():
        with get_db_connection() as conn:
            conn.execute(
                """
                INSERT INTO cross_client_benchmarks (
                    benchmark_id, anonymized_cohort_id, brand_category, monthly_ad_spend_band, strategy, primary_metric,
                    avg_lift_pct, median_lift_pct, sample_size, confidence_score, privacy_level, generated_at
                ) VALUES (%s, %s, %s, %s, %s, 'ROAS', %s, %s, %s, %s, 'aggregated_only', now())
                """,
                (benchmark_id, f"LEARN_COHORT_{benchmark_id}", benchmark["brand_category"], benchmark["monthly_ad_spend_band"], benchmark["strategy"], benchmark["avg_lift_pct"], benchmark["avg_lift_pct"], benchmark["sample_size"], benchmark["confidence_score"]),
            )
    create_agent_log("Pattern Miner", f"Promoted strategy {score.get('strategy')} to cross-client benchmark.", "success", related_entity_type="benchmark", related_entity_id=benchmark_id)
    return {"benchmark": benchmark, "source": "database" if is_db_configured() else "mock"}


def filter_sql(filters: dict[str, Any], mapping: dict[str, str]) -> tuple[str, list[Any]]:
    clauses, params = [], []
    for key, column in mapping.items():
        if filters.get(key):
            clauses.append(f"{column} = %s")
            params.append(filters[key])
    return (f"WHERE {' AND '.join(clauses)}" if clauses else "", params)


def filter_items(items: list[dict[str, Any]], filters: dict[str, Any], keys: list[str]) -> list[dict[str, Any]]:
    result = list(items)
    for key in keys:
        if filters.get(key):
            result = [item for item in result if item.get(key) == filters[key]]
    return result


def jsonable(row: dict[str, Any]) -> dict[str, Any]:
    result = {}
    for key, value in row.items():
        if isinstance(value, Decimal):
            result[key] = float(value)
        elif hasattr(value, "isoformat"):
            result[key] = value.isoformat()
        else:
            result[key] = value
    return result

# Future Work

## Connectors

- Add real Shopify ingestion.
- Add real Klaviyo ingestion.
- Add real Meta Ads ingestion and guarded execution.
- Add real Google Ads ingestion and guarded execution.
- Add Snowflake warehouse sync.

## Agent Orchestration

- Replace deterministic scan simulation with LangGraph or an equivalent orchestrator.
- Add typed task contracts between agents.
- Add durable run state and retry policies.
- Keep public operational logs separate from hidden model reasoning.

## Retrieval

- Add scheduled embedding generation through Render Cron or a worker queue.
- Add hybrid ranker evaluation.
- Add index freshness monitoring.
- Add retrieval regression tests.
- Add pgvector index fallback docs for environments that do not support HNSW.

## Operations

- Add background jobs for ingestion, scans, action execution, and learning cycles.
- Add queue infrastructure such as Celery, RQ, BullMQ, or a managed worker queue.
- Add observability with logs, traces, metrics, and alerting.
- Add rate limiting for expensive endpoints.
- Add materialized views or read replicas for large dashboards.

## Safety and Governance

- Add authentication.
- Add tenant isolation and strict client-level filters.
- Add row-level security where Supabase is used.
- Add production action snapshots.
- Add idempotency keys and retry policies for API writes.
- Add approval policies by tenant and spend threshold.

## Measurement

- Add experiment tracking.
- Add causal lift measurement.
- Add holdout-aware attribution.
- Add strategy confidence recalibration from measured outcomes.

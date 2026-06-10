# 90-Day Roadmap

## Days 0-30: Recommendation MVP

- Ingest synthetic and real client data.
- Build the command center dashboard.
- Add recommendation queue and detail view.
- Attach SQL, RAG, and graph evidence to recommendations.
- Keep execution human approval only.
- Apply conservative guardrail defaults.

## Days 31-60: Guarded Execution

- Add Action Executor.
- Support low-risk audience refresh simulation or first real connector.
- Maintain audit log.
- Require rollback plan before execution.
- Expand Agent Workbench visibility.
- Validate data freshness before recommendations.

## Days 61-90: Recursive Intelligence

- Run learning loop from approved, executed, and rolled-back outcomes.
- Update benchmark confidence from measured results.
- Reweight graph edges by strategy performance.
- Write learning outcomes into RAG memory.
- Keep privacy-safe network-effect scoring aggregated.
- Enable limited auto-execution for high-confidence, low-risk optimizations.

## Production Readiness After 90 Days

- Replace simulated execution with Meta and Google APIs.
- Add LangGraph orchestration for real agent routing.
- Add pgvector embeddings and embedding regeneration jobs.
- Add production background workers, retries, and idempotency keys.
- Add authentication, tenant isolation, and audit-compliant snapshots.

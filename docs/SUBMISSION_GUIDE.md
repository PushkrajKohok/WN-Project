# Submission Guide

## One-Page Project Explanation

WasteNot Always-On Intelligence Layer is a full-stack take-home demo showing how WasteNot can move from reactive account optimization to a continuous intelligence system for eCommerce ad spend. It ingests synthetic Shopify, Klaviyo, Meta, Google Ads, Snowflake, and Postgres-style data; builds optimization recommendations; grounds them in SQL, RAG document, and cross-client benchmark evidence; applies guardrails; simulates action execution and rollback; and feeds measured outcomes back into recursive learning memory.

The architecture is Agentic Graph-Hybrid RAG with Corrective RAG guardrails. Agentic RAG coordinates Data Scout, Pattern Miner, Recommendation Engine, Evidence + Risk Grader, Human Interface, and Action Executor roles. Hybrid RAG combines structured SQL retrieval with document retrieval. GraphRAG-style tables represent anonymized cross-client patterns. Corrective RAG scores evidence quality, freshness, risk, and guardrail compliance before action.

The demo is production-aware but safe. It does not connect to real external ad-platform APIs, does not expose real credentials, does not run real LLM orchestration, and does not perform real pgvector embedding search yet.

## Concise Demo Script

"WasteNot currently ingests eCommerce and ad-platform data to reduce wasted spend. This demo shows how that evolves into an always-on intelligence layer. I start from Data & Ingestion Control, where synthetic Shopify/Klaviyo/Meta/Google-style data can be generated and ingested. The dashboard summarizes savings, risk, recommendations, and ingestion health. The recommendation queue shows optimization actions with confidence and risk. Opening a recommendation shows SQL evidence, RAG documents, cross-client benchmark support, risk validation, and rollback planning. The Agent Workbench makes the multi-agent process transparent: Data Scout detects issues, Pattern Miner retrieves patterns, Recommendation Engine proposes actions, Risk Grader validates evidence, Human Interface escalates decisions, and Action Executor simulates execution. Cross-Client Patterns demonstrates network effects through anonymized benchmarks. Guardrails control autonomy. RAG Retrieval shows hybrid evidence scoring. Learning Loop feeds outcomes back into memory, benchmarks, and graph relationships."

## Recommended Demo Flow

1. Open `/docs` to explain the project.
2. Open `/data` and show ingestion frequency plus synthetic data controls.
3. Open `/dashboard` and show KPIs.
4. Open `/recommendations` and review the recommendation queue.
5. Open `/recommendations/[id]` and show SQL, RAG, GraphRAG, risk, and rollback evidence.
6. Open `/agents` and run an optimization scan.
7. Open `/patterns` to show network-effect intelligence.
8. Open `/actions` and simulate execution or rollback.
9. Open `/guardrails` and show approval settings.
10. Open `/rag` and run retrieval.
11. Open `/learning` and run the learning loop.

## Page-By-Page Walkthrough

| Page | What to show |
| --- | --- |
| `/data` | Synthetic generation, ingestion pipeline, manifest row counts, and hourly cadence. |
| `/dashboard` | Intelligence command center, KPIs, trends, alerts, ingestion health, and agent activity. |
| `/recommendations` | Queue filtering, risk/status badges, approval workflow, and demo fallback resilience. |
| `/recommendations/[id]` | Evidence drawer with SQL, RAG, graph support, risk validation, agent trace, and rollback plan. |
| `/agents` | Agent topology, run scan workflow, public logs, tool calls, and failure recovery. |
| `/patterns` | Anonymized benchmarks, graph edges, strategy lift, and privacy-safe network effects. |
| `/actions` | Audit log, execution safety, simulated execution, and rollback history. |
| `/guardrails` | Approval thresholds, auto-execution boundaries, benchmark requirements, and privacy mode. |
| `/rag` | SQL/document/graph retrieval, evidence scoring, and retrieval trace. |
| `/learning` | Outcome measurement, RAG memory updates, benchmark updates, graph weighting, and strategy scores. |
| `/docs` | Architecture, memo, roadmap, deployment readiness, implemented-vs-simulated table, and checklist. |

## What To Say During Review

- The system is designed to reduce wasted spend by turning commerce and ad-platform data into guarded recommendations.
- Cross-client learning is privacy-safe because it shares aggregated outcomes, not raw customer or account data.
- Every recommendation is grounded in visible evidence rather than hidden reasoning.
- High-risk or low-confidence actions require human approval.
- Execution is simulated in the demo; production would call Meta and Google APIs only after auth, tenant isolation, snapshots, idempotency, and rollback controls are complete.
- The database schema, ingestion workflow, API, frontend surfaces, and deployment path are ready for credentials and hosted infrastructure.

## Known Limitations

- Real external APIs are not connected.
- Real LLM orchestration is not active.
- Real pgvector embeddings are scaffolded but not active.
- Attribution is simplified and synthetic.
- Authentication, tenant isolation, and production job queues are future work.

## Future Roadmap

See:

- `docs/ROADMAP_90_DAY.md`
- `docs/FUTURE_WORK.md`
- `docs/DEPLOYMENT.md`

## Supporting Docs

- `docs/ARCHITECTURE.md`
- `docs/NETWORK_EFFECTS_MEMO.md`
- `docs/ROADMAP_90_DAY.md`
- `docs/DEPLOYMENT.md`
- `docs/FINAL_CHECKLIST.md`
- `docs/KNOWN_LIMITATIONS.md`
- `docs/FUTURE_WORK.md`

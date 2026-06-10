# Known Limitations

This project is a take-home demo and production architecture scaffold. It is intentionally honest about the boundary between implemented behavior and simulated behavior.

## Current Limitations

- No real external API execution.
- No live Meta, Google, Shopify, or Klaviyo connectors.
- No real embeddings or active pgvector semantic search yet.
- Agent orchestration is deterministic simulation, not real LLM or LangGraph execution.
- Synthetic data only unless a reviewer connects a database and ingests their own compatible CSVs.
- Attribution is simplified and not causal.
- Action execution and rollback are simulated.
- No production authentication or tenant isolation.
- No production job queue for long-running ingestion, scans, or embedding jobs.
- No external secret manager integration inside the local demo.
- No production observability stack.

## Why These Boundaries Exist

The assignment focuses on showing how WasteNot could evolve into an always-on intelligence layer. The demo therefore prioritizes data modeling, recommendation workflow, evidence grounding, guardrails, auditability, network-effect learning, and deployment readiness without touching real ad accounts or exposing credentials.

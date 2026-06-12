# Known Limitations

This project is a take-home demo and production architecture scaffold. It is intentionally honest about the boundary between implemented behavior and simulated behavior.

## Current Limitations

- No real external API execution.
- No live Meta, Google, Shopify, or Klaviyo connectors.
- OpenAI embeddings and pgvector semantic search are optional and disabled until Render env vars plus the Supabase migration are applied.
- Agent orchestration is deterministic simulation, not LangGraph execution. LLM scan summaries are explanatory only.
- Synthetic data only unless a reviewer connects a database and ingests their own compatible CSVs.
- Attribution is simplified and not causal.
- Action execution and rollback are simulated.
- No production authentication or tenant isolation.
- No production job queue for long-running ingestion, scans, or embedding jobs.
- No external secret manager integration inside the local demo.
- No production observability stack.

## Why These Boundaries Exist

The assignment focuses on showing how WasteNot could evolve into an always-on intelligence layer. The demo therefore prioritizes data modeling, recommendation workflow, evidence grounding, guardrails, auditability, network-effect learning, and deployment readiness without touching real ad accounts or exposing credentials.

## Real OpenAI Mode Boundary

The new OpenAI integration powers vector retrieval and public explanation summaries only. It does not add Shopify, Meta, Google Ads, or Klaviyo live ingestion, and it does not execute ad-platform actions. Deterministic SQL/graph evidence and guardrails remain authoritative.

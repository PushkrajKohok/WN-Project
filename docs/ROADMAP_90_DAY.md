# Realistic 90-Day Build Plan

## Days 0-15: Production Foundation

The first two weeks should focus on making the system reliable before making it autonomous. The goal is to move from demo data to a production-ready foundation.

Milestones:

- Finalize canonical data schema for clients, campaigns, ad performance, audiences, recommendations, action logs, and benchmark patterns.
- Set up Supabase/Postgres with production-safe migrations, environment variables, and health checks.
- Deploy frontend on Vercel and backend on Render.
- Add tenant-safe client boundaries so one client's raw data is never exposed to another.
- Add ingestion job tracking, schema drift logging, and data freshness checks.

Success criteria:

- Backend health checks pass.
- Dashboard loads from production database.
- No secrets in code.
- Each client's data is scoped by `client_id`.
- System can clearly show whether data is fresh, stale, or incomplete.

## Days 16-30: Read-Only Intelligence MVP

The next two weeks should create value without touching ad accounts. The system should ingest data, detect waste, and surface recommendations for human review.

Milestones:

- Connect one real read-only source first, preferably Shopify or Meta Ads.
- Keep synthetic/fallback data available for demos.
- Build hourly ingestion for ad performance and daily sync for historical order/customer data.
- Implement first version of Data Scout and Recommendation Engine.
- Generate recommendations for 3-5 high-confidence use cases:
  - exclude recent purchasers
  - suppress recent converters
  - flag high-frequency low-ROAS ad sets
  - identify audience overlap
  - detect stale or failed audience syncs

Success criteria:

- At least one real connector works end-to-end.
- Recommendations are generated from real ingested data.
- Every recommendation includes SQL evidence, expected impact, confidence score, risk level, and approval requirement.
- No automated execution yet.

## Days 31-45: RAG, Vector Search, and Evidence Quality

This phase makes the system explainable. The goal is not just to recommend actions, but to prove why each recommendation is reasonable.

Milestones:

- Enable pgvector in Supabase.
- Embed RAG documents such as campaign summaries, optimization history, benchmark descriptions, and playbooks.
- Add hybrid retrieval:
  - SQL metrics
  - vector search
  - keyword fallback
  - knowledge graph relationships
  - cross-client benchmark evidence
- Add LLM-generated public explanations using a cost-conscious model.
- Add evidence scoring and hallucination controls.

Success criteria:

- RAG search retrieves relevant historical and benchmark context.
- Recommendation detail page shows SQL evidence, vector evidence, graph evidence, and risk validation.
- LLM explains recommendations but does not make final execution decisions.
- Low-evidence recommendations are blocked or routed to human review.

## Days 46-60: Human-in-the-Loop Workflow

This phase turns recommendations into an operational workflow for the WasteNot team.

Milestones:

- Add approval queue for recommendations.
- Add Human Interface agent for summarizing decisions.
- Add risk thresholds:
  - low-risk recommendations can be approved quickly
  - medium-risk requires operator review
  - high-risk requires explicit human approval
- Add action simulation and rollback plans.
- Add audit trail for every approval, rejection, and execution attempt.

Success criteria:

- Operators can approve, reject, or request more evidence.
- Every decision is logged.
- Every executable action has a rollback plan.
- High-risk recommendations cannot bypass approval.

## Days 61-75: Limited Guarded Execution

This is where the system starts acting, but only in a narrow and safe way. The first execution use cases should be low-risk audience operations, not major budget changes.

Milestones:

- Connect one ad-platform execution path, preferably Meta audience upload or exclusion refresh.
- Support only low-risk actions first:
  - refresh exclusion audience
  - upload hashed customer audience
  - pause clearly stale audience sync
  - create draft recommendation for budget changes, but do not auto-apply budgets yet
- Add execution snapshots before every platform write.
- Add idempotency keys, retry logic, and rollback tracking.
- Add execution status monitoring.

Success criteria:

- One low-risk action can be executed safely after approval.
- The system stores before/after execution state.
- Failed writes are retried safely.
- Rollback is possible or clearly marked unavailable.
- Budget changes remain human-approved only.

## Days 76-90: Recursive Learning and Network Effects

The final phase should prove the intelligence layer improves over time. The system should learn from outcomes, not just generate recommendations.

Milestones:

- Measure recommendation outcomes after execution.
- Compare expected impact vs. actual impact.
- Update optimization history with actual lift, rollback status, and confidence changes.
- Create learning events from approved, rejected, executed, and rolled-back recommendations.
- Update cross-client benchmark confidence using aggregated, privacy-safe outcomes.
- Add strategy learning scores by brand category, spend band, platform, and action type.
- Add executive reporting on system performance.

Success criteria:

- The system can show which strategies are working across similar clients.
- Failed or rolled-back strategies reduce future confidence.
- Successful strategies improve benchmark confidence.
- The main success metric is tracked: incremental contribution-margin lift from accepted recommendations, net of rollbacks.

## What Should Be Working by Day 90

By the end of 90 days, the realistic production version should have:

- One or two real read-only data connectors.
- One guarded execution path for low-risk audience actions.
- A working recommendation queue.
- Hybrid SQL + vector + graph evidence retrieval.
- LLM-generated public explanations.
- Human approval and audit logging.
- Rollback planning.
- Outcome measurement.
- Cross-client benchmark learning using aggregated, privacy-safe patterns.

It should not yet promise full autonomous media buying. Budget changes, bid changes, and broad campaign restructuring should remain human-approved until the system has enough outcome history to prove safety.

The practical Day-90 goal is not "fully autonomous ad optimization." The practical goal is a trusted intelligence layer that reliably finds waste, explains recommendations, supports human decisions, safely executes narrow low-risk actions, and learns from every outcome.

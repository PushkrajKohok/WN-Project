# WasteNot Always-On Intelligence Layer

WasteNot Always-On Intelligence Layer is a full-stack take-home project that demonstrates how WasteNot could move from reactive, human-in-the-loop ad optimization to a continuous intelligence layer for finding wasted spend, explaining recommendations, enforcing guardrails, and learning from outcomes.

The app combines a Next.js command center, FastAPI backend, Supabase/Postgres schema, synthetic WasteNot data, recommendation workflows, RAG evidence, cross-client benchmark learning, action audit trails, recursive learning, and optional OpenAI-powered reasoning.

## What This Demonstrates

- Data ingestion controls for Shopify, Klaviyo, Meta, Google Ads, Snowflake, and Postgres-style data.
- A command center dashboard for spend, revenue, ROAS, CPA, risk, savings, ingestion health, and agent activity.
- A recommendation queue with expected savings, confidence, risk, approval status, and decision workflow.
- Recommendation detail pages with SQL evidence, RAG context, graph/benchmark support, risk validation, agent trace, and rollback planning.
- A six-agent operating model: Data Scout, Pattern Miner, Recommendation Engine, Evidence + Risk Grader, Human Interface, and Action Executor.
- Cross-client pattern exploration using anonymized benchmarks and knowledge graph edges.
- Guardrails for confidence thresholds, data freshness, benchmark support, privacy boundaries, and auto-execution constraints.
- Action log and rollback history for safe execution workflows.
- Recursive learning from approved, rejected, executed, and rolled-back outcomes.
- Submission documentation with architecture diagram, network-effects memo, realistic 90-day plan, deployment readiness, and implemented-vs-simulated clarity.

## Architecture Summary

The project uses **Agentic Graph-Hybrid RAG with Corrective RAG guardrails**.

- **Agentic RAG:** specialized agents scan, route, recommend, validate, escalate, and prepare actions.
- **Hybrid RAG:** SQL metrics, RAG documents, optional vector search, keyword fallback, and graph evidence are combined into a single evidence view.
- **GraphRAG-style context:** `cross_client_benchmarks` and `knowledge_graph_edges` model privacy-safe learning across similar clients.
- **Corrective RAG:** evidence quality, freshness, risk level, benchmark confidence, and guardrail compliance determine whether a recommendation can proceed.
- **Human boundary:** high-risk, low-confidence, stale-data, or rollback-unavailable decisions require human review.

## Tech Stack

| Layer | Stack |
| --- | --- |
| Frontend | Next.js, React, TypeScript, Tailwind CSS, Recharts, Lucide icons |
| Backend | FastAPI, Python, Pydantic, psycopg, OpenAI SDK, deterministic service fallbacks |
| Database | Supabase/Postgres-compatible schema, pgvector-ready embeddings table, RAG documents, benchmarks, graph edges, recommendation records, optimization history |
| Data | Synthetic CSV generator, ingestion CLI, manifest row counts, schema drift and freshness concepts |
| AI/RAG | SQL retrieval, keyword fallback, GraphRAG-style evidence, optional OpenAI embeddings and LLM public summaries |
| Deployment | Vercel frontend, Render FastAPI backend, Supabase Postgres |

## App Walkthrough

| Route | Purpose |
| --- | --- |
| `/data` | Data generation, ingestion controls, ingestion frequency, manifest row counts, and pipeline steps. |
| `/dashboard` | Intelligence command center for KPIs, savings, risk, ingestion health, and agent activity. |
| `/recommendations` | Recommendation queue with platform, risk, confidence, expected savings, and approval state. |
| `/recommendations/[id]` | Recommendation detail, evidence drawer, risk validation, agent trace, rollback plan, and LLM explanation button. |
| `/agents` | Agent Workbench with statuses, logs, run steps, scan controls, and optional LLM scan summary. |
| `/patterns` | Cross-client Pattern Explorer with anonymized benchmark and graph intelligence. |
| `/actions` | Action Log, execution simulation, rollback simulation, and audit history. |
| `/guardrails` | Approval rules, confidence thresholds, freshness rules, benchmark rules, privacy, and auto-execution constraints. |
| `/rag` | Hybrid RAG retrieval, vector readiness, evidence scoring, retrieval trace, and embedding rebuild controls. |
| `/learning` | Recursive learning loop, outcome measurement, strategy learning scores, and learning memory. |
| `/docs` | Executive submission docs, architecture diagram, network-effects memo, 90-day plan, deployment readiness, and implemented-vs-simulated table. |

## Local Setup

### 1. Install Frontend Dependencies

```bash
cd apps/web
npm install
```

### 2. Install Backend Dependencies

```bash
cd apps/api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Start Postgres

```bash
docker compose up -d postgres
```

### 4. Configure Environment

Use environment variables only. Do not commit real secrets.

```bash
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/wastenot
export NEXT_PUBLIC_API_URL=http://localhost:8000
export API_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
export ENVIRONMENT=development
export LOG_LEVEL=info
```

### 5. Initialize Schema

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

### 6. Generate and Ingest Synthetic Data

Generate CSVs:

```bash
python scripts/generate_wastenot_synthetic_data.py \
  --output-dir ./data/generated_default \
  --clients 60 \
  --customers-per-client 800 \
  --days 90 \
  --seed 42
```

Ingest CSVs:

```bash
python scripts/ingest_wastenot_data.py \
  --data-dir ./data/generated_default \
  --database-url "$DATABASE_URL" \
  --reset
```

Generate and ingest in one command:

```bash
python scripts/ingest_wastenot_data.py \
  --generate \
  --data-dir ./data/generated_default \
  --clients 60 \
  --customers-per-client 800 \
  --days 90 \
  --seed 42 \
  --database-url "$DATABASE_URL" \
  --reset
```

### 7. Run Backend

```bash
cd apps/api
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health checks:

```text
http://localhost:8000/health
http://localhost:8000/health/db
http://localhost:8000/health/readiness
```

### 8. Run Frontend

```bash
cd apps/web
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

Open:

```text
http://localhost:3000
```

## Optional OpenAI RAG/LLM Mode

The app supports optional OpenAI-powered vector RAG and LLM-assisted public summaries. This mode is controlled by backend environment variables and is disabled unless explicitly configured.

What it enables:

- `/llm/status` reports LLM/vector readiness without exposing secrets.
- `/admin/embeddings/rebuild` embeds missing `rag_documents` with OpenAI embeddings.
- `/rag/vector-search` searches Supabase pgvector embeddings.
- `/rag/hybrid-search` combines SQL, vector, keyword, graph, and benchmark evidence.
- `/recommendations/{id}/llm-explain` generates public recommendation explanations.
- `/agents/llm-scan-summary` generates public operational summaries.

Render backend variables:

```text
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_EMBEDDING_DIMENSIONS=1536
LLM_FEATURES_ENABLED=true
VECTOR_RAG_ENABLED=true
ADMIN_API_TOKEN=optional_admin_secret
```

For lower LLM cost, set:

```text
OPENAI_MODEL=gpt-4o-mini
```

Apply the non-destructive pgvector migration before rebuilding embeddings:

```bash
psql "$DATABASE_URL" -f db/migrations/001_enable_vector_rag.sql
```

Security boundary:

- Put `OPENAI_API_KEY` in Render only.
- Do not put the OpenAI key in Vercel.
- Vercel only needs `NEXT_PUBLIC_API_URL`.
- LLM outputs explain and summarize only; deterministic guardrails still control approval and execution.

## Implemented vs Simulated

| Implemented Now | Optional Live AI Mode | Simulated / Not Connected | Production Next |
| --- | --- | --- | --- |
| Next.js app shell | OpenAI client wrapper | Shopify/Klaviyo/Meta/Google live connectors | Real platform connectors |
| FastAPI backend | Configurable LLM model | Real ad-platform execution | OAuth/token refresh |
| Supabase/Postgres schema | pgvector embedding table and migration | Autonomous media buying | Background workers or cron |
| Synthetic generation and ingestion | Admin embedding rebuild endpoint | LangGraph-style orchestration | LangGraph or durable agent routing |
| Dashboard and recommendation queue | Vector search endpoint | Causal attribution | Auth and tenant isolation |
| Recommendation evidence drawer | Hybrid SQL/vector/keyword/graph search | Hourly production API sync | Idempotency and retry policies |
| Agent Workbench and public logs | LLM recommendation explanations | Production-grade job queue | Execution snapshots and audit retention |
| Pattern Explorer and graph benchmarks | LLM agent scan summaries | | Observability and alerting |
| Action Log, rollback history, guardrails | Token/cost audit log table | | |
| Learning Loop and Submission Docs | | | |

## Deployment Summary

- Frontend: Vercel, root directory `apps/web`.
- Backend: Render Web Service, root directory `apps/api`.
- Database: Supabase Postgres.
- Secrets: hosting-provider environment variables only.

Production values:

```text
NEXT_PUBLIC_API_URL=https://your-render-api-url
DATABASE_URL=your_supabase_database_url_here
API_CORS_ORIGINS=https://your-vercel-app.vercel.app
ENVIRONMENT=production
LOG_LEVEL=info
```

Detailed deployment instructions are in `docs/DEPLOYMENT.md`.

## Render Backend Settings

Use these exact Render settings:

| Setting | Value |
| --- | --- |
| Service type | Web Service |
| Root Directory | `apps/api` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health Check Path | `/health` |

Backend endpoints to test after deploy:

```text
https://YOUR_RENDER_URL/health
https://YOUR_RENDER_URL/health/db
https://YOUR_RENDER_URL/health/readiness
https://YOUR_RENDER_URL/dashboard/summary
```

After the Vercel frontend is deployed, update `API_CORS_ORIGINS` in Render to the final Vercel URL.

## Demo Flow

1. Open `/docs` to frame the project, architecture, network-effects memo, and roadmap.
2. Open `/data` to show ingestion frequency, synthetic data controls, manifest row counts, and pipeline steps.
3. Open `/dashboard` to show KPIs, risk, recommendations, ingestion health, and agent activity.
4. Open `/recommendations` and review the recommendation queue.
5. Open a recommendation detail page and show SQL, RAG, GraphRAG, risk, agent trace, and rollback evidence.
6. Open `/rag` to show hybrid retrieval, vector readiness, evidence scoring, and retrieval trace.
7. Open `/agents` and run an optimization scan.
8. Open `/patterns` to show privacy-safe cross-client intelligence.
9. Open `/actions` and simulate execution or rollback.
10. Open `/guardrails` and show approval rules.
11. Open `/learning` and run the learning loop.

## Testing and Validation

Backend checks:

```bash
cd apps/api
PYTHONPYCACHEPREFIX=/tmp/wastenot_pycache venv/bin/python -m compileall app
venv/bin/python -c "import app.main"
```

Frontend checks:

```bash
cd apps/web
npm run lint
npm run build
```

Backend smoke test:

```bash
cd apps/api
venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8015
curl http://127.0.0.1:8015/health
curl http://127.0.0.1:8015/health/db
curl http://127.0.0.1:8015/health/readiness
curl http://127.0.0.1:8015/dashboard/summary
```

Frontend route smoke test:

```bash
cd apps/web
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev -- --port 3015
```

Then open `/dashboard`, `/data`, `/recommendations`, `/agents`, `/patterns`, `/actions`, `/guardrails`, `/rag`, `/learning`, and `/docs`.

## Documentation

- `docs/ARCHITECTURE.md`
- `docs/NETWORK_EFFECTS_MEMO.md`
- `docs/ROADMAP_90_DAY.md`
- `docs/SUBMISSION_GUIDE.md`
- `docs/DEPLOYMENT.md`
- `docs/FINAL_CHECKLIST.md`
- `docs/KNOWN_LIMITATIONS.md`
- `docs/FUTURE_WORK.md`

## Submission Checklist

- [x] Data ingestion and context assembly explained.
- [x] Multi-agent topology explained.
- [x] RAG and reasoning layer explained.
- [x] Hallucination prevention and guardrails explained.
- [x] Network-effects memo included.
- [x] Realistic 90-day roadmap included.
- [x] Deployment plan included.
- [x] Implemented-vs-simulated boundary documented.
- [x] No real secrets committed.

## Known Limitations

- Real Shopify, Meta, Google Ads, and Klaviyo connectors are not implemented yet.
- No hourly production data sync is running yet.
- Real ad-platform execution is simulated.
- Budget changes, bid changes, and broad campaign restructuring remain human-approved future work.
- Agent orchestration is deterministic, not LangGraph-based.
- Optional OpenAI mode provides public explanations and vector retrieval only when configured.
- Production authentication, tenant isolation, job queues, execution snapshots, retries, and observability are future work.

## Production Next Steps

- Add one real read-only connector first, preferably Shopify or Meta Ads.
- Add scheduled ingestion through Render Cron, workers, or a queue.
- Apply the pgvector migration in Supabase and rebuild embeddings.
- Add OAuth/token refresh handling for real platform connectors.
- Add tenant isolation and authentication before real client data.
- Add guarded execution for one low-risk audience action.
- Add idempotency, retry policies, before/after snapshots, and rollback tracking.
- Add durable agent orchestration and production observability.

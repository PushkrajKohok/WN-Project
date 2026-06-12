# WasteNot Always-On Intelligence Layer

A full-stack take-home demo of an always-on multi-agent RAG intelligence layer for eCommerce ad optimization.

The project shows how WasteNot can move from reactive human-in-the-loop optimization to a continuous intelligence layer that ingests commerce and ad-platform data, finds wasted spend, explains recommendations with evidence, applies guardrails, simulates execution and rollback, and learns from outcomes.

## What This Demonstrates

- Continuous ingestion controls and synthetic WasteNot data.
- Multi-agent topology for scanning, pattern mining, recommendation, risk grading, human review, and execution.
- Recommendation queue with confidence, risk, expected impact, and approval workflow.
- SQL, RAG document, and GraphRAG-style evidence for recommendation detail.
- Cross-client pattern learning through anonymized benchmarks and graph edges.
- Corrective RAG guardrails for confidence, freshness, benchmark support, rollback, and approval rules.
- Simulated action execution and rollback history.
- Recursive learning loop that writes outcome memory, benchmark updates, and graph-weight updates.
- Executive memo, 90-day roadmap, deployment guide, and final submission checklist.

## Architecture Summary

The chosen architecture is **Agentic Graph-Hybrid RAG with Corrective RAG guardrails**.

- Agentic RAG: specialized agents continuously scan, route, recommend, validate, escalate, and execute.
- Hybrid RAG: structured SQL metrics are combined with deterministic document retrieval over `rag_documents`.
- GraphRAG-style context: `cross_client_benchmarks` and `knowledge_graph_edges` model privacy-safe cross-client learning.
- Corrective RAG: evidence quality, freshness, risk, benchmark confidence, and guardrail compliance determine whether action is safe.
- Human boundary: high-risk, low-confidence, stale-data, or rollback-unavailable decisions require review or are blocked.

## Tech Stack

| Layer | Stack |
| --- | --- |
| Frontend | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui-style local components, Recharts, Lucide icons |
| Backend | FastAPI, Python, Pydantic, psycopg, deterministic agent/RAG simulation |
| Database | Postgres/Supabase-compatible schema, RAG documents, benchmarks, graph edges, recommendation records, optimization history |
| Data | Synthetic CSV generator, ingestion CLI, zip extraction support, row count summaries |
| Deployment | Vercel frontend, Render/Railway/Fly.io backend, Supabase Postgres |

## App Pages

| Route | Purpose |
| --- | --- |
| `/data` | Generate and ingest synthetic data. |
| `/dashboard` | Intelligence command center. |
| `/recommendations` | Recommendation queue. |
| `/recommendations/[id]` | Evidence drawer and risk validation. |
| `/agents` | Agent Workbench. |
| `/patterns` | Cross-client Pattern Explorer. |
| `/actions` | Action Log and rollback history. |
| `/guardrails` | Approval and auto-execution settings. |
| `/rag` | Hybrid RAG retrieval and evidence scoring. |
| `/learning` | Recursive Learning Loop. |
| `/docs` | Take-home documentation and memo. |

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

Copy the example environment file:

```bash
cp .env.example .env
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/wastenot
```

Required variables:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/wastenot
NEXT_PUBLIC_API_URL=http://localhost:8000
API_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
ENVIRONMENT=development
LOG_LEVEL=info
```

### 5. Initialize Schema

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

### 6. Generate Synthetic Data

```bash
python scripts/generate_wastenot_synthetic_data.py --output-dir ./data/generated_default --clients 60 --customers-per-client 800 --days 90 --seed 42
```

If using the original generator file outside the repo root, the equivalent command is:

```bash
python generate_wastenot_synthetic_data.py --output-dir ./data/generated_default --clients 60 --customers-per-client 800 --days 90 --seed 42
```

### 7. Ingest Data

```bash
python scripts/ingest_wastenot_data.py --data-dir ./data/generated_default --database-url "$DATABASE_URL" --reset
```

You can also generate and ingest in one command:

```bash
python scripts/ingest_wastenot_data.py --generate --data-dir ./data/generated_default --clients 60 --customers-per-client 800 --days 90 --seed 42 --database-url "$DATABASE_URL" --reset
```

### 8. Run Backend

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

### 9. Run Frontend

```bash
cd apps/web
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

Open:

```text
http://localhost:3000
```

## Root Convenience Scripts

These scripts are optional helpers:

```bash
npm run db:up
npm run db:schema
npm run data:generate
npm run data:ingest
npm run dev:api
npm run dev:web
npm run typecheck
npm run lint
npm run build
```

Run `dev:api` and `dev:web` in separate terminals.

## Demo Flow

1. Open `/docs` to explain the project.
2. Open `/data` and show ingestion frequency plus synthetic data controls.
3. Open `/dashboard` and show KPIs.
4. Open `/recommendations` and review the recommendation queue.
5. Open a recommendation detail page and show SQL, RAG, GraphRAG, risk, and rollback evidence.
6. Open `/agents` and run an optimization scan.
7. Open `/patterns` to show network-effect intelligence.
8. Open `/actions` and simulate execution or rollback.
9. Open `/guardrails` and show approval settings.
10. Open `/rag` and run retrieval.
11. Open `/learning` and run the learning loop.

## Demo Script

"WasteNot currently ingests eCommerce and ad-platform data to reduce wasted spend. This demo shows how that evolves into an always-on intelligence layer. I start from Data & Ingestion Control, where synthetic Shopify/Klaviyo/Meta/Google-style data can be generated and ingested. The dashboard summarizes savings, risk, recommendations, and ingestion health. The recommendation queue shows optimization actions with confidence and risk. Opening a recommendation shows SQL evidence, RAG documents, cross-client benchmark support, risk validation, and rollback planning. The Agent Workbench makes the multi-agent process transparent: Data Scout detects issues, Pattern Miner retrieves patterns, Recommendation Engine proposes actions, Risk Grader validates evidence, Human Interface escalates decisions, and Action Executor simulates execution. Cross-Client Patterns demonstrates network effects through anonymized benchmarks. Guardrails control autonomy. RAG Retrieval shows hybrid evidence scoring. Learning Loop feeds outcomes back into memory, benchmarks, and graph relationships."

## Implemented vs Simulated

| Implemented | Simulated | Future Production Work |
| --- | --- | --- |
| Full app shell | Real ad-platform execution | Real Shopify/Klaviyo/Meta/Google connectors |
| Database schema | Real LLM agent orchestration | LangGraph or equivalent orchestration |
| Synthetic data ingestion | Real pgvector embeddings | pgvector embeddings and background jobs |
| Dashboard | Causal lift attribution | Auth and tenant isolation |
| Recommendations | Production auth/tenant isolation | Execution snapshots and idempotent API writes |
| Evidence detail | Live external API side effects | Observability and retry policies |
| Agent Workbench | | |
| Pattern Explorer | | |
| Action Log | | |
| Guardrails | | |
| RAG retrieval simulation | | |
| Learning Loop | | |
| Docs, memo, roadmap, deployment guide | | |

## Deployment Summary

- Frontend: Vercel, project root `apps/web`.
- Backend: Render, Railway, or Fly.io, service root `apps/api`.
- Database: Supabase Postgres.
- Credentials: added after implementation through hosting-provider environment variables only.

Production values:

```env
NEXT_PUBLIC_API_URL=https://your-api-service.onrender.com
DATABASE_URL=<Supabase pooled or direct Postgres connection string>
API_CORS_ORIGINS=https://your-vercel-app.vercel.app
ENVIRONMENT=production
LOG_LEVEL=info
```

Detailed deployment instructions are in `docs/DEPLOYMENT.md`.

## Render Backend Deployment

1. Create a new Render Web Service.
2. Connect the GitHub repo.
3. Set root directory to `apps/api`.
4. Build command:

```bash
pip install -r requirements.txt
```

5. Start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

6. Health check path:

```text
/health
```

7. Add environment variables:

```text
DATABASE_URL=<Supabase connection string>
API_CORS_ORIGINS=http://localhost:3000
ENVIRONMENT=production
LOG_LEVEL=info
```

8. Deploy.
9. Test:

```text
/health
/health/db
/health/readiness
/dashboard/summary
```

After the Vercel frontend is deployed later, update `API_CORS_ORIGINS` to the final Vercel URL.

## Testing and Validation

Recommended validation commands:

```bash
cd apps/api
PYTHONPYCACHEPREFIX=/tmp/wastenot_pycache python3 -m py_compile main.py app/core/config.py app/core/cors.py app/routes/health.py
```

```bash
cd apps/web
npm run typecheck
npm run lint
npm run build
```

Backend smoke test:

```bash
cd apps/api
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8015
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

## Submission Checklist

- [x] Data ingestion covered.
- [x] Multi-agent architecture covered.
- [x] RAG and reasoning covered.
- [x] Network-effects memo included.
- [x] 90-day roadmap included.
- [x] Deployment plan included.
- [x] README updated.
- [x] No secrets committed.
- [x] Local run instructions documented and tested where environment permits.

## Documentation

- `docs/ARCHITECTURE.md`
- `docs/NETWORK_EFFECTS_MEMO.md`
- `docs/ROADMAP_90_DAY.md`
- `docs/SUBMISSION_GUIDE.md`
- `docs/DEPLOYMENT.md`
- `docs/FINAL_CHECKLIST.md`
- `docs/KNOWN_LIMITATIONS.md`
- `docs/FUTURE_WORK.md`

## Known Limitations

- Real external APIs are not connected.
- Real embeddings are not active.
- Agent orchestration is simulated and deterministic.
- Production authentication and tenant isolation are not implemented.
- Production background jobs, execution snapshots, and live API idempotency are future work.

## Changelog

### Step 15 - Final polish and submission readiness

Files changed:

- `README.md`
- `docs/*`
- shared frontend components
- frontend documentation page
- backend health/config files from deployment readiness
- root scripts

Features added:

- Final demo script
- Final submission checklist
- UI consistency helper components
- Route/link cleanup guidance
- Health check validation guidance
- Documentation cleanup
- Implemented-vs-simulated clarity
- Credential placeholder guidance

Known issues:

- Real external APIs are not connected.
- Real embeddings are not active.
- Agent orchestration is simulated/deterministic.
- Production auth and tenant isolation are not implemented.

Next steps:

- Add real deployment credentials.
- Deploy backend.
- Deploy frontend.
- Connect Supabase.
- Test live URLs.
- Optionally add real LLM embeddings and orchestration.

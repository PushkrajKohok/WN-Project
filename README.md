# WasteNot Always-On Intelligence Layer

A polished full-stack demonstration of an always-on multi-agent RAG (Retrieval-Augmented Generation) intelligence layer for an AI-powered ad optimization platform. The system continuously ingests eCommerce and advertising data, runs a multi-agent workflow to scan client campaigns, targets, and audience sync status, compares performance against vertical benchmarks in a Knowledge Graph (GraphRAG), and surfaces optimization recommendations with Corrective RAG verification guardrails.

---

## Technical Architecture

The WasteNot Always-On Intelligence Layer implements four modern architectural paradigms to achieve high-accuracy, privacy-compliant ad recommendations:

```
                  ┌──────────────────────────────────────────────┐
                  │          eCommerce & Advertising API         │
                  │        (Shopify, Klaviyo, Meta, Google)      │
                  └──────────────────────┬───────────────────────┘
                                         │ Ingest & Sync
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │            Data Ingestion Engine             │
                  │   - CSV Parser (clients, orders, daily logs) │
                  │   - Schema Validator & Drift Detector        │
                  └──────────────────────┬───────────────────────┘
                                         │ Structured / Semantic
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │                 Database                     │
                  │     Postgres (Supabase) + pgvector (RAG)      │
                  └──────────────┬────────────────┬──────────────┘
                                 │                │
             Hybrid SQL / Vector │                │ Graph Edges
                                 ▼                ▼
                  ┌──────────────────────┐┌──────────────────────┐
                  │      Hybrid RAG      ││    Knowledge Graph   │
                  │   SQL Query Builder  ││  (GraphRAG edges matching│
                  │   + Vector Search    ││   cross-client lists)│
                  └──────────────┬───────┘└───────┬──────────────┘
                                 │                │
                                 ▼                ▼
                  ┌──────────────────────────────────────────────┐
                  │             Multi-Agent System               │
                  │ 1. Data Scout         2. Pattern Miner       │
                  │ 3. Rec Engine         4. Risk Grader         │
                  │ 5. Action Executor    6. Human Interface     │
                  └──────────────────────┬───────────────────────┘
                                         │ Validate
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │         Corrective RAG Guardrails            │
                  │   - Spend & Confidence Risk Valuation        │
                  │   - Automatic Rollback Strategy Handler      │
                  └──────────────────────┬───────────────────────┘
                                         │ Dispatch
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │          Polished Command Center             │
                  │       Next.js 16 Dashboard & Operations      │
                  └──────────────────────────────────────────────┘
```

1. **Agentic RAG**: A network of specialized AI agents working together:
   - **Data Scout**: Periodically scans client accounts, integrations, and daily campaign logs to find issues (e.g., stale audience syncs, falling CTRs).
   - **Pattern Miner**: Identifies network-effect insights by matching campaign shapes against anonymized cross-client benchmarks.
   - **Recommendation Engine**: Combines scout findings with historical playbooks to propose optimizations.
   - **Evidence & Risk Grader**: Runs Corrective RAG validation checks, checking the reliability of underlying database evidence before actioning.
   - **Action Executor**: Automatically updates ad campaigns for low-risk actions or queues high-risk ones.
   - **Human Interface**: Escalates budget-impacting or high-risk optimizations to human account managers.
2. **Graph-Hybrid RAG**: Combines the precision of relational SQL queries (for campaign trends), semantic similarity vector searches (for playbook resolution via `pgvector`), and structural networks (GraphRAG matching current actions against vertical benchmarks in `knowledge_graph_edges.csv`).
3. **Corrective RAG Guardrails**: Validation rules that grade recommendation reliability and check compliance settings (e.g. daily budget pause limits, confidence limits) before executing changes.
4. **Auto-Rollback Trigger**: Monitors campaigns post-optimization and automatically reverts configurations if key metrics (like CTR or ROAS) drop below a pre-configured threshold.

---

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Recharts (visual charts), Lucide Icons.
- **Backend**: FastAPI (Python 3.10+), Pydantic (data models), Uvicorn (ASGI server).
- **Database**: PostgreSQL (Supabase) with `pgvector` for document embeddings.
- **Mock Fallback**: Full client-side and server-side fallback datasets to ensure immediate app utility without requiring database connection strings.

---

## Folder Structure

```
WN-Project/
├── apps/
│   ├── web/                     # Next.js frontend app
│   │   ├── src/app/             # Next.js routing pages
│   │   └── src/lib/             # Frontend utility & mock databases
│   └── api/                     # FastAPI backend
│       ├── main.py              # Main router & stubs
│       └── mock_data.py         # Backend mock records
├── data/
│   └── sample/                  # Ingestion dataset CSV inputs
├── db/
│   └── schema.sql               # Database DDL schema for Postgres
├── scripts/
│   └── generate_wastenot_synthetic_data.py  # Script to generate synthetic data
├── docs/                        # Technical specifications & notes
└── README.md                    # Core repository documentation
```

---

## Local Setup Instructions

### Prerequisites
- Node.js (v18.0+)
- Python (v3.10+)
- Docker Desktop or another local Postgres instance (optional for database-backed mode)

### 1. Backend Setup (FastAPI)
Navigate to the api folder, set up a virtual environment, and install dependencies:
```bash
cd apps/api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Run the FastAPI developer server:
```bash
uvicorn main:app --reload --port 8000
```
The API documentation will be available at: http://localhost:8000/docs
Health check endpoint: http://localhost:8000/health

### 2. Database Setup

The app now supports real Postgres/Supabase ingestion while keeping mock fallback data when the database is unavailable.

Copy the example environment file and set `DATABASE_URL`:
```bash
cp .env.example .env
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/wastenot
```

For Supabase, use the pooled or direct Postgres connection string:
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
```

### 3. Local Postgres With Docker

Start Postgres:
```bash
docker compose up -d
```

Initialize the schema:
```bash
psql "$DATABASE_URL" -f db/schema.sql
```

The `docker-compose.yml` file creates:
- database: `wastenot`
- user: `postgres`
- password: `postgres`
- port: `5432`
- persistent volume: `wastenot-postgres-data`

### 4. Synthetic Data Generation And Ingestion

The repo includes the uploaded sample package under `data/wastenot_synthetic_sample_data` and the generator at `scripts/generate_wastenot_synthetic_data.py`.

Ingest the uploaded sample:
```bash
python scripts/ingest_wastenot_data.py \
  --data-dir ./data/wastenot_synthetic_sample_data \
  --database-url "$DATABASE_URL" \
  --reset
```

Generate first, then ingest:
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

Small demo ingestion:
```bash
python scripts/ingest_wastenot_data.py \
  --generate \
  --data-dir ./data/generated_small \
  --clients 10 \
  --customers-per-client 200 \
  --days 30 \
  --seed 7 \
  --database-url "$DATABASE_URL" \
  --reset
```

Verify rows loaded:
```bash
psql "$DATABASE_URL" -c "select job_id, status, row_counts from ingestion_jobs order by started_at desc limit 1;"
psql "$DATABASE_URL" -c "select count(*) from recommendation_records;"
```

### 5. Frontend Setup (Next.js)
Navigate to the web folder and install dependencies:
```bash
cd apps/web
npm install
```

Run the Next.js development server:
```bash
npm run dev
```
Open http://localhost:3000 to access the Dashboard.

The frontend reads `NEXT_PUBLIC_API_URL` and falls back to `http://localhost:8000`.

---

## Environment Variables

### Frontend (`apps/web/.env.local` or root `.env`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (`apps/api/.env`):
```env
DATABASE_URL=postgresql://postgres:your-supabase-password@db.supabase.co:5432/postgres
OPENAI_API_KEY=your-openai-api-key
```

`OPENAI_API_KEY` is reserved for future RAG/agent steps; this step does not call OpenAI APIs.

---

## Step 2 — Database Schema & Data Ingestion

### Data Mapping to the WasteNot Product Brief
- **Client Source Data**: `clients`, `products`, `customers`, `shopify_orders`, and `shopify_order_items` represent internal business context that the agents query to determine LTV and purchase cycle.
- **Ad Platform Integrations**: `ad_campaign_settings`, `ad_adsets`, and `ad_performance_daily` track daily advertising spend, clicks, impression shares, and conversions.
- **WasteNot intelligence and Outcomes**: `audience_segments`, `audience_memberships`, `recommendation_records`, and `optimization_history` store custom segmentation cohorts built by our engines and record the execution or rollback audit path of every automated action.
- **Cross-Client Patterns**: `cross_client_benchmarks` and `knowledge_graph_edges` power the GraphRAG framework, linking local campaigns to vertical average lifts.
- **RAG Context**: `rag_documents` acts as the document pool for semantic playbook matching.
- **Schema Drift & Data Quality**: `schema_versions` logs schema alterations across integrated customer accounts.

> [!NOTE]
> pgvector embeddings for `rag_documents` are scaffolded as an optional/commented property in `db/schema.sql` for implementation in later RAG retrieval steps.
> Real third-party API integrations (Shopify, Klaviyo, Meta, Google) are mocked at this stage.

---
---

## FastAPI Data Endpoints

- `POST /data/generate`: starts a background generator job and returns `job_id`.
- `POST /data/ingest`: starts a background ingestion job and returns `job_id`.
- `GET /data/jobs/{job_id}`: returns status, timestamps, row counts, and errors.
- `GET /data/manifest`: returns the latest ingestion job or sample `manifest.json`.
- `GET /settings/ingestion-frequency`: returns current ingestion cadence.
- `PATCH /settings/ingestion-frequency`: updates cadence settings.
- `GET /dashboard/summary`: returns database-backed KPIs when available.
- `GET /recommendations`: filters, sorts, and paginates `recommendation_records` with client and benchmark context.
- `GET /recommendations/facets`: returns filter values for clients, platforms, risk levels, statuses, and decision requirements.
- `GET /recommendations/summary`: returns queue totals, approval counts, high-risk counts, and estimated weekly savings.
- `GET /recommendations/{id}`: reads a single recommendation with benchmark/RAG context.
- `GET /recommendations/{id}/evidence`: returns SQL performance evidence, GraphRAG benchmark evidence, and RAG document chunks.
- `GET /recommendations/{id}/agent-trace`: returns public multi-agent step summaries.
- `GET /recommendations/{id}/risk-validation`: returns Corrective RAG confidence, risk, guardrail, and rollback checks.
- `GET /recommendations/{id}/rollback-plan`: returns rollback steps and related optimization history.
- `POST /recommendations/{id}/approve`, `/reject`, `/needs-more-evidence`: updates recommendation workflow status and records a public agent log.
- `GET /patterns`: reads `cross_client_benchmarks` and `knowledge_graph_edges`.
- `GET /actions`: reads `optimization_history`.
- `GET /agents/logs`: reads public `agent_logs` or generated public summaries.

The Data & Ingestion Control page calls these endpoints directly. If the API or database is unavailable, the UI keeps using local mock data so the demo remains navigable.

---

## Step 4 — Database-backed Intelligence Dashboard

The Intelligence Command Center at `/dashboard` is now the executive view for business impact, campaign performance health, active recommendations, high-risk alerts, agent activity, ingestion health, and cross-client benchmark signal.

The dashboard is powered by these database tables when `DATABASE_URL` is configured and data has been ingested:
- `clients`
- `ad_performance_daily`
- `recommendation_records`
- `optimization_history`
- `cross_client_benchmarks`
- `knowledge_graph_edges`
- `schema_versions`
- `ingestion_jobs`
- `agent_logs`

Before using the database-backed dashboard, generate and ingest data:
```bash
python scripts/ingest_wastenot_data.py \
  --generate \
  --data-dir ./data/generated_small \
  --clients 10 \
  --customers-per-client 200 \
  --days 30 \
  --seed 7 \
  --database-url "$DATABASE_URL" \
  --reset
```

Run the app:
```bash
cd apps/api && uvicorn main:app --reload --port 8000
cd apps/web && NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

Dashboard filters include client, platform (`All`, `Meta`, `Google`), and date window (`7`, `30`, `90` days). Changing any filter refetches summary KPIs, performance trend, risk distribution, and priority recommendations.

If the backend or database is unavailable, the dashboard stays usable in mock fallback mode and shows a small fallback badge. If the database exists but has no ingested rows, the page shows an empty state linking to Data & Ingestion Control.

This maps to the WasteNot brief by showing campaign performance scanning through `ad_performance_daily`, optimization recommendations through `recommendation_records`, cross-client patterns through `cross_client_benchmarks` and `knowledge_graph_edges`, agent transparency through `agent_logs`, and ingestion health through `ingestion_jobs` and `schema_versions`.

---

## Step 5 — Database-backed Recommendations Workflow

The `/recommendations` page is now backed by `recommendation_records` when `DATABASE_URL` is configured. It joins client names from `clients`, supporting benchmark context from `cross_client_benchmarks`, and writes decision activity to `agent_logs`.

The queue supports:
- Search by recommendation, evidence, client, type, platform, or campaign.
- Filters for client, platform, risk level, status, and decision requirement.
- Sorting by detected date, expected weekly savings, confidence, or risk.
- Summary cards for total recommendations, human approvals, high-risk items, estimated weekly savings, and items needing more evidence.
- Desktop table and mobile cards with consistent risk, status, decision, and platform badges.
- Approval, rejection, and more-evidence workflows with inline success/error feedback and refetch after each decision.

If the backend or database is unavailable, the page switches to demo fallback mode so review flows remain testable with mock recommendations.

The database decision values are stored as text labels (`human_approval` or `auto_execute_allowed`) to match the generated synthetic package and avoid losing workflow semantics during ingestion.

---

## Step 6 — Recommendation Detail & Evidence Drawer

The `/recommendations/[id]` page is now an evidence-centered operator review surface. It explains why a recommendation was generated, which data supports it, what cross-client patterns agree with it, which risk checks passed, and how rollback would work if execution underperforms.

The page is powered by:
- `recommendation_records` for the primary recommendation.
- `clients` for brand, category, spend band, and consent context.
- `ad_performance_daily` and `ad_campaign_settings` for SQL evidence and campaign settings.
- `cross_client_benchmarks` and `knowledge_graph_edges` for simulated GraphRAG evidence.
- `rag_documents` for deterministic RAG document retrieval by recommendation, client, or campaign.
- `guardrail_settings` for confidence and approval checks.
- `optimization_history` for rollback planning and related past actions.
- `agent_logs` for public workflow activity created by approve/reject/more-evidence decisions.

Evidence sections include SQL performance summary and recent trend, anonymized GraphRAG benchmark support, retrieved RAG document snippets, Corrective RAG risk validation, public agent trace, rollback plan, and related optimization history. Hidden chain-of-thought is not exposed; only public summaries, evidence snippets, confidence, risk, and operational logs are shown.

The detail page keeps the same approval, rejection, and request-more-evidence workflow as the recommendations queue. After each action, it refetches the detail payload and updates status, risk validation, agent trace, and the decision panel.

This maps to the WasteNot brief by combining structured retrieval, unstructured/RAG-style retrieval, cross-client pattern evidence, confidence/risk scoring, hallucination prevention through evidence validation, human escalation, and rollback readiness. Real embeddings, live LLM orchestration, and Meta/Google execution are still simulated or deferred.

---

## Step 7 — Agent Workbench / AI Operations Console

The `/agents` page is now a database-backed operational console for WasteNot's six-agent topology: Data Scout, Pattern Miner, Recommendation Engine, Evidence + Risk Grader, Action Executor, and Human Interface.

The workbench shows:
- Current agent status, health, current task, last seen time, completed task count, and open errors.
- Public agent logs with filters for agent, severity, and search text.
- Latest scan runs and run-step timelines.
- A current investigation panel with detected issue, involved agents, recommendation IDs, evidence summary, risk outcome, and next action.
- Public tool-call summaries for SQL performance scans, GraphRAG benchmark lookup, RAG document retrieval, guardrail validation, approval workflow, and execution queue.
- Failure recovery guidance for source retries, stale data blocks, high-risk escalation, rollback snapshots, and audit logging.

Run Scan is a deterministic simulation over shared memory tables. It creates an `agent_runs` row, `agent_run_steps`, public `agent_logs`, and in fallback mode a demo recommendation. With a database configured, the workbench is powered by `agent_logs`, `agent_runs`, `agent_run_steps`, `ingestion_jobs`, `recommendation_records`, `optimization_history`, `cross_client_benchmarks`, `knowledge_graph_edges`, `rag_documents`, `ad_performance_daily`, `schema_versions`, and `guardrail_settings`.

This maps to the WasteNot brief by showing multi-agent topology, a public communication protocol, shared memory through Postgres/RAG/graph tables, conflict and risk escalation, failure recovery, and human approval workflow. The page does not expose hidden chain-of-thought; it shows only public activity summaries, tool calls, evidence summaries, statuses, and decisions.

---

## App Pages & Routes

1. `/dashboard`: Database-backed command center showing KPIs, spend/revenue trend, active alerts, priority recommendations, agent activity, ingestion health, and cross-client signal.
2. `/recommendations`: database-backed optimization queue with summary cards, search, client/platform/risk/status/decision filters, sorting, and approve/reject/more-evidence workflows.
3. `/recommendations/[id]`: Evidence-centered recommendation detail with SQL performance evidence, GraphRAG benchmark support, RAG documents, risk validation, public agent trace, rollback plan, related history, and decision actions.
4. `/agents`: Database-backed AI operations console showing agent statuses, public logs, scan runs, current investigation, run-scan workflow, tool calls, and failure recovery.
5. `/data`: Ingestion frequency configuration bar, preset selector, and interactive pipeline runner.
6. `/patterns`: Cross-client vertical benchmarking metrics and knowledge graph relationship explorer.
7. `/actions`: Action audit logs and interactive manual rollback buttons.
8. `/guardrails`: Adjustable threshold sliders, compliance checklists, and editable execution list.

---

## Current Status & Roadmap

### Completed Features (Pass 1)
- [x] Monorepo codebase setup and package dependencies configured.
- [x] Polished dark theme style guides and glassmorphic animations.
- [x] Navigation sidebar app shell.
- [x] Dashboard KPI cards and 7-day Area Chart.
- [x] Recommendation queue listing with query search.
- [x] Deep dive recommendation details with multi-RAG validation tabs and step timeline logs.
- [x] Agent workbench control console and status activity panels.
- [x] Data frequency controls and synthetic presets generation module.
- [x] Network benchmarking indexer and Graph edge tracing panel.
- [x] Action rollback triggers and configuration state log audits.
- [x] Slider threshold controls and compliance lists.
- [x] FastAPI web server endpoints for routing requests.
- [x] Relational Supabase database schema matching the core datasets.
- [x] Database population schema and ingestion pipeline for uploaded synthetic CSV files.
- [x] FastAPI database-first endpoints with mock fallback.
- [x] Data & Ingestion UI connected to generation, ingestion, job status, manifest, and settings endpoints.

### Next Steps
- [x] Implement live database connection queries for dashboard summaries, recommendations, patterns, actions, and ingestion status.
- [x] Add database-backed recommendation queue filters, summary, and approval workflow.
- [x] Add recommendation detail evidence drawer with SQL, GraphRAG, RAG, risk validation, agent trace, and rollback plan.
- [x] Add Agent Workbench status board, public logs, run timeline, and deterministic Run Scan workflow.
- [ ] Connect the synthetic data generation CLI to the FastAPI background jobs queue.
- [x] Connect the synthetic data generation CLI to FastAPI background jobs.
- [ ] Integrate OpenAI LLM models to write real recommendation descriptions.
- [ ] Add LangGraph workflows to orchestrate active scanning cycles.
- [ ] Add RAG retrieval over `rag_documents`.
- [x] Add recommendation detail evidence drawer.
- [x] Add Agent Workbench live job logs.
- [ ] Add dashboard metric trend lines directly from database history.

### Known Issues

- pgvector embeddings are scaffolded but not generated yet.
- Agent reasoning is still simulated/public-summary based; hidden chain-of-thought is not exposed.
- Real Meta, Google, Shopify, and Klaviyo APIs are not connected yet.
- The local environment used for this pass did not have Docker or `psycopg` preinstalled, so database ingestion should be run after installing `apps/api/requirements.txt` and starting Postgres.

---

## Privacy & Synthetic Data Statement
To preserve advertiser confidentiality, client accounts are insulated in separate database tables. The RAG Pattern Miner is restricted to reading aggregated, anonymized vertical metrics (averages grouped across client categories and spend bands) rather than inspecting raw customer logs or transaction identifiers.

---

## Change Log

### Step 1: Foundation Setup (2026-06-10)
- **Files Changed**:
  - `apps/web/*`: Next.js initialization, TypeScript configurations, App Shell, global styles, pages.
  - `apps/api/*`: FastAPI app, router endpoints, mock dataset schemas.
  - `db/schema.sql`: DDL schema for PostgreSQL database setup.
  - `README.md`: Created detailed project explanation.
- **Features Added**: Initialized monorepo structure, built 8 UI pages with dark-mode dashboard styling, and configured API routing paths.
- **Known Issues**: Generation script integration is currently mock-only. Database calls fall back to local JSON modules.
- **Next Steps**: Validate local Next.js and FastAPI server runs, compile build commands.

### Step 2 — Database schema and ingestion pipeline (2026-06-10)
- **Files Changed**:
  - `db/schema.sql`
  - `scripts/ingest_wastenot_data.py`
  - `docker-compose.yml`
  - `.env.example`
  - `apps/api/app/db.py`
  - `apps/api/app/routes/data.py`
  - `apps/api/app/services/ingestion_service.py`
  - `apps/api/requirements.txt`
  - `README.md`
- **Features Added**:
  - Local Postgres setup (docker-compose.yml)
  - Postgres/Supabase-compatible schema
  - Synthetic CSV ingestion script (scripts/ingest_wastenot_data.py)
  - Ingestion job tracking (ingestion_jobs table)
  - Data generation endpoint
  - Data ingestion endpoint
  - Ingestion frequency persistence
- **Known Issues**:
  - RAG embeddings are not generated yet.
  - Agent reasoning is still simulated.
  - Frontend data page may still need full live job polling in the next step.
  - Real ad platform API actions are not connected.
- **Next Steps**:
  - Connect `/data` frontend page to real generate/ingest endpoints.
  - Show live ingestion job status and row counts.
  - Replace dashboard mock data with database-backed summary endpoint.

### Step 3 — Data & ingestion control UI connected end to end (2026-06-10)
- **Files Changed**:
  - `apps/web/src/app/data/page.tsx`
  - `apps/web/src/components/data/*`
  - `apps/web/src/app/agents/page.tsx`
  - `apps/web/src/lib/api.ts`
  - `apps/web/src/types/data.ts`
  - `apps/api/app/routes/data.py`
  - `apps/api/app/routes/settings.py`
  - `apps/api/app/routes/agents.py`
  - `apps/api/app/services/ingestion_service.py`
  - `apps/api/app/services/agent_log_service.py`
  - `apps/api/main.py`
  - `README.md`
- **Features Added**:
  - Refactored `/data` into reusable ingestion-frequency, generation, pipeline, manifest, and job-status components.
  - Added typed frontend API helpers for settings, generation, ingestion, manifest, dashboard summary, and agent logs.
  - Added backend settings and agents routers plus a shared public agent-log service with database persistence and in-memory fallback.
  - Connected generation polling, manifest row counts, pipeline step states, and `/agents` log refresh to the live backend.
  - Added graceful ingestion failure messaging when `DATABASE_URL` or `psycopg` is unavailable.
- **Verification**:
  - `python3 -m py_compile ...` passed for the updated FastAPI and ingestion files.
  - `npm run lint` passed.
  - `npm run build` passed after switching to an offline-safe font setup.
  - Verified `PATCH /settings/ingestion-frequency`, `POST /data/generate`, `GET /data/jobs/{job_id}`, `GET /data/manifest`, `GET /agents/logs`, and `GET /dashboard/summary` against a fresh local server.
- **Known Issues**:
  - `Load to Database` still fails until a real Postgres/Supabase `DATABASE_URL` is configured; the UI and public logs now surface that failure cleanly.
  - The in-app browser’s localhost automation is intermittently blocking direct navigation to alternate local ports, so the clean verification server is exposed at `http://localhost:3003` and the API at `http://127.0.0.1:8001`.

### Step 4 — Intelligence Command Center Dashboard (2026-06-10)
- **Files Changed**:
  - `apps/web/src/app/dashboard/page.tsx`
  - `apps/web/src/components/dashboard/*`
  - `apps/web/src/lib/api.ts`
  - `apps/web/src/types/dashboard.ts`
  - `apps/api/app/routes/dashboard.py`
  - `apps/api/app/services/dashboard_service.py`
  - `apps/api/app/routes/clients.py`
  - `apps/api/main.py`
  - `README.md`
- **Features Added**:
  - Database-backed dashboard KPIs
  - Performance trend chart
  - Priority recommendations preview
  - Agent activity preview
  - Ingestion health card
  - Cross-client signal card
  - Risk distribution summary
  - Client/platform/date filters
  - Empty state for no ingested data
  - Mock fallback mode
- **Known Issues**:
  - Detail evidence is now implemented, but embeddings are still not generated with pgvector.
  - RAG retrieval is deterministic over `rag_documents`, not semantic embedding search yet.
  - Agent workflows are still simulated/public-log based.
  - Real external ad platform APIs are not connected.
- **Next Steps**:
  - Build Agent Workbench live-style scan execution.
  - Add run-scan workflow that creates public agent activity and new recommendations.

### Step 5 — Database-backed Recommendations Workflow (2026-06-10)
- **Files Changed**:
  - `apps/api/app/routes/recommendations.py`
  - `apps/api/app/services/recommendation_service.py`
  - `apps/api/app/services/agent_log_service.py`
  - `apps/api/main.py`
  - `apps/web/src/app/recommendations/page.tsx`
  - `apps/web/src/components/recommendations/*`
  - `apps/web/src/types/recommendations.ts`
  - `apps/web/src/lib/api.ts`
  - `db/schema.sql`
  - `scripts/ingest_wastenot_data.py`
  - `README.md`
- **Features Added**:
  - Database-first recommendation list endpoint with filters, sorting, pagination, and mock fallback.
  - Recommendation facets and summary endpoints.
  - Approve, reject, and needs-more-evidence status update endpoints with public agent-log records.
  - Database-backed recommendations page with queue summary cards, filter bar, desktop table, mobile cards, modals, fallback badge, and empty states.
- **Known Issues**:
  - External ad platform execution is not connected; workflow actions update review status only.
  - Without `DATABASE_URL`, the page intentionally runs in demo fallback mode.

### Step 6 — Recommendation Detail and Evidence Drawer (2026-06-10)
- **Files Changed**:
  - `apps/web/src/app/recommendations/[id]/page.tsx`
  - `apps/web/src/components/recommendations/detail/*`
  - `apps/web/src/lib/api.ts`
  - `apps/web/src/types/evidence.ts`
  - `apps/web/src/types/recommendations.ts`
  - `apps/api/app/routes/recommendations.py`
  - `apps/api/app/services/recommendation_service.py`
  - `apps/api/app/services/evidence_service.py`
  - `apps/api/app/services/agent_log_service.py`
  - `apps/api/main.py`
  - `README.md`
- **Features Added**:
  - Database-backed recommendation detail payload.
  - SQL evidence section with performance summary, recent trend, and campaign settings.
  - GraphRAG benchmark evidence section using benchmarks and knowledge graph edges.
  - RAG document evidence section using deterministic retrieval over `rag_documents`.
  - Corrective RAG risk validation card.
  - Public agent trace timeline.
  - Rollback plan and related optimization history cards.
  - Approve, reject, and request-more-evidence actions from the detail page.
  - Error state and demo fallback mode.
- **Known Issues**:
  - Embeddings are still not generated with pgvector.
  - GraphRAG is simulated through `knowledge_graph_edges` and benchmarks, not a dedicated graph database.
  - Agent reasoning is public-summary based, not live LLM orchestration.
  - Real Meta/Google execution is not connected.
- **Next Steps**:
  - Build Cross-Client Pattern Explorer using benchmarks and knowledge graph edges.
  - Show network-effect intelligence and privacy-safe pattern sharing.

### Step 7 — Agent Workbench (2026-06-10)
- **Files Changed**:
  - `apps/web/src/app/agents/page.tsx`
  - `apps/web/src/components/agents/*`
  - `apps/web/src/lib/api.ts`
  - `apps/web/src/types/agents.ts`
  - `apps/api/app/routes/agents.py`
  - `apps/api/app/services/agent_service.py`
  - `apps/api/app/services/agent_log_service.py`
  - `apps/api/app/services/scan_simulation_service.py`
  - `apps/api/main.py`
  - `db/schema.sql`
  - `README.md`
- **Features Added**:
  - Agent status board for all six WasteNot agents.
  - Public agent logs with agent, severity, and search filters.
  - Agent run timeline and latest runs list.
  - Run Scan workflow with deterministic scan simulation.
  - Current investigation panel.
  - Data-backed scan summaries and optional recommendation generation.
  - Failure recovery explanation.
  - Public tool-call summary cards.
  - Agent logs connected to recommendation decisions and ingestion events.
- **Known Issues**:
  - Agent execution is simulated, not real LangGraph/CrewAI orchestration.
  - Real LLM reasoning is not connected.
  - External ad platform API execution is not connected.
  - pgvector embeddings are still not generated.
- **Next Steps**:
  - Build Cross-Client Pattern Explorer using benchmarks and knowledge graph edges.
  - Show network-effect intelligence and privacy-safe pattern sharing.

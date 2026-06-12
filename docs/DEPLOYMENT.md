# Deployment Guide

WasteNot is deployment-ready for a Vercel frontend, hosted FastAPI backend, and Supabase Postgres database. The demo remains production-aware without claiming real Meta, Google, Shopify, Klaviyo, or LLM orchestration integrations.

## Target Architecture

- Frontend: Vercel, rooted at `apps/web`
- Backend: Render, Railway, or Fly.io, rooted at `apps/api`
- Database: Supabase Postgres
- Optional data storage: Supabase Storage or a backend local volume for demo data

## Environment Variables

Local root `.env` values:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/wastenot
NEXT_PUBLIC_API_URL=http://localhost:8000
API_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
ENVIRONMENT=development
LOG_LEVEL=info
```

Vercel frontend:

```bash
NEXT_PUBLIC_API_URL=https://your-api-service.onrender.com
```

Render, Railway, or Fly.io backend:

```bash
DATABASE_URL=<Supabase pooled or direct Postgres connection string>
API_CORS_ORIGINS=https://your-vercel-app.vercel.app
ENVIRONMENT=production
LOG_LEVEL=info
```

Do not commit real secrets. Store production values in the hosting provider secret manager.

## Supabase Setup

1. Create a Supabase project.
2. Copy the Postgres connection string.
3. Use the direct connection for local scripts or the pooled connection for a hosted backend.
4. Initialize schema:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

5. Generate demo data:

```bash
python scripts/generate_wastenot_synthetic_data.py --output-dir ./data/generated_default --clients 60 --customers-per-client 800 --days 90 --seed 42
```

If using the original package generator outside the repo, run:

```bash
python generate_wastenot_synthetic_data.py --output-dir ./data/generated_default --clients 60 --customers-per-client 800 --days 90 --seed 42
```

6. Ingest demo data:

```bash
python scripts/ingest_wastenot_data.py --data-dir ./data/generated_default --database-url "$DATABASE_URL" --reset
```

7. Confirm key tables:

```sql
SELECT COUNT(*) FROM recommendation_records;
SELECT COUNT(*) FROM rag_documents;
SELECT COUNT(*) FROM cross_client_benchmarks;
```

pgvector is scaffolded but not required for the MVP. Real embeddings can be added later with a background embedding job.

## Render Backend

1. Create a new Web Service.
2. Connect the GitHub repo.
3. Set root directory to `apps/api`.
4. Set build command:

```bash
pip install -r requirements.txt
```

5. Set start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

6. Set health check path:

```text
/health
```

7. Add environment variables:

```bash
DATABASE_URL=<Supabase connection string>
API_CORS_ORIGINS=http://localhost:3000
ENVIRONMENT=production
LOG_LEVEL=info
```

8. Deploy.
9. Test:

```text
https://your-api.onrender.com/health
https://your-api.onrender.com/health/db
https://your-api.onrender.com/health/readiness
https://your-api.onrender.com/dashboard/summary
```

The included root `render.yaml` defines a Python web service with `rootDir: apps/api`. After the Vercel frontend is deployed later, update `API_CORS_ORIGINS` to the final Vercel URL.

## Railway Backend Alternative

1. Create a new Railway project.
2. Deploy from GitHub.
3. Set root directory to `apps/api`.
4. Add the same backend environment variables.
5. Set start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

6. Verify `/health`, `/health/db`, and `/health/readiness`.

## Fly.io Backend Alternative

Use `apps/api/Dockerfile` as the service image. Set secrets with `fly secrets set`:

```bash
fly secrets set DATABASE_URL="<Supabase connection string>"
fly secrets set API_CORS_ORIGINS="https://your-vercel-app.vercel.app"
fly secrets set ENVIRONMENT="production"
fly secrets set LOG_LEVEL="info"
```

Expose the app on the platform-provided `$PORT` or map to port `8000` depending on the Fly app configuration.

## Vercel Frontend

1. Create a new Vercel project.
2. Import the GitHub repo.
3. Set root directory to `apps/web`.
4. Add environment variable:

```bash
NEXT_PUBLIC_API_URL=https://your-api-service-url
```

5. Build command:

```bash
npm run build
```

6. Deploy.
7. Verify `/dashboard`, `/recommendations`, `/rag`, `/learning`, and `/docs`.
8. If CORS fails, update backend `API_CORS_ORIGINS` with the Vercel domain and redeploy the backend.

## Local Production-Like Run

Start database:

```bash
docker compose up -d postgres
```

Initialize schema:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

Generate and ingest:

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

Run backend:

```bash
cd apps/api
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Run frontend:

```bash
cd apps/web
npm run dev
```

Open:

```text
http://localhost:3000
```

## Health Checks

`GET /health`

```json
{
  "status": "ok",
  "service": "wastenot-api",
  "environment": "development",
  "version": "0.2.0"
}
```

`GET /health/db`

```json
{
  "status": "ok",
  "database": "connected"
}
```

If the database is unavailable:

```json
{
  "status": "degraded",
  "database": "unavailable",
  "message": "Database connection failed. Mock fallback may be used by frontend."
}
```

`GET /health/readiness` verifies app status, environment loading, database reachability, and key schema tables when a database is available.

## CORS Troubleshooting

- Local frontend defaults to `http://localhost:3000`.
- Local API defaults to `http://localhost:8000`.
- Set `API_CORS_ORIGINS` on the backend to the exact Vercel URL in production.
- Multiple origins should be comma-separated.
- Redeploy the backend after changing CORS origins.

## Production Safety Checklist

- Add authentication and tenant isolation before real client data.
- Store API keys in a secret manager.
- Use background workers for long ingestion and scans.
- Add retries and idempotency keys for ad-platform actions.
- Store before/after snapshots before execution.
- Use row-level security or strict tenant filters for client data.
- Enable pgvector embeddings for semantic search.
- Add a queue system like Celery, RQ, BullMQ, or managed worker queues.
- Add observability: logs, traces, and alerting.
- Rate-limit expensive endpoints.
- Use read replicas or materialized views for large dashboards.

## Real OpenAI RAG/LLM Mode

Add these variables to the Render backend only:

```text
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-5.4-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_EMBEDDING_DIMENSIONS=1536
LLM_FEATURES_ENABLED=true
VECTOR_RAG_ENABLED=true
ADMIN_API_TOKEN=optional_admin_secret
```

Do not add `OPENAI_API_KEY` to Vercel. Vercel only needs `NEXT_PUBLIC_API_URL` pointed at the Render backend.

Before using vector search, apply the non-destructive Supabase migration:

```bash
psql "$DATABASE_URL" -f db/migrations/001_enable_vector_rag.sql
```

Then call `/admin/embeddings/rebuild` with a small limit first. The endpoint skips unchanged documents by text hash and does not run in a background loop.

`gpt-5.4-mini` is the default cost-conscious model. If that model is unavailable for the account, change `OPENAI_MODEL` in Render. The backend will fail gracefully and will not automatically fall back to GPT-5.5.

SQL and graph evidence remain the source of truth. LLM endpoints provide public explanations and summaries only; they do not execute actions.

## Demo-Safe Boundaries

- Real ad-platform APIs are not connected.
- RAG can use real OpenAI embeddings when pgvector migration and Render env vars are configured; otherwise it falls back to deterministic keyword retrieval.
- Agent orchestration is deterministic and simulated, with optional LLM public summaries.
- Execution and rollback are simulated.
- The app is suitable for a take-home demo and production architecture review, not live ad account control.

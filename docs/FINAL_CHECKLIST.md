# Final Submission Checklist

## Local Run Checklist

- [ ] `docker compose up -d`
- [ ] Schema applied with `psql "$DATABASE_URL" -f db/schema.sql`
- [ ] Data generated
- [ ] Data ingested
- [ ] Backend started
- [ ] Frontend started
- [ ] `/dashboard` loads
- [ ] Recommendation detail loads
- [ ] Agent scan works
- [ ] RAG search works
- [ ] Learning cycle works

## Data Ingestion Checklist

- [ ] Synthetic generator writes CSV data
- [ ] Ingestion CLI supports `--generate`
- [ ] Ingestion CLI supports zip extraction
- [ ] Ingestion CLI supports `--reset`
- [ ] Row count summary is printed
- [ ] Ingestion job is recorded when database is available
- [ ] Missing `DATABASE_URL` fails with a readable message

## UI Checklist

- [ ] Sidebar includes all final pages
- [ ] Page headers are clear
- [ ] Cards and badges use consistent styling
- [ ] Loading states exist on database-backed pages
- [ ] Empty states explain the next action
- [ ] Error states do not crash the page
- [ ] Demo fallback mode is visible where mock data is used
- [ ] Tables and cards are responsive enough for demo review
- [ ] No dead links in the primary demo flow

## Backend Checklist

- [ ] FastAPI imports cleanly
- [ ] `/health` returns service status
- [ ] `/health/db` returns connected or degraded status
- [ ] `/health/readiness` returns app, environment, database, and schema checks
- [ ] Missing database configuration degrades gracefully
- [ ] Decimal/date/timestamp values serialize cleanly
- [ ] Empty tables do not crash endpoints
- [ ] CORS origins are environment-driven
- [ ] No external ad-platform API calls are made

## Documentation Checklist

- [ ] README explains the full submission
- [ ] `docs/ARCHITECTURE.md` explains architecture and data flow
- [ ] `docs/NETWORK_EFFECTS_MEMO.md` includes the required memo
- [ ] `docs/ROADMAP_90_DAY.md` includes the phased plan
- [ ] `docs/DEPLOYMENT.md` explains Vercel, backend hosting, and Supabase
- [ ] `docs/SUBMISSION_GUIDE.md` includes the demo script
- [ ] `docs/KNOWN_LIMITATIONS.md` is honest about simulation boundaries
- [ ] `docs/FUTURE_WORK.md` lists production next steps

## Deployment Checklist

- [ ] Vercel project root set to `apps/web`
- [ ] `NEXT_PUBLIC_API_URL` set in Vercel
- [ ] Backend deployed from `apps/api`
- [ ] `DATABASE_URL` set in backend hosting dashboard
- [ ] `API_CORS_ORIGINS` includes the Vercel URL
- [ ] Supabase schema initialized
- [ ] Demo data ingested into Supabase
- [ ] Hosted `/health` endpoint works
- [ ] Hosted frontend can call hosted backend

## Security/Secrets Checklist

- [ ] No real secrets in repo
- [ ] `.env` files ignored
- [ ] `.env.example` uses placeholders or local-only demo values
- [ ] README uses placeholders
- [ ] Credentials are added only in hosting dashboards
- [ ] Real client data requires auth and tenant isolation before use

"use client";

const targets = [
  ["Frontend deploy target", "Vercel"],
  ["Backend deploy target", "Render, Railway, or Fly.io"],
  ["Database target", "Supabase Postgres"],
  ["External APIs", "Not connected in demo"],
  ["RAG embeddings", "pgvector scaffolded; simulated retrieval active"],
  ["Agent execution", "Deterministic simulation with production-aware guardrails"],
];

export function DeploymentReadiness() {
  return (
    <section id="deployment" className="glass-card p-6">
      <h2 className="text-xl font-bold">Deployment Readiness</h2>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
        The submission is prepared for a Vercel frontend, hosted FastAPI backend, and Supabase Postgres database. The demo remains safe: external ad-platform APIs are not called, secrets stay in environment variables, and simulated execution is clearly labeled.
      </p>
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        {targets.map(([label, value]) => (
          <div key={label} className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
            <div className="text-xs uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>{label}</div>
            <div className="mt-2 text-sm font-semibold">{value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

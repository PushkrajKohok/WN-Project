"use client";

const columns = [
  {
    title: "Implemented Now",
    items: [
      "Next.js dashboard",
      "FastAPI backend",
      "Supabase/Postgres schema",
      "Synthetic data generation and ingestion",
      "Recommendations queue",
      "Evidence drawer",
      "Agent Workbench",
      "Pattern Explorer",
      "Action Log",
      "Guardrails",
      "Recursive learning loop",
      "Deployment docs and health checks",
    ],
  },
  {
    title: "Optional Live AI Mode",
    items: [
      "OpenAI client wrapper",
      "Configurable low-cost model setting",
      "pgvector embedding table and migration",
      "Admin-controlled embedding rebuild",
      "Vector search endpoint",
      "Hybrid SQL + vector + keyword + graph retrieval",
      "LLM recommendation explanations",
      "LLM agent scan summaries",
      "Token/cost audit log table",
    ],
  },
  {
    title: "Simulated",
    items: [
      "External Shopify/Meta/Google/Klaviyo connectors",
      "External Meta/Google execution",
      "Autonomous media buying",
      "LangGraph-style agent orchestration",
      "Causal attribution",
      "Scheduled hourly production ingestion",
      "Production-grade background job queue",
    ],
  },
  {
    title: "Production Next",
    items: [
      "Real platform connectors",
      "LangGraph orchestration",
      "Apply pgvector migration in Supabase",
      "Configure OpenAI env vars in Render",
      "Background workers",
      "Auth and tenant isolation",
      "API retry and idempotency",
      "Audit-compliant execution snapshots",
      "OAuth/token refresh handling",
    ],
  },
];

export function ImplementedVsSimulated() {
  return (
    <section className="glass-card p-6">
      <h2 className="text-xl font-bold">Implemented vs Simulated</h2>
      <p className="mt-3 max-w-4xl text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
        The app is intentionally honest about the boundary between built product surfaces, optional OpenAI-powered RAG mode, simulated ad-platform behavior, and production hardening still required before live client operations.
      </p>
      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-4">
        {columns.map((column) => (
          <div key={column.title} className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
            <h3 className="text-sm font-semibold">{column.title}</h3>
            <ul className="mt-3 space-y-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
              {column.items.map((item) => <li key={item}>- {item}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

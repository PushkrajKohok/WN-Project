"use client";

const columns = [
  {
    title: "Implemented",
    items: [
      "Next.js dashboard",
      "FastAPI backend",
      "Postgres schema",
      "Synthetic data generation and ingestion",
      "Recommendations queue",
      "Evidence drawer",
      "Agent Workbench",
      "Pattern Explorer",
      "Action Log",
      "Guardrails",
      "RAG retrieval simulation",
      "Recursive learning loop",
    ],
  },
  {
    title: "Simulated",
    items: [
      "External Meta/Google execution",
      "Real LLM orchestration",
      "Real embeddings/pgvector search",
      "Causal attribution",
      "Production-grade job queue",
    ],
  },
  {
    title: "Production Next",
    items: [
      "Real platform connectors",
      "LangGraph orchestration",
      "pgvector embeddings",
      "Background workers",
      "Auth and tenant isolation",
      "API retry and idempotency",
      "Audit-compliant execution snapshots",
    ],
  },
];

export function ImplementedVsSimulated() {
  return (
    <section className="glass-card p-6">
      <h2 className="text-xl font-bold">Implemented vs Simulated</h2>
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
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

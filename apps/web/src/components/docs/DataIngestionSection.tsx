"use client";

const groups = [
  ["Client source data", ["Shopify orders", "products", "customers", "customer hashes", "consent flags", "Klaviyo events"]],
  ["Ad platform data", ["Meta/Google campaign settings", "ad sets", "daily performance", "spend", "revenue", "CPA", "ROAS", "frequency"]],
  ["WasteNot-generated data", ["audience segments", "audience memberships", "recommendation records", "optimization history", "action logs", "rollback history"]],
  ["Cross-client patterns", ["anonymized benchmarks", "knowledge graph edges", "strategy learning scores", "recursive learning outcomes"]],
  ["RAG context", ["rag_documents", "learning memory docs", "campaign summaries", "benchmark summaries", "recommendation summaries"]],
];

export function DataIngestionSection() {
  return (
    <section id="data-ingestion" className="glass-card p-6">
      <h2 className="text-xl font-bold">Data Ingestion & Context Assembly</h2>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
        WasteNot ingests Shopify, Klaviyo, Meta, Google Ads, Snowflake, and Postgres-style data. The system builds targeting and exclusion recommendations to reduce wasted spend and improve contribution margin, evolving from reactive optimization into an always-on intelligence layer.
      </p>
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-5">
        {groups.map(([title, items]) => (
          <div key={title as string} className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
            <h3 className="text-sm font-semibold">{title}</h3>
            <ul className="mt-3 space-y-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
              {(items as string[]).map((item) => <li key={item}>- {item}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-5 text-sm" style={{ color: "var(--color-text-secondary)" }}>
        The default ingestion frequency is 1 hour: frequent enough to detect performance issues while avoiding noisy minute-by-minute decisions and unnecessary ad-platform API load. The `/data` page supports generation, ingestion, manifest row counts, frequency controls, and pipeline steps.
      </p>
    </section>
  );
}

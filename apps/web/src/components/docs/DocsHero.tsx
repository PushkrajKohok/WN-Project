"use client";

const cards = [
  ["Data Ingestion", "#data-ingestion", "Source mapping, cadence, and context assembly."],
  ["Multi-Agent Architecture", "#multi-agent", "Six-agent topology, shared memory, and escalation."],
  ["RAG Reasoning", "#rag-reasoning", "SQL, RAG documents, GraphRAG, and corrective scoring."],
  ["Network Effects", "#network-effects", "The required executive memo and privacy-safe learning loop."],
  ["Deployment Plan", "#roadmap", "90-day path from MVP to guarded execution."],
];

export function DocsHero() {
  return (
    <section className="glass-card p-6">
      <h1 className="text-3xl font-bold gradient-text">WasteNot Take-Home Submission</h1>
      <p className="mt-2 max-w-4xl text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
        An always-on multi-agent RAG intelligence layer for ad optimization, cross-client pattern learning, and safe recommendation execution.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-5">
        {cards.map(([title, href, text]) => (
          <a key={title} href={href} className="rounded-lg border p-4 transition-colors" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
            <div className="text-sm font-semibold">{title}</div>
            <p className="mt-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>{text}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

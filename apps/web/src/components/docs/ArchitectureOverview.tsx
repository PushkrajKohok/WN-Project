"use client";

export function ArchitectureOverview() {
  return (
    <section id="architecture" className="glass-card p-6">
      <h2 className="text-xl font-bold">Architecture Overview</h2>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
        The chosen architecture is Agentic Graph-Hybrid RAG with Corrective RAG guardrails. Agentic RAG handles continuous scanning, routing, recommendation, validation, and escalation. Hybrid RAG combines SQL metrics with deterministic document retrieval. GraphRAG uses cross-client benchmarks and relationship edges. Corrective RAG scores evidence quality and risk before action.
      </p>
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-5">
        {["Agentic RAG", "Hybrid RAG", "GraphRAG", "Corrective RAG", "Human Boundary"].map((item) => (
          <div key={item} className="rounded-lg border p-3 text-sm font-semibold" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>{item}</div>
        ))}
      </div>
    </section>
  );
}

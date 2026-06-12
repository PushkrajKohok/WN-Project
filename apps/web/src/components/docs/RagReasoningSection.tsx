"use client";

const layers = [
  ["SQL retrieval", "Campaign performance, spend, revenue, ROAS, CPA, orders, audience data, recommendation/action history."],
  ["RAG documents", "rag_documents table, source-record matching, keyword fallback, and optional pgvector embeddings."],
  ["GraphRAG", "cross_client_benchmarks, knowledge_graph_edges, similar clients, supported-by-benchmark relationships."],
  ["Corrective RAG", "Evidence score, freshness score, guardrail compliance, confidence threshold, and review-required decision."],
];

export function RagReasoningSection() {
  return (
    <section id="rag-reasoning" className="glass-card p-6">
      <h2 className="text-xl font-bold">RAG & Reasoning Layer</h2>
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
        {layers.map(([title, text]) => (
          <div key={title} className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="mt-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>{text}</p>
          </div>
        ))}
      </div>
      <p className="mt-5 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
        The `/rag` page shows hybrid retrieval, evidence scores, graph context, retrieval trace, vector-search status, and admin-controlled embedding rebuilds when OpenAI mode is configured. Hallucination prevention comes from structured evidence citations, benchmark sample/confidence thresholds, high-risk approval gates, evidence scoring, and rollback-aware execution boundaries.
      </p>
    </section>
  );
}

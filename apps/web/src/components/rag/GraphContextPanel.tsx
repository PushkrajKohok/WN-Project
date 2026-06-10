"use client";

import type { BenchmarkContext, GraphContext } from "@/types/rag";

export function GraphContextPanel({ graph, benchmarks }: { graph?: GraphContext; benchmarks: BenchmarkContext[] }) {
  const primary = benchmarks[0];
  return (
    <section className="glass-card p-5">
      <h2 className="text-sm font-semibold">GraphRAG Context</h2>
      {primary && (
        <div className="mt-4 rounded-lg border p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
          <div className="text-sm font-semibold">{primary.strategy || primary.benchmark_id}</div>
          <div className="mt-2 grid grid-cols-2 gap-3 text-xs md:grid-cols-4" style={{ color: "var(--color-text-secondary)" }}>
            <span>Confidence {(primary.confidence_score * 100).toFixed(0)}%</span>
            <span>Sample {primary.sample_size}</span>
            <span>Lift {(primary.avg_lift_pct * 100).toFixed(1)}%</span>
            <span>{primary.privacy_level}</span>
          </div>
        </div>
      )}
      <div className="mt-4 space-y-2">
        {(graph?.edges || []).slice(0, 6).map((edge, index) => (
          <div key={String(edge.edge_id || index)} className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
            {String(edge.relationship || "relationship")} / weight {String(edge.weight ?? "-")} / evidence {String(edge.evidence_count ?? "-")}
          </div>
        ))}
      </div>
    </section>
  );
}

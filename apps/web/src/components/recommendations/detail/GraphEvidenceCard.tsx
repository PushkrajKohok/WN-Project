"use client";

import { Network } from "lucide-react";
import type { GraphEvidence } from "@/types/evidence";

export function GraphEvidenceCard({ evidence }: { evidence: GraphEvidence }) {
  const benchmark = evidence.supporting_benchmark;
  return (
    <section className="glass-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Network size={16} style={{ color: "var(--color-accent)" }} />
        <h2 className="text-sm font-semibold">GraphRAG Evidence</h2>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
        Graph evidence is aggregated and anonymized. It shows which strategies worked for similar brands without exposing raw client data.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Benchmark" value={benchmark.benchmark_id || "N/A"} />
        <Metric label="Category" value={benchmark.brand_category || "N/A"} />
        <Metric label="Spend band" value={benchmark.monthly_ad_spend_band || "N/A"} />
        <Metric label="Similar clients" value={String(evidence.similar_client_count)} />
        <Metric label="Avg lift" value={`${(benchmark.avg_lift_pct * 100).toFixed(1)}%`} />
        <Metric label="Median lift" value={`${(benchmark.median_lift_pct * 100).toFixed(1)}%`} />
        <Metric label="Sample size" value={String(benchmark.sample_size)} />
        <Metric label="Confidence" value={`${(benchmark.confidence_score * 100).toFixed(0)}%`} />
      </div>
      <div className="mt-4 rounded-lg border p-3" style={{ background: "var(--color-bg-tertiary)", borderColor: "var(--color-border)" }}>
        <div className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>Strategy</div>
        <div className="mt-1 text-sm" style={{ color: "var(--color-text-primary)" }}>{benchmark.strategy}</div>
      </div>
      <div className="mt-4 space-y-2">
        {evidence.related_edges.map((edge, index) => (
          <div key={`${edge.relationship}-${index}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)" }}>
            <span>{edge.source_node_type} → {edge.target_node_type}</span>
            <span style={{ color: "var(--color-text-secondary)" }}>{edge.relationship} · weight {edge.weight.toFixed(2)} · {edge.evidence_count} refs</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3" style={{ background: "var(--color-bg-tertiary)", borderColor: "var(--color-border)" }}>
      <div className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{label}</div>
      <div className="mt-1 truncate text-sm font-semibold">{value}</div>
    </div>
  );
}

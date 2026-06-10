"use client";

import { GitBranch, Lightbulb, Lock, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { BenchmarkDetail, BenchmarkPattern } from "@/types/patterns";

export function BenchmarkDetailPanel({
  benchmark,
  detail,
  isLoading,
  onClose,
}: {
  benchmark?: BenchmarkPattern | null;
  detail?: BenchmarkDetail;
  isLoading: boolean;
  onClose: () => void;
}) {
  if (!benchmark) {
    return (
      <section className="glass-card p-5">
        <h2 className="text-sm font-semibold">Benchmark Detail</h2>
        <p className="mt-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Select a benchmark to inspect related recommendations, graph support, and privacy notes.
        </p>
      </section>
    );
  }

  const note = detail?.privacy_note || "This benchmark is aggregated and anonymized before it can influence recommendations.";

  return (
    <section className="glass-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">{benchmark.strategy}</h2>
          <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            {benchmark.brand_category} / {benchmark.monthly_ad_spend_band} / {benchmark.primary_metric}
          </p>
        </div>
        <button type="button" onClick={onClose} className="btn btn-secondary btn-sm" aria-label="Close benchmark detail">
          <X size={14} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <Metric label="Avg lift" value={`+${(benchmark.avg_lift_pct * 100).toFixed(1)}%`} />
        <Metric label="Confidence" value={`${(benchmark.confidence_score * 100).toFixed(0)}%`} />
        <Metric label="Sample" value={`${benchmark.sample_size}`} />
      </div>

      <div className="mt-4 rounded-lg border p-3" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Lock size={14} style={{ color: "var(--color-accent)" }} /> Privacy note
        </div>
        <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{note}</p>
      </div>

      <div className="mt-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Lightbulb size={15} style={{ color: "var(--color-warning)" }} /> Related recommendations
        </h3>
        <div className="mt-3 space-y-2">
          {isLoading && <div className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Loading recommendation links...</div>}
          {!isLoading && (detail?.related_recommendations || []).map((rec) => (
            <div key={rec.recommendation_id} className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)" }}>
              <div className="text-sm font-semibold">{rec.title}</div>
              <div className="mt-1 flex flex-wrap gap-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                <span>{rec.brand_name || "Anonymized brand"}</span>
                <span>{rec.target_platform || "Cross-platform"}</span>
                <span>{formatCurrency(rec.expected_weekly_savings)} weekly savings</span>
                <span>{(rec.confidence_score * 100).toFixed(0)}% confidence</span>
              </div>
            </div>
          ))}
          {!isLoading && (detail?.related_recommendations || []).length === 0 && (
            <div className="rounded-lg border p-3 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
              No recommendation records are linked to this benchmark yet.
            </div>
          )}
        </div>
      </div>

      <div className="mt-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <GitBranch size={15} style={{ color: "var(--color-accent)" }} /> Graph support
        </h3>
        <div className="mt-3 space-y-2">
          {(detail?.related_graph_edges || []).slice(0, 4).map((edge) => (
            <div key={edge.id} className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
              {edge.relationship} / weight {edge.weight.toFixed(2)} / evidence {edge.evidence_count}
            </div>
          ))}
          {(detail?.related_graph_edges || []).length === 0 && (
            <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Graph edges are shown when the database has direct benchmark relationships.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{label}</div>
    </div>
  );
}

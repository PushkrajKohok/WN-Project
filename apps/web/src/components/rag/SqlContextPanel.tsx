"use client";

import type { SqlContext } from "@/types/rag";

export function SqlContextPanel({ context }: { context?: SqlContext }) {
  const perf = context?.performance_summary || {};
  return (
    <section className="glass-card p-5">
      <h2 className="text-sm font-semibold">SQL Context</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Metric label="Spend" value={format(perf.spend)} />
        <Metric label="Revenue" value={format(perf.revenue)} />
        <Metric label="ROAS" value={format(perf.roas)} />
        <Metric label="CPA" value={format(perf.cpa)} />
        <Metric label="Purchases" value={format(perf.purchases)} />
      </div>
      <div className="mt-4 text-xs" style={{ color: "var(--color-text-secondary)" }}>
        Recent trend rows: {context?.recent_trend?.length || 0} / Related optimizations: {context?.optimization_history?.length || 0}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</div>
    </div>
  );
}

function format(value: unknown) {
  return value === undefined || value === null ? "-" : String(value);
}

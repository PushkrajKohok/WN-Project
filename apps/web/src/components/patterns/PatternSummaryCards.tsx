"use client";

import { GitBranch, Layers, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { PatternSummary } from "@/types/patterns";

export function PatternSummaryCards({ summary }: { summary: PatternSummary }) {
  const privacySafe = Object.values(summary.privacy_levels || {}).reduce((sum, value) => sum + value, 0);
  const cards = [
    ["Total benchmark patterns", formatNumber(summary.total_benchmarks), <Layers key="layers" size={18} />],
    ["Graph relationships", formatNumber(summary.total_graph_edges), <GitBranch key="graph" size={18} />],
    ["Average lift", `${(summary.avg_lift_pct * 100).toFixed(1)}%`, <TrendingUp key="lift" size={18} />],
    ["Average confidence", `${(summary.avg_confidence * 100).toFixed(0)}%`, <ShieldCheck key="conf" size={18} />],
    ["Total sample size", formatNumber(summary.total_sample_size), <Users key="users" size={18} />],
    ["Privacy-safe cohorts", formatNumber(privacySafe), <ShieldCheck key="privacy" size={18} />],
  ];
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
      {cards.map(([label, value, icon]) => (
        <div key={String(label)} className="glass-card p-4">
          <div style={{ color: "var(--color-accent)" }}>{icon}</div>
          <div className="mt-3 text-2xl font-bold">{value}</div>
          <div className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

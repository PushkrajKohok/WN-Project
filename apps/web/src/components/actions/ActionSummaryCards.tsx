"use client";

import { CheckCircle, Clock, RotateCcw, ShieldCheck, Sigma, TrendingUp } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { ActionSummary } from "@/types/actions";

export function ActionSummaryCards({ summary }: { summary: ActionSummary }) {
  const cards = [
    ["Total actions", formatNumber(summary.total_actions), <Sigma key="total" size={18} />],
    ["Executed", formatNumber(summary.executed), <CheckCircle key="executed" size={18} />],
    ["Pending review", formatNumber(summary.pending_review), <Clock key="pending" size={18} />],
    ["Rolled back", formatNumber(summary.rolled_back), <RotateCcw key="rollback" size={18} />],
    ["Rollback rate", `${(summary.rollback_rate * 100).toFixed(1)}%`, <ShieldCheck key="rate" size={18} />],
    ["Avg actual impact", `${(summary.actual_avg_impact_pct * 100).toFixed(1)}%`, <TrendingUp key="impact" size={18} />],
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

"use client";

import { BrainCircuit, FileText, GitBranch, RotateCcw, Target, TrendingUp } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { LearningSummary } from "@/types/learning";

export function LearningSummaryCards({ summary }: { summary: LearningSummary }) {
  const cards = [
    ["Learning events", summary.total_learning_events, <BrainCircuit key="events" size={18} />],
    ["Outcomes measured", summary.outcomes_measured, <Target key="outcomes" size={18} />],
    ["Positive outcomes", summary.successful_outcomes, <TrendingUp key="positive" size={18} />],
    ["Rolled back", summary.rolled_back_outcomes, <RotateCcw key="rollback" size={18} />],
    ["Strategies tracked", summary.strategies_tracked, <GitBranch key="strategies" size={18} />],
    ["RAG memories", summary.rag_docs_created, <FileText key="docs" size={18} />],
  ];
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
      {cards.map(([label, value, icon]) => (
        <div key={String(label)} className="glass-card p-4">
          <div style={{ color: "var(--color-accent)" }}>{icon}</div>
          <div className="mt-3 text-2xl font-bold">{formatNumber(Number(value))}</div>
          <div className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

"use client";

import { ShieldCheck } from "lucide-react";
import type { EvidenceScore } from "@/types/rag";

export function EvidenceScoreCard({ score }: { score?: EvidenceScore }) {
  if (!score) return null;
  const metrics = [
    ["SQL", score.sql_score],
    ["RAG", score.rag_score],
    ["Graph", score.graph_score],
    ["Freshness", score.freshness_score],
    ["Guardrails", score.guardrail_compliance ?? score.score_breakdown?.guardrail_compliance ?? 0],
  ];
  return (
    <section className="glass-card p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck size={18} style={{ color: "var(--color-accent)" }} /> Corrective Evidence Score</h2>
      <div className="mt-4 flex items-end gap-4">
        <div className="text-5xl font-bold">{(score.overall_score * 100).toFixed(0)}</div>
        <div className="pb-1">
          <div className="badge badge-accent">{score.decision.replace(/_/g, " ")}</div>
          <div className="mt-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>Review required: {score.review_required ? "yes" : "no"}</div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        {metrics.map(([label, value]) => (
          <div key={String(label)} className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
            <div className="text-lg font-semibold">{(Number(value) * 100).toFixed(0)}%</div>
            <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
        {(score.reasons || []).map((reason) => <div key={reason}>- {reason}</div>)}
      </div>
    </section>
  );
}

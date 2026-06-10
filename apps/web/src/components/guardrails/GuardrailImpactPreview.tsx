"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle, Eye, ShieldX } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { GuardrailImpactPreview as Impact } from "@/types/guardrails";

export function GuardrailImpactPreview({ impact }: { impact: Impact }) {
  const cards = [
    ["Auto-execute eligible", impact.auto_execute_eligible, <CheckCircle key="auto" size={18} />, "var(--color-success)"],
    ["Human approval required", impact.human_approval_required, <Eye key="approval" size={18} />, "var(--color-info)"],
    ["Needs more evidence", impact.needs_more_evidence, <AlertTriangle key="evidence" size={18} />, "var(--color-warning)"],
    ["Blocked by guardrails", impact.blocked_by_guardrails, <ShieldX key="blocked" size={18} />, "var(--color-danger)"],
  ];
  return (
    <section className="glass-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Guardrail Impact Preview</h2>
          <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>How current settings affect recommendation autonomy.</p>
        </div>
        <span className="badge badge-info">{formatNumber(impact.total_recommendations)} recommendations</span>
      </div>
      {impact.total_recommendations === 0 ? (
        <div className="mt-4 rounded-lg border p-6 text-center" style={{ borderColor: "var(--color-border)" }}>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>No recommendations available yet. Generate and ingest synthetic data first.</p>
          <Link href="/data" className="btn btn-primary mt-4">Go to Data & Ingestion Control</Link>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          {cards.map(([label, value, icon, color]) => (
            <div key={String(label)} className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
              <div style={{ color: String(color) }}>{icon}</div>
              <div className="mt-3 text-2xl font-bold">{formatNumber(Number(value))}</div>
              <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{label}</div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 grid grid-cols-1 gap-2 text-xs md:grid-cols-4" style={{ color: "var(--color-text-secondary)" }}>
        <span>High risk review: {impact.high_risk_blocked_or_review}</span>
        <span>Budget/pause review: {impact.budget_or_pause_review}</span>
        <span>Low confidence: {impact.low_confidence_review}</span>
        <span>Missing benchmark: {impact.missing_benchmark_review}</span>
      </div>
    </section>
  );
}

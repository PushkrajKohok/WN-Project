"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";
import { formatCurrency } from "@/lib/utils";
import type { RecommendationAction, RecommendationRecord } from "@/types/recommendations";
import { RecommendationDecisionPanel } from "../RecommendationDecisionPanel";
import { RecommendationStatusBadge } from "../RecommendationStatusBadge";

export function DecisionActionPanel({
  recommendation,
  isBusy,
  message,
  onAction,
}: {
  recommendation: RecommendationRecord;
  isBusy: boolean;
  message: { type: "success" | "error"; text: string } | null;
  onAction: (id: string, action: RecommendationAction, note?: string) => Promise<void>;
}) {
  return (
    <aside className="glass-card sticky top-6 p-5">
      <h2 className="text-sm font-semibold">Decision Panel</h2>
      <div className="mt-4 space-y-3">
        <PanelRow label="Status"><RecommendationStatusBadge value={recommendation.status} kind="status" /></PanelRow>
        <PanelRow label="Approval"><RecommendationStatusBadge value={recommendation.decision_required} kind="decision" /></PanelRow>
        <PanelRow label="Risk"><RecommendationStatusBadge value={recommendation.risk_level} kind="risk" /></PanelRow>
        <PanelRow label="Confidence"><span>{(recommendation.confidence_score * 100).toFixed(0)}%</span></PanelRow>
        <PanelRow label="Weekly savings"><span style={{ color: "var(--color-success)" }}>{formatCurrency(recommendation.expected_weekly_savings)}</span></PanelRow>
      </div>
      <div className="mt-5">
        <RecommendationDecisionPanel recommendation={recommendation} isBusy={isBusy} onAction={onAction} />
      </div>
      {message && (
        <div className="mt-4 flex gap-2 rounded-lg border p-3 text-sm" style={{
          background: message.type === "success" ? "var(--color-success-subtle)" : "var(--color-danger-subtle)",
          borderColor: message.type === "success" ? "var(--color-success)" : "var(--color-danger)",
          color: message.type === "success" ? "var(--color-success)" : "var(--color-danger)",
        }}>
          {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}
    </aside>
  );
}

function PanelRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span style={{ color: "var(--color-text-muted)" }}>{label}</span>
      <span className="font-semibold">{children}</span>
    </div>
  );
}

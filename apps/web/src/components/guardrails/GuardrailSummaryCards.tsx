"use client";

import { Clock, Lock, ShieldCheck, SlidersHorizontal, Zap } from "lucide-react";
import type { GuardrailSettings } from "@/types/guardrails";

export function GuardrailSummaryCards({ settings }: { settings: GuardrailSettings }) {
  const activeApprovals = [
    settings.high_risk_requires_approval,
    settings.medium_risk_requires_approval,
    settings.budget_changes_require_approval,
    settings.campaign_pause_requires_approval,
    settings.rollback_required_for_execution,
  ].filter(Boolean).length;
  const autoActions = [
    settings.auto_execute_low_risk_audience_refresh,
    settings.auto_execute_tracking_fix,
    settings.auto_execute_budget_shift,
    settings.auto_execute_campaign_pause,
  ].filter(Boolean).length;
  const cards = [
    ["Confidence threshold", `${(settings.confidence_threshold * 100).toFixed(0)}%`, <ShieldCheck key="confidence" size={18} />],
    ["Auto-execute threshold", `${(settings.auto_execute_confidence_threshold * 100).toFixed(0)}%`, <Zap key="auto" size={18} />],
    ["Approval rules active", `${activeApprovals}/5`, <SlidersHorizontal key="approval" size={18} />],
    ["Auto actions allowed", `${autoActions}/4`, <Zap key="actions" size={18} />],
    ["Privacy mode", settings.cross_client_privacy_mode.replace(/_/g, " "), <Lock key="privacy" size={18} />],
    ["Max staleness", `${settings.max_data_staleness_hours}h`, <Clock key="clock" size={18} />],
  ];
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
      {cards.map(([label, value, icon]) => (
        <div key={String(label)} className="glass-card p-4">
          <div style={{ color: "var(--color-accent)" }}>{icon}</div>
          <div className="mt-3 text-xl font-bold capitalize">{value}</div>
          <div className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

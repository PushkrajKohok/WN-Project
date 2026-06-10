"use client";

import { Zap } from "lucide-react";
import type { GuardrailSettings } from "@/types/guardrails";
import { Toggle } from "./ApprovalRulesCard";

const rules: Array<[keyof GuardrailSettings, string]> = [
  ["auto_execute_low_risk_audience_refresh", "Low-risk audience refresh"],
  ["auto_execute_tracking_fix", "Tracking fix"],
  ["auto_execute_budget_shift", "Budget shift"],
  ["auto_execute_campaign_pause", "Campaign pause"],
];

export function AutoExecutionRulesCard({ settings, onChange }: { settings: GuardrailSettings; onChange: (patch: Partial<GuardrailSettings>) => void }) {
  return (
    <section className="glass-card p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold"><Zap size={18} style={{ color: "var(--color-accent)" }} /> Auto-Execution Rules</h2>
      <div className="mt-4 space-y-3">
        {rules.map(([key, label]) => (
          <Toggle key={key} label={label} checked={Boolean(settings[key])} onChange={(checked) => onChange({ [key]: checked } as Partial<GuardrailSettings>)} />
        ))}
      </div>
      <p className="mt-4 text-xs" style={{ color: "var(--color-text-secondary)" }}>
        Campaign pauses and budget changes should remain human-approved in the MVP.
      </p>
    </section>
  );
}

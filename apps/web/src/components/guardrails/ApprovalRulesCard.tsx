"use client";

import { ShieldAlert } from "lucide-react";
import type { GuardrailSettings } from "@/types/guardrails";

const rules: Array<[keyof GuardrailSettings, string]> = [
  ["high_risk_requires_approval", "High risk requires approval"],
  ["medium_risk_requires_approval", "Medium risk requires approval"],
  ["budget_changes_require_approval", "Budget changes require approval"],
  ["campaign_pause_requires_approval", "Campaign pause requires approval"],
  ["rollback_required_for_execution", "Rollback required before execution"],
];

export function ApprovalRulesCard({ settings, onChange }: { settings: GuardrailSettings; onChange: (patch: Partial<GuardrailSettings>) => void }) {
  return (
    <section className="glass-card p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold"><ShieldAlert size={18} style={{ color: "var(--color-accent)" }} /> Approval Rules</h2>
      <div className="mt-4 space-y-3">
        {rules.map(([key, label]) => (
          <Toggle key={key} label={label} checked={Boolean(settings[key])} onChange={(checked) => onChange({ [key]: checked } as Partial<GuardrailSettings>)} />
        ))}
      </div>
    </section>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3" style={{ borderColor: checked ? "var(--color-accent)" : "var(--color-border)", background: checked ? "var(--color-accent-subtle)" : "var(--color-bg-tertiary)" }}>
      <span className="text-sm font-medium">{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

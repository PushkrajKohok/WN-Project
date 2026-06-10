"use client";

import { Clock } from "lucide-react";
import type { GuardrailSettings } from "@/types/guardrails";
import { Toggle } from "./ApprovalRulesCard";

export function DataFreshnessRulesCard({ settings, onChange }: { settings: GuardrailSettings; onChange: (patch: Partial<GuardrailSettings>) => void }) {
  return (
    <section className="glass-card p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold"><Clock size={18} style={{ color: "var(--color-accent)" }} /> Data Freshness</h2>
      <div className="mt-4 space-y-4">
        <Toggle label="Fresh data required" checked={settings.fresh_data_required} onChange={(checked) => onChange({ fresh_data_required: checked })} />
        <label className="block text-sm font-semibold">
          Max data staleness hours
          <input type="number" min={1} value={settings.max_data_staleness_hours} onChange={(event) => onChange({ max_data_staleness_hours: Number(event.target.value) })} className="mt-2 w-full rounded-lg border px-3 py-2 text-sm" style={fieldStyle} />
        </label>
      </div>
    </section>
  );
}

const fieldStyle = { background: "var(--color-bg-tertiary)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" };

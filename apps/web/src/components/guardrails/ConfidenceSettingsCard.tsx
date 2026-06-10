"use client";

import { DollarSign, Percent } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { GuardrailSettings } from "@/types/guardrails";

export function ConfidenceSettingsCard({ settings, onChange }: { settings: GuardrailSettings; onChange: (patch: Partial<GuardrailSettings>) => void }) {
  return (
    <section className="glass-card p-5 space-y-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold"><Percent size={18} style={{ color: "var(--color-accent)" }} /> Confidence Settings</h2>
      <Slider label="Minimum recommendation confidence" value={settings.confidence_threshold} onChange={(value) => onChange({ confidence_threshold: value })} />
      <Slider label="Auto-execute confidence threshold" value={settings.auto_execute_confidence_threshold} onChange={(value) => onChange({ auto_execute_confidence_threshold: value })} />
      <div>
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 font-semibold"><DollarSign size={14} /> Max auto-execute weekly savings</span>
          <span>{formatCurrency(settings.max_auto_execute_weekly_savings)}</span>
        </div>
        <input type="number" min={0} value={settings.max_auto_execute_weekly_savings} onChange={(event) => onChange({ max_auto_execute_weekly_savings: Number(event.target.value) })} className="w-full rounded-lg border px-3 py-2 text-sm" style={fieldStyle} />
      </div>
      <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
        Recommendations below the confidence threshold should request more evidence. Auto-execution requires a stricter confidence threshold.
      </p>
    </section>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-xs">
        <span className="font-semibold">{label}</span>
        <span>{(value * 100).toFixed(0)}%</span>
      </div>
      <input type="range" min="0" max="1" step="0.01" value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full" />
    </div>
  );
}

const fieldStyle = { background: "var(--color-bg-tertiary)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" };

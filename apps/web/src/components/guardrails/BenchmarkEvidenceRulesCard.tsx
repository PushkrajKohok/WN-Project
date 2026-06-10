"use client";

import { GitBranch } from "lucide-react";
import type { GuardrailSettings } from "@/types/guardrails";
import { Toggle } from "./ApprovalRulesCard";

export function BenchmarkEvidenceRulesCard({ settings, onChange }: { settings: GuardrailSettings; onChange: (patch: Partial<GuardrailSettings>) => void }) {
  return (
    <section className="glass-card p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold"><GitBranch size={18} style={{ color: "var(--color-accent)" }} /> Benchmark Evidence</h2>
      <div className="mt-4 space-y-4">
        <Toggle label="Require benchmark support" checked={settings.require_benchmark_support} onChange={(checked) => onChange({ require_benchmark_support: checked })} />
        <label className="block text-sm font-semibold">
          Minimum benchmark sample size
          <input type="number" min={1} value={settings.min_benchmark_sample_size} onChange={(event) => onChange({ min_benchmark_sample_size: Number(event.target.value) })} className="mt-2 w-full rounded-lg border px-3 py-2 text-sm" style={fieldStyle} />
        </label>
        <label className="block text-sm font-semibold">
          Minimum benchmark confidence
          <input type="number" min={0} max={1} step={0.01} value={settings.min_benchmark_confidence} onChange={(event) => onChange({ min_benchmark_confidence: Number(event.target.value) })} className="mt-2 w-full rounded-lg border px-3 py-2 text-sm" style={fieldStyle} />
        </label>
      </div>
      <p className="mt-4 text-xs" style={{ color: "var(--color-text-secondary)" }}>
        These controls prevent recommendations from relying on weak or irrelevant cross-client evidence.
      </p>
    </section>
  );
}

const fieldStyle = { background: "var(--color-bg-tertiary)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" };

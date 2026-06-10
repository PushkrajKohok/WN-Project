"use client";

import { AlertTriangle, CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import type { RiskValidation } from "@/types/evidence";

export function RiskValidationCard({ validation }: { validation: RiskValidation }) {
  return (
    <section className="glass-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck size={16} style={{ color: "var(--color-warning)" }} />
        <h2 className="text-sm font-semibold">Risk Validation</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Threshold" value={`${(validation.confidence_threshold * 100).toFixed(0)}%`} />
        <Metric label="Confidence" value={`${(validation.recommendation_confidence * 100).toFixed(0)}%`} />
        <Metric label="Freshness" value={validation.data_freshness_status} />
        <Metric label="Auto-execute" value={validation.auto_execute_allowed ? "Eligible" : "Blocked"} />
        <Metric label="Sample size" value={validation.sample_size_status} />
        <Metric label="Benchmark" value={validation.benchmark_quality} />
        <Metric label="Rollback" value={validation.rollback_available ? "Available" : "Partial"} />
        <Metric label="Decision" value={validation.decision_required.replace(/_/g, " ")} />
      </div>
      <div className="mt-4 space-y-2">
        {validation.validation_checks.map((check) => (
          <div key={check.check} className="flex gap-3 rounded-lg border p-3" style={{ borderColor: "var(--color-border)" }}>
            {iconFor(check.status)}
            <div>
              <div className="text-sm font-semibold">{check.check}</div>
              <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{check.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function iconFor(status: string) {
  if (status === "passed") return <CheckCircle2 size={18} style={{ color: "var(--color-success)" }} />;
  if (status === "failed") return <XCircle size={18} style={{ color: "var(--color-danger)" }} />;
  return <AlertTriangle size={18} style={{ color: "var(--color-warning)" }} />;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3" style={{ background: "var(--color-bg-tertiary)", borderColor: "var(--color-border)" }}>
      <div className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{label}</div>
      <div className="mt-1 truncate text-sm font-semibold">{value}</div>
    </div>
  );
}

"use client";

import { Layers } from "lucide-react";
import type { PipelineStep, PipelineStepStatus } from "@/types/data";

type Props = {
  steps: PipelineStep[];
};

function borderForStatus(status: PipelineStepStatus) {
  if (status === "completed") return "var(--color-success)";
  if (status === "running") return "var(--color-accent)";
  if (status === "failed") return "var(--color-danger)";
  if (status === "ready") return "var(--color-warning)";
  return "var(--color-border-subtle)";
}

export function IngestionPipelineSteps({ steps }: Props) {
  return (
    <section className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Layers size={18} style={{ color: "var(--color-accent)" }} />
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Ingestion Pipeline Status
        </h2>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => {
          const borderColor = borderForStatus(step.status);
          const badge =
            step.status === "completed"
              ? "✓"
              : step.status === "failed"
              ? "!"
              : String(index + 1);

          return (
            <div
              key={step.id}
              className="flex items-start gap-4 p-3 rounded-lg border transition-all"
              style={{
                background:
                  step.status === "running" ? "var(--color-bg-tertiary)" : "transparent",
                borderColor,
              }}
            >
              <div
                className="flex items-center justify-center w-6 h-6 rounded-full border text-xs font-bold shrink-0 mt-0.5"
                style={{
                  borderColor,
                  color:
                    step.status === "pending" ? "var(--color-text-muted)" : "white",
                  background:
                    step.status === "completed"
                      ? "var(--color-success)"
                      : step.status === "running"
                      ? "var(--color-accent)"
                      : step.status === "failed"
                      ? "var(--color-danger)"
                      : "transparent",
                }}
              >
                {badge}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{step.name}</span>
                  {step.status === "running" ? (
                    <span
                      className="text-[10px] uppercase tracking-wider font-bold animate-pulse"
                      style={{ color: "var(--color-accent)" }}
                    >
                      Running...
                    </span>
                  ) : step.status === "ready" ? (
                    <span
                      className="text-[10px] uppercase tracking-wider font-bold"
                      style={{ color: "var(--color-warning)" }}
                    >
                      Ready
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}


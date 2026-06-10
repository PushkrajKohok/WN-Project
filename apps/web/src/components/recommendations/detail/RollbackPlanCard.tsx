"use client";

import { RotateCcw } from "lucide-react";
import type { RollbackPlan } from "@/types/evidence";

export function RollbackPlanCard({ plan }: { plan: RollbackPlan }) {
  return (
    <section className="glass-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <RotateCcw size={16} style={{ color: "var(--color-info)" }} />
        <h2 className="text-sm font-semibold">Rollback Plan</h2>
        <span className={plan.rollback_available ? "badge badge-low" : "badge badge-medium"}>
          {plan.rollback_available ? "Available" : "Partial"}
        </span>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{plan.summary}</p>
      <ol className="mt-4 space-y-2">
        {plan.steps.map((step, index) => (
          <li key={step} className="flex gap-3 text-sm">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs" style={{ background: "var(--color-bg-tertiary)", color: "var(--color-accent)" }}>
              {index + 1}
            </span>
            <span style={{ color: "var(--color-text-secondary)" }}>{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

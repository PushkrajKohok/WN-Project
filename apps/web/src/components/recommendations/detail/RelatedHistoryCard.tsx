"use client";

import type { RelatedPastAction } from "@/types/evidence";

export function RelatedHistoryCard({ actions }: { actions: RelatedPastAction[] }) {
  return (
    <section className="glass-card p-5">
      <h2 className="text-sm font-semibold">Related Optimization History</h2>
      <div className="mt-4 space-y-2">
        {actions.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No related optimization history found.</p>
        ) : (
          actions.map((action) => (
            <div key={action.optimization_id} className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)" }}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold">{action.action_type}</span>
                <span className={action.rollback_flag ? "badge badge-medium" : "badge badge-low"}>
                  {action.rollback_flag ? "Rolled back" : action.status}
                </span>
              </div>
              <div className="mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                {action.optimization_id} · impact {(action.actual_impact_pct * 100).toFixed(1)}%
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

"use client";

import { Eye, PlayCircle, RotateCcw } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import type { OptimizationAction } from "@/types/actions";
import { ActionStatusBadge } from "./ActionStatusBadge";
import { RollbackBadge } from "./RollbackBadge";

export function canExecute(action: OptimizationAction) {
  return ["Generated", "Approved", "Pending Review"].includes(action.status);
}

export function canRollback(action: OptimizationAction) {
  return ["Executed", "Approved"].includes(action.status) && !action.rollback_flag;
}

export function ActionHistoryCard({
  action,
  onView,
  onExecute,
  onRollback,
}: {
  action: OptimizationAction;
  onView: (action: OptimizationAction) => void;
  onExecute: (action: OptimizationAction) => void;
  onRollback: (action: OptimizationAction) => void;
}) {
  return (
    <article className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{action.action_type}</h3>
          <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>{action.brand_name} / {action.target_platform} / {action.campaign_name || action.target_campaign_id}</p>
        </div>
        <ActionStatusBadge status={action.status} />
      </div>
      <p className="mt-3 line-clamp-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>{action.reason}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
        <Metric label="Expected" value={`${(action.expected_impact_pct * 100).toFixed(1)}%`} />
        <Metric label="Actual" value={action.actual_impact_pct == null ? "-" : `${(action.actual_impact_pct * 100).toFixed(1)}%`} />
        <Metric label="Confidence" value={`${(action.confidence_score * 100).toFixed(0)}%`} />
        <Metric label="Risk" value={action.risk_level} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{timeAgo(action.created_at)}</div>
        <RollbackBadge rollbackFlag={action.rollback_flag} status={action.status} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => onView(action)} className="btn btn-secondary btn-sm"><Eye size={13} /> View Details</button>
        <button type="button" onClick={() => onExecute(action)} disabled={!canExecute(action)} className="btn btn-secondary btn-sm"><PlayCircle size={13} /> Simulate Execute</button>
        <button type="button" onClick={() => onRollback(action)} disabled={!canRollback(action)} className="btn btn-secondary btn-sm"><RotateCcw size={13} /> Simulate Rollback</button>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-semibold">{value}</div>
      <div style={{ color: "var(--color-text-muted)" }}>{label}</div>
    </div>
  );
}

"use client";

import { Eye, PlayCircle, RotateCcw } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import type { OptimizationAction } from "@/types/actions";
import { ActionHistoryCard, canExecute, canRollback } from "./ActionHistoryCard";
import { ActionStatusBadge } from "./ActionStatusBadge";
import { RollbackBadge } from "./RollbackBadge";

export function ActionHistoryTable({
  items,
  onView,
  onExecute,
  onRollback,
}: {
  items: OptimizationAction[];
  onView: (action: OptimizationAction) => void;
  onExecute: (action: OptimizationAction) => void;
  onRollback: (action: OptimizationAction) => void;
}) {
  return (
    <section className="glass-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Action History</h2>
          <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            Generated, approved, executed, rejected, and rolled-back optimizations.
          </p>
        </div>
      </div>

      <div className="mt-4 hidden overflow-x-auto xl:block">
        <table className="data-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Client / Campaign</th>
              <th>Platform</th>
              <th>Agent</th>
              <th>Impact</th>
              <th>Confidence</th>
              <th>Risk</th>
              <th>Status</th>
              <th>Approved by</th>
              <th>Rollback</th>
              <th>Created</th>
              <th>Controls</th>
            </tr>
          </thead>
          <tbody>
            {items.map((action) => (
              <tr key={action.optimization_id}>
                <td className="max-w-[260px]">
                  <div className="font-semibold text-white">{action.action_type}</div>
                  <div className="mt-1 truncate text-xs" title={action.reason} style={{ color: "var(--color-text-muted)" }}>{action.reason}</div>
                </td>
                <td>
                  <div className="font-semibold">{action.brand_name}</div>
                  <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{action.campaign_name || action.target_campaign_id || "Campaign"}</div>
                </td>
                <td>{action.target_platform}</td>
                <td>{action.agent_name}</td>
                <td>
                  <div>Exp {(action.expected_impact_pct * 100).toFixed(1)}%</div>
                  <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Act {action.actual_impact_pct == null ? "-" : `${(action.actual_impact_pct * 100).toFixed(1)}%`}</div>
                </td>
                <td>{(action.confidence_score * 100).toFixed(0)}%</td>
                <td>{action.risk_level}</td>
                <td><ActionStatusBadge status={action.status} /></td>
                <td>{action.approved_by || "-"}</td>
                <td><RollbackBadge rollbackFlag={action.rollback_flag} status={action.status} /></td>
                <td>{timeAgo(action.created_at)}</td>
                <td>
                  <div className="flex flex-col gap-1">
                    <button type="button" onClick={() => onView(action)} className="btn btn-secondary btn-sm"><Eye size={13} /> View</button>
                    <button type="button" onClick={() => onExecute(action)} disabled={!canExecute(action)} className="btn btn-secondary btn-sm"><PlayCircle size={13} /> Execute</button>
                    <button type="button" onClick={() => onRollback(action)} disabled={!canRollback(action)} className="btn btn-secondary btn-sm"><RotateCcw size={13} /> Rollback</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 xl:hidden">
        {items.map((action) => (
          <ActionHistoryCard key={action.optimization_id} action={action} onView={onView} onExecute={onExecute} onRollback={onRollback} />
        ))}
      </div>

      {items.length === 0 && (
        <div className="mt-4 rounded-lg border p-8 text-center text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
          No optimization actions found. Generate and ingest synthetic data first.
        </div>
      )}
    </section>
  );
}

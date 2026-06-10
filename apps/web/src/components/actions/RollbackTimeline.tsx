"use client";

import type { ActionAuditEvent, OptimizationAction } from "@/types/actions";

const inferred = ["generated", "approved", "executed", "monitored", "rollback_available"];

export function RollbackTimeline({ action, events }: { action: OptimizationAction; events: ActionAuditEvent[] }) {
  const items = events.length
    ? events.map((event) => ({
        label: event.event_type.replace(/_/g, " "),
        status: event.event_status,
        message: event.message || event.actor || "Audit event recorded.",
        time: event.created_at,
      }))
    : inferred.map((label) => ({
        label: label.replace(/_/g, " "),
        status: inferStatus(label, action),
        message: inferMessage(label, action),
        time: action.created_at,
      }));

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex gap-3">
          <div className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: item.status === "completed" || item.status === "done" ? "var(--color-success)" : "var(--color-border)" }} />
          <div>
            <div className="text-sm font-semibold capitalize">{item.label}</div>
            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{item.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function inferStatus(label: string, action: OptimizationAction) {
  if (label === "generated") return "completed";
  if (label === "approved") return action.approved_by || ["Approved", "Executed", "Rolled Back"].includes(action.status) ? "completed" : "pending";
  if (label === "executed") return ["Executed", "Rolled Back"].includes(action.status) ? "completed" : "pending";
  if (label === "monitored") return ["Executed", "Rolled Back"].includes(action.status) ? "completed" : "pending";
  if (label === "rollback_available") return action.rollback_flag ? "completed" : "pending";
  return "pending";
}

function inferMessage(label: string, action: OptimizationAction) {
  if (label === "rollback_available" && action.rollback_flag) return "Rollback completed and recorded.";
  if (label === "rollback_available") return "Rollback path is attached when execution is eligible.";
  return `${action.action_type} ${label.replace(/_/g, " ")} state inferred from optimization history.`;
}

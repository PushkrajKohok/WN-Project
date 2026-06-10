"use client";

import { useEffect, useState } from "react";
import {
  RotateCcw,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { mockActions, type Action } from "@/lib/mock-data";
import { apiGet } from "@/lib/api";
import { timeAgo, getStatusColor } from "@/lib/utils";

export default function ActionLogPage() {
  const [actions, setActions] = useState<Action[]>(mockActions);

  useEffect(() => {
    apiGet<{ actions: Action[] }>("/actions", { actions: mockActions }).then((result) =>
      setActions(result.actions),
    );
  }, []);

  const handleRollback = (actionId: string) => {
    setActions((prev) =>
      prev.map((act) => {
        if (act.id === actionId) {
          return {
            ...act,
            status: "rolled_back",
            rollback_status: "rolled_back",
            rollback_reason: "Manual rollback triggered via Operations Console.",
          };
        }
        return act;
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold gradient-text">Action Log & Rollback History</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
          Track and revert automated and human-approved optimizations executed across campaign networks
        </p>
      </div>

      {/* Action Table */}
      <div className="glass-card p-5">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Action Target</th>
                <th>Client</th>
                <th>Channel / Type</th>
                <th>Triggered By</th>
                <th>Status</th>
                <th>Execution Details</th>
                <th>Rollback</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((act) => (
                <tr key={act.id}>
                  <td>
                    <div className="font-semibold text-white">{act.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                      {act.executed_at ? timeAgo(act.executed_at) : "Pending"}
                    </div>
                  </td>
                  <td style={{ color: "var(--color-text-secondary)" }}>{act.client_name}</td>
                  <td>
                    <span className="badge badge-accent">{act.type.replace(/_/g, " ")}</span>
                  </td>
                  <td>
                    <span className={`badge ${act.executed_by === "auto" ? "badge-low" : "badge-info"}`}>
                      {act.executed_by === "auto" ? "Autonomous Agent" : "Human Manager"}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusColor(act.status)}`}>
                      {act.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="max-w-[240px]">
                    {act.before_config && (
                      <div className="text-[10px] space-y-0.5">
                        <div style={{ color: "var(--color-text-secondary)" }}>
                          <span className="font-bold text-white uppercase">Before:</span>{" "}
                          {JSON.stringify(act.before_config)}
                        </div>
                        {act.after_config && (
                          <div style={{ color: "var(--color-text-secondary)" }}>
                            <span className="font-bold text-white uppercase">After:</span>{" "}
                            {JSON.stringify(act.after_config)}
                          </div>
                        )}
                        {act.rejection_reason && (
                          <div className="text-danger font-semibold">
                            Rejection Reason: {act.rejection_reason}
                          </div>
                        )}
                        {act.rollback_reason && (
                          <div className="text-info font-semibold">
                            Reverted Reason: {act.rollback_reason}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    {act.status === "executed" && act.rollback_status !== "rolled_back" && (
                      <button
                        onClick={() => handleRollback(act.id)}
                        className="btn btn-secondary btn-sm flex items-center gap-1"
                        style={{ color: "var(--color-danger)", borderColor: "var(--color-danger)" }}
                      >
                        <RotateCcw size={12} /> Rollback
                      </button>
                    )}
                    {act.status === "rolled_back" && (
                      <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--color-info)" }}>
                        <RotateCcw size={12} /> Rolled Back
                      </span>
                    )}
                    {act.status === "pending" && (
                      <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--color-warning)" }}>
                        <AlertTriangle size={12} /> Awaiting Sync
                      </span>
                    )}
                    {act.status === "rejected" && (
                      <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
                        <XCircle size={12} /> Excluded
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

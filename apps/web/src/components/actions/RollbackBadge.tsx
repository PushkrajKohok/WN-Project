"use client";

import { RotateCcw, ShieldCheck } from "lucide-react";

export function RollbackBadge({ rollbackFlag, status }: { rollbackFlag: boolean; status: string }) {
  if (rollbackFlag || status === "Rolled Back") {
    return (
      <span className="flex w-fit items-center gap-1 text-xs font-semibold" style={{ color: "var(--color-info)" }}>
        <RotateCcw size={12} /> Rolled back
      </span>
    );
  }
  if (status === "Executed" || status === "Approved") {
    return (
      <span className="flex w-fit items-center gap-1 text-xs font-semibold" style={{ color: "var(--color-success)" }}>
        <ShieldCheck size={12} /> Rollback ready
      </span>
    );
  }
  return <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Not needed</span>;
}

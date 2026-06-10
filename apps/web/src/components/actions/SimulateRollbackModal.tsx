"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { OptimizationAction } from "@/types/actions";

export function SimulateRollbackModal({
  action,
  isSubmitting,
  onClose,
  onConfirm,
}: {
  action?: OptimizationAction | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("Performance guardrail breached.");
  if (!action) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-lg border p-5" style={{ background: "var(--color-bg-primary)", borderColor: "var(--color-border)" }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Simulate Rollback</h2>
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm" aria-label="Close modal"><X size={14} /></button>
        </div>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          You are simulating rollback. This will mark the optimization as rolled back and create an audit event.
        </p>
        <textarea value={reason} onChange={(event) => setReason(event.target.value)} className="mt-4 h-28 w-full rounded-lg border p-3 text-sm" style={fieldStyle} />
        <button type="button" onClick={() => onConfirm(reason)} disabled={isSubmitting} className="btn btn-primary mt-4 w-full">
          Confirm Simulated Rollback
        </button>
      </div>
    </div>
  );
}

const fieldStyle = { background: "var(--color-bg-tertiary)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" };

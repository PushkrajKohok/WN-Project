"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import type { OptimizationAction } from "@/types/actions";

export function SimulateExecutionModal({
  action,
  isSubmitting,
  onClose,
  onConfirm,
}: {
  action?: OptimizationAction | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = useState("Simulated execution for demo.");
  if (!action) return null;
  return (
    <Modal title="Simulate Execution" onClose={onClose}>
      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
        You are simulating execution. No external ad platform API will be called.
      </p>
      <textarea value={note} onChange={(event) => setNote(event.target.value)} className="mt-4 h-28 w-full rounded-lg border p-3 text-sm" style={fieldStyle} />
      <button type="button" onClick={() => onConfirm(note)} disabled={isSubmitting} className="btn btn-primary mt-4 w-full">
        Confirm Simulated Execution
      </button>
    </Modal>
  );
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-lg border p-5" style={{ background: "var(--color-bg-primary)", borderColor: "var(--color-border)" }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm" aria-label="Close modal"><X size={14} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const fieldStyle = { background: "var(--color-bg-tertiary)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" };

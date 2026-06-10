"use client";

import { useState } from "react";
import type { RunLearningCycleRequest, RunLearningCycleResponse } from "@/types/learning";

export function RunLearningCyclePanel({ isLoading, result, onRun }: { isLoading: boolean; result?: RunLearningCycleResponse; onRun: (payload: RunLearningCycleRequest) => void }) {
  const [payload, setPayload] = useState<RunLearningCycleRequest>({ window_days: 30, client_id: "", mode: "standard" });
  return (
    <section className="glass-card p-5">
      <h2 className="text-sm font-semibold">Run Learning Cycle</h2>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="text-sm font-semibold">
          Measurement window days
          <input type="number" min={1} value={payload.window_days} onChange={(event) => setPayload({ ...payload, window_days: Number(event.target.value) })} className="mt-2 w-full rounded-lg border px-3 py-2 text-sm" style={fieldStyle} />
        </label>
        <label className="text-sm font-semibold">
          Client ID optional
          <input value={payload.client_id || ""} onChange={(event) => setPayload({ ...payload, client_id: event.target.value })} className="mt-2 w-full rounded-lg border px-3 py-2 text-sm" style={fieldStyle} />
        </label>
        <label className="text-sm font-semibold">
          Mode
          <select value={payload.mode} onChange={(event) => setPayload({ ...payload, mode: event.target.value as RunLearningCycleRequest["mode"] })} className="mt-2 w-full rounded-lg border px-3 py-2 text-sm" style={fieldStyle}>
            <option value="quick">quick</option>
            <option value="standard">standard</option>
            <option value="deep">deep</option>
          </select>
        </label>
      </div>
      <button type="button" onClick={() => onRun(payload)} disabled={isLoading} className="btn btn-primary mt-4">Run Learning Cycle</button>
      {result && (
        <div className="mt-4 rounded-lg border p-3 text-sm" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
          {result.summary} Events {result.learning_events_created}, outcomes {result.outcome_measurements_created}, RAG docs {result.rag_documents_created}.
        </div>
      )}
    </section>
  );
}

const fieldStyle = { background: "var(--color-bg-tertiary)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" };

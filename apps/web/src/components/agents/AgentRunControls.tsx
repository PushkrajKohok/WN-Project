"use client";

import { Play, RefreshCw } from "lucide-react";
import type { RunScanRequest, RunScanResponse } from "@/types/agents";
import type { ClientOption } from "@/types/dashboard";

export function AgentRunControls({
  clients,
  value,
  isRunning,
  lastResult,
  onChange,
  onRun,
}: {
  clients: ClientOption[];
  value: RunScanRequest;
  isRunning: boolean;
  lastResult: RunScanResponse | null;
  onChange: (value: RunScanRequest) => void;
  onRun: () => void;
}) {
  return (
    <section className="glass-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Run Scan Controls</h2>
          <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            Deterministic public scan across SQL performance, GraphRAG benchmarks, RAG context, guardrails, and approval readiness.
          </p>
        </div>
        <button onClick={onRun} disabled={isRunning} className="btn btn-primary">
          {isRunning ? <RefreshCw size={15} className="animate-spin" /> : <Play size={15} />}
          Run Optimization Scan
        </button>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <select className="rounded-lg border px-3 py-2 text-sm" style={selectStyle} value={value.client_id || "all"} onChange={(event) => onChange({ ...value, client_id: event.target.value === "all" ? null : event.target.value })}>
          <option value="all">All clients</option>
          {clients.map((client) => (
            <option key={client.client_id} value={client.client_id}>{client.brand_name}</option>
          ))}
        </select>
        <select className="rounded-lg border px-3 py-2 text-sm" style={selectStyle} value={value.platform} onChange={(event) => onChange({ ...value, platform: event.target.value })}>
          <option value="All">All platforms</option>
          <option value="Meta">Meta</option>
          <option value="Google">Google</option>
        </select>
        <select className="rounded-lg border px-3 py-2 text-sm" style={selectStyle} value={value.scan_depth} onChange={(event) => onChange({ ...value, scan_depth: event.target.value })}>
          <option value="quick">Quick</option>
          <option value="standard">Standard</option>
          <option value="deep">Deep</option>
        </select>
      </div>
      {lastResult && (
        <div className="mt-4 rounded-lg border p-3 text-sm" style={{ background: "var(--color-success-subtle)", borderColor: "var(--color-success)", color: "var(--color-success)" }}>
          {lastResult.summary}
        </div>
      )}
    </section>
  );
}

const selectStyle = {
  background: "var(--color-bg-tertiary)",
  borderColor: "var(--color-border)",
  color: "var(--color-text-primary)",
};

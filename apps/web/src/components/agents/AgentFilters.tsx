"use client";

import { Search } from "lucide-react";
import type { AgentLogFilters } from "@/types/agents";

const agents = ["all", "Data Scout", "Pattern Miner", "Recommendation Engine", "Evidence + Risk Grader", "Action Executor", "Human Interface"];
const severities = ["all", "info", "success", "warning", "error"];

export function AgentFilters({ filters, onChange }: { filters: AgentLogFilters; onChange: (filters: AgentLogFilters) => void }) {
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_190px_150px]">
      <label className="flex items-center gap-2 rounded-lg border px-3 py-2" style={{ background: "var(--color-bg-tertiary)", borderColor: "var(--color-border)" }}>
        <Search size={15} style={{ color: "var(--color-text-muted)" }} />
        <input
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder="Search public logs..."
          className="w-full bg-transparent text-sm outline-none"
        />
      </label>
      <select value={filters.agent_name} onChange={(event) => onChange({ ...filters, agent_name: event.target.value })} className="rounded-lg border px-3 py-2 text-sm" style={selectStyle}>
        {agents.map((agent) => <option key={agent} value={agent}>{agent === "all" ? "All agents" : agent}</option>)}
      </select>
      <select value={filters.severity} onChange={(event) => onChange({ ...filters, severity: event.target.value })} className="rounded-lg border px-3 py-2 text-sm" style={selectStyle}>
        {severities.map((severity) => <option key={severity} value={severity}>{severity === "all" ? "All severities" : severity}</option>)}
      </select>
    </div>
  );
}

const selectStyle = {
  background: "var(--color-bg-tertiary)",
  borderColor: "var(--color-border)",
  color: "var(--color-text-primary)",
};

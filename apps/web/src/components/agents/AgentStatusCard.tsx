"use client";

import { Activity, AlertCircle, CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";
import { timeAgo } from "@/lib/utils";
import type { AgentStatus } from "@/types/agents";

export function AgentStatusCard({ agent }: { agent: AgentStatus }) {
  return (
    <article className="glass-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{agent.agent_name}</h3>
          <p className="mt-1 min-h-10 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            {agent.current_task}
          </p>
        </div>
        <Activity size={18} style={{ color: "var(--color-accent)" }} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className={`badge ${statusClass(agent.status)}`}>{agent.status}</span>
        <span className={`badge ${agent.health === "healthy" ? "badge-low" : agent.health === "failed" ? "badge-high" : "badge-medium"}`}>
          {agent.health}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <Metric label="Tasks" value={String(agent.tasks_completed_today)} />
        <Metric label="Errors" value={String(agent.open_errors)} icon={agent.open_errors ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />} />
        <Metric label="Seen" value={timeAgo(agent.last_seen_at)} />
      </div>
    </article>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="rounded-lg border p-2" style={{ background: "var(--color-bg-tertiary)", borderColor: "var(--color-border)" }}>
      <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{label}</div>
      <div className="mt-1 flex items-center gap-1 font-semibold">{icon}{value}</div>
    </div>
  );
}

function statusClass(status: string) {
  if (status === "running") return "badge-info";
  if (status === "waiting") return "badge-medium";
  if (status === "failed") return "badge-high";
  if (status === "completed") return "badge-low";
  return "badge-muted";
}

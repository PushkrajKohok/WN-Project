"use client";

import Link from "next/link";
import { Terminal } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import type { AgentLog } from "@/types/agents";

export function AgentLogTimeline({ logs }: { logs: AgentLog[] }) {
  return (
    <section className="glass-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Terminal size={17} style={{ color: "var(--color-accent)" }} />
        <h2 className="text-sm font-semibold">Public Agent Logs</h2>
      </div>
      <div className="max-h-[420px] overflow-y-auto rounded-lg border p-3" style={{ background: "var(--color-bg-primary)", borderColor: "var(--color-border)" }}>
        {logs.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No logs match these filters.</p>
        ) : (
          logs.map((log) => (
            <div key={log.log_id} className="border-b py-3 last:border-b-0" style={{ borderColor: "var(--color-border-subtle)" }}>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold" style={{ color: colorFor(log.agent_name) }}>{log.agent_name}</span>
                <span className={`badge ${severityClass(log.severity)}`}>{log.severity}</span>
                <span style={{ color: "var(--color-text-muted)" }}>{timeAgo(log.created_at)}</span>
                {log.related_entity_type === "recommendation" && log.related_entity_id && (
                  <Link href={`/recommendations/${log.related_entity_id}`} className="hover:underline" style={{ color: "var(--color-accent)" }}>
                    {log.related_entity_id}
                  </Link>
                )}
              </div>
              <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{log.message}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function severityClass(severity: string) {
  if (severity === "success") return "badge-low";
  if (severity === "warning") return "badge-medium";
  if (severity === "error") return "badge-high";
  return "badge-info";
}

function colorFor(agent: string) {
  if (agent === "Data Scout") return "#3b82f6";
  if (agent === "Pattern Miner") return "#a855f7";
  if (agent === "Recommendation Engine") return "#6366f1";
  if (agent === "Evidence + Risk Grader") return "#f59e0b";
  if (agent === "Action Executor") return "#22c55e";
  return "#ef4444";
}

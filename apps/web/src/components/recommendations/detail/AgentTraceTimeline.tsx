"use client";

import { Clock } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import type { AgentTraceStep } from "@/types/evidence";

export function AgentTraceTimeline({ steps }: { steps: AgentTraceStep[] }) {
  return (
    <section className="glass-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Clock size={16} style={{ color: "var(--color-text-muted)" }} />
        <h2 className="text-sm font-semibold">Public Agent Trace</h2>
      </div>
      <div>
        {steps.map((step, index) => (
          <div key={`${step.step}-${step.agent_name}`} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="z-10 mt-1 h-3 w-3 rounded-full" style={{ background: colorFor(step.agent_name) }} />
              {index < steps.length - 1 && <div className="min-h-16 w-px flex-1" style={{ background: "var(--color-border)" }} />}
            </div>
            <div className="pb-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">{step.agent_name}</span>
                <span className="badge badge-info">{step.status}</span>
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {step.timestamp ? timeAgo(step.timestamp) : "recent"}
                </span>
              </div>
              <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{step.summary}</p>
              <div className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>{step.tool_used}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function colorFor(agent: string) {
  if (agent === "Data Scout") return "#3b82f6";
  if (agent === "Pattern Miner") return "#a855f7";
  if (agent === "Recommendation Engine") return "#6366f1";
  if (agent === "Evidence + Risk Grader") return "#f59e0b";
  if (agent === "Action Executor") return "#22c55e";
  return "#94a3b8";
}

"use client";

import { timeAgo } from "@/lib/utils";
import type { AgentRunDetail } from "@/types/agents";

export function AgentRunTimeline({ detail }: { detail: AgentRunDetail | null }) {
  if (!detail) return null;
  return (
    <section className="glass-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Latest Run Timeline</h2>
          <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>{detail.run.summary}</p>
        </div>
        <span className="badge badge-low">{detail.run.status}</span>
      </div>
      <div>
        {detail.steps.map((step, index) => (
          <div key={step.step_id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold" style={{ background: "var(--color-bg-tertiary)", color: "var(--color-accent)" }}>
                {step.step_order}
              </div>
              {index < detail.steps.length - 1 && <div className="min-h-14 w-px flex-1" style={{ background: "var(--color-border)" }} />}
            </div>
            <div className="pb-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">{step.agent_name}</span>
                <span className="badge badge-info">{step.tool_used}</span>
                <span className="badge badge-low">{step.status}</span>
                {step.completed_at && <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{timeAgo(step.completed_at)}</span>}
              </div>
              <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{step.public_summary}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

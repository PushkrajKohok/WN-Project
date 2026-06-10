"use client";

import Link from "next/link";
import { ArrowUpRight, Terminal } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import type { AgentActivityItem } from "@/types/dashboard";

type Props = {
  activity: AgentActivityItem[];
  isLoading: boolean;
};

export function AgentActivityPreview({ activity, isLoading }: Props) {
  return (
    <section className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Terminal size={18} style={{ color: "var(--color-accent)" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Latest Agent Activity
          </h2>
        </div>
        <Link href="/agents" className="text-xs flex items-center gap-1" style={{ color: "var(--color-accent)" }}>
          View Agent Workbench <ArrowUpRight size={12} />
        </Link>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-12 rounded-lg animate-pulse" style={{ background: "var(--color-bg-tertiary)" }} />
          ))
        ) : (
          activity.map((item, index) => (
            <div key={`${item.timestamp}-${index}`} className="flex items-start gap-3">
              <span className={`badge badge-${item.severity === "error" ? "high" : item.severity === "warning" ? "medium" : "info"}`}>
                {item.status}
              </span>
              <div className="min-w-0">
                <div className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {item.agent_name}
                </div>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                  {item.message}
                </p>
                <p className="text-[11px] mt-1" style={{ color: "var(--color-text-muted)" }}>
                  {timeAgo(item.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}


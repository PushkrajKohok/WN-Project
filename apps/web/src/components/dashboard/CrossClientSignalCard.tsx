"use client";

import Link from "next/link";
import { GitBranch } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { DashboardSummary } from "@/types/dashboard";

type Props = {
  summary: DashboardSummary;
};

export function CrossClientSignalCard({ summary }: Props) {
  return (
    <section className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <GitBranch size={18} style={{ color: "var(--color-accent)" }} />
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Cross-Client Signal
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <div className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            {formatNumber(summary.cross_client_patterns)}
          </div>
          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Benchmark patterns</div>
        </div>
        <div>
          <div className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            {formatNumber(summary.knowledge_graph_edges)}
          </div>
          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Graph edges</div>
        </div>
      </div>

      <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
        Aggregated cross-client patterns help identify which optimizations worked for similar brands without exposing raw client data.
      </p>

      <Link href="/patterns">
        <button className="btn btn-secondary w-full mt-5">Explore Patterns</button>
      </Link>
    </section>
  );
}


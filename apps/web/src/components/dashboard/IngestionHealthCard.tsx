"use client";

import Link from "next/link";
import { Database } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import type { DashboardSummary } from "@/types/dashboard";

type Props = {
  summary: DashboardSummary;
  frequencyLabel?: string;
};

export function IngestionHealthCard({ summary, frequencyLabel }: Props) {
  return (
    <section className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Database size={18} style={{ color: "var(--color-accent)" }} />
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Ingestion Health
        </h2>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between gap-3">
          <span style={{ color: "var(--color-text-secondary)" }}>Latest status</span>
          <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {summary.latest_ingestion_status || "Not available"}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span style={{ color: "var(--color-text-secondary)" }}>Latest run</span>
          <span style={{ color: "var(--color-text-primary)" }}>
            {summary.latest_ingestion_at ? timeAgo(summary.latest_ingestion_at) : "No job yet"}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span style={{ color: "var(--color-text-secondary)" }}>Schema drift</span>
          <span style={{ color: summary.schema_drift_open_items > 0 ? "var(--color-warning)" : "var(--color-success)" }}>
            {summary.schema_drift_open_items} open
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span style={{ color: "var(--color-text-secondary)" }}>Frequency</span>
          <span style={{ color: "var(--color-text-primary)" }}>{frequencyLabel || "1 Hour"}</span>
        </div>
      </div>

      <Link href="/data">
        <button className="btn btn-secondary w-full mt-5">Manage Ingestion</button>
      </Link>
    </section>
  );
}


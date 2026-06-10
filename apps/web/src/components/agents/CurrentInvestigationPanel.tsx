"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { CurrentInvestigation } from "@/types/agents";

export function CurrentInvestigationPanel({ investigation }: { investigation: CurrentInvestigation }) {
  if (investigation.empty) {
    return (
      <section className="glass-card p-5">
        <h2 className="text-sm font-semibold">Current Investigation</h2>
        <p className="mt-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>{investigation.message}</p>
      </section>
    );
  }

  const firstRecommendation = investigation.recommendation_ids?.[0];
  return (
    <section className="glass-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Current Investigation</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>{investigation.current_issue}</p>
        </div>
        <span className="badge badge-info">{investigation.run?.status || "active"}</span>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Info label="Evidence" value={investigation.evidence_summary || "No evidence summary yet."} />
        <Info label="Risk outcome" value={investigation.risk_outcome || "Pending validation."} />
        <Info label="Next action" value={investigation.next_action || "Run an optimization scan."} />
        <Info label="Agents involved" value={(investigation.agents_involved || []).join(", ")} />
      </div>
      {firstRecommendation && (
        <Link href={`/recommendations/${firstRecommendation}`} className="btn btn-secondary mt-4 inline-flex">
          Open related recommendation
          <ArrowUpRight size={13} />
        </Link>
      )}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)" }}>
      <div className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{label}</div>
      <div className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{value}</div>
    </div>
  );
}

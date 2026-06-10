"use client";

import { Database } from "lucide-react";
import type { ReactNode } from "react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { SqlEvidence } from "@/types/evidence";

export function SqlEvidenceCard({ evidence }: { evidence: SqlEvidence }) {
  const maxSpend = Math.max(...evidence.recent_trend.map((point) => point.spend), 1);
  return (
    <section className="glass-card p-5">
      <Header title="SQL Evidence" icon={<Database size={16} />} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Metric label="Spend" value={formatCurrency(evidence.campaign_performance.total_spend)} />
        <Metric label="Revenue" value={formatCurrency(evidence.campaign_performance.total_revenue)} />
        <Metric label="ROAS" value={`${evidence.campaign_performance.roas.toFixed(2)}x`} />
        <Metric label="CPA" value={formatCurrency(evidence.campaign_performance.cpa)} />
        <Metric label="Purchases" value={formatNumber(evidence.campaign_performance.purchases)} />
        <Metric label="Frequency" value={evidence.campaign_performance.avg_frequency.toFixed(2)} />
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Recent trend</h3>
        <div className="mt-3 flex h-32 items-end gap-1 rounded-lg border p-3" style={{ background: "var(--color-bg-primary)", borderColor: "var(--color-border)" }}>
          {evidence.recent_trend.length === 0 ? (
            <p className="self-center text-sm" style={{ color: "var(--color-text-muted)" }}>No daily trend rows found.</p>
          ) : (
            evidence.recent_trend.map((point) => (
              <div key={point.date} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-sm" style={{ height: `${Math.max((point.spend / maxSpend) * 92, 8)}px`, background: "var(--color-accent)" }} />
                <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{point.date.slice(5)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Metric label="Campaign" value={evidence.campaign_settings.campaign_name || "Portfolio"} />
        <Metric label="Objective" value={evidence.campaign_settings.objective || "N/A"} />
        <Metric label="Status" value={evidence.campaign_settings.status || "unknown"} />
        <Metric label="Daily budget" value={formatCurrency(evidence.campaign_settings.daily_budget || 0)} />
        <Metric label="Bid strategy" value={evidence.campaign_settings.bid_strategy || "N/A"} />
        <Metric label="Attribution" value={evidence.campaign_settings.attribution_window || "N/A"} />
      </div>
    </section>
  );
}

function Header({ title, icon }: { title: string; icon: ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span style={{ color: "var(--color-info)" }}>{icon}</span>
      <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{title}</h2>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3" style={{ background: "var(--color-bg-tertiary)", borderColor: "var(--color-border)" }}>
      <div className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{label}</div>
      <div className="mt-1 truncate text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{value}</div>
    </div>
  );
}

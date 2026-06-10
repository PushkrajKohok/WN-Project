"use client";

import type { RiskDistributionItem } from "@/types/dashboard";

type Props = {
  items: RiskDistributionItem[];
};

const colorByRisk: Record<string, string> = {
  Low: "var(--color-success)",
  Medium: "var(--color-warning)",
  High: "var(--color-danger)",
};

export function RiskDistributionCard({ items }: Props) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="glass-card p-5">
      <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>
        Risk Distribution
      </h2>

      <div className="space-y-4">
        {items.map((item) => {
          const pct = total > 0 ? (item.count / total) * 100 : 0;
          return (
            <div key={item.risk_level}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span style={{ color: "var(--color-text-secondary)" }}>{item.risk_level}</span>
                <span style={{ color: "var(--color-text-primary)" }}>{item.count}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-bg-tertiary)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: colorByRisk[item.risk_level] || "var(--color-accent)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}


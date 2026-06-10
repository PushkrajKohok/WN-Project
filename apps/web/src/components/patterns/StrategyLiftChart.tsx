"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { StrategyLiftItem } from "@/types/patterns";

export function StrategyLiftChart({ items }: { items: StrategyLiftItem[] }) {
  const data = items.map((item) => ({ ...item, liftLabel: item.strategy.slice(0, 28), liftPct: item.avg_lift_pct * 100 }));
  if (data.length === 0) {
    return (
      <section className="glass-card p-5">
        <h2 className="text-sm font-semibold">Top Strategy Lift</h2>
        <div className="mt-4 rounded-lg border p-8 text-center text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
          No strategy lift data matches the current filters.
        </div>
      </section>
    );
  }
  return (
    <section className="glass-card p-5">
      <h2 className="text-sm font-semibold">Top Strategy Lift</h2>
      <div className="mt-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 24 }}>
            <CartesianGrid stroke="var(--color-border)" horizontal={false} />
            <XAxis type="number" tick={{ fill: "var(--color-text-muted)", fontSize: 12 }} />
            <YAxis dataKey="liftLabel" type="category" width={150} tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }} />
            <Tooltip contentStyle={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} formatter={(value, name, props) => {
              const payload = props.payload as StrategyLiftItem;
              return [`${Number(value).toFixed(1)}% | sample ${payload.sample_size} | confidence ${(payload.avg_confidence * 100).toFixed(0)}% | ${payload.benchmark_count} benchmarks`, "Avg lift"];
            }} />
            <Bar dataKey="liftPct" fill="var(--color-accent)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

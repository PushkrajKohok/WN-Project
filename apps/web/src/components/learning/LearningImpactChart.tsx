"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { StrategyLearningScore } from "@/types/learning";

export function LearningImpactChart({ items }: { items: StrategyLearningScore[] }) {
  const data = items.slice(0, 8).map((item) => ({ name: item.strategy?.slice(0, 24) || "Strategy", score: item.learning_score * 100, impact: item.avg_actual_impact_pct * 100 }));
  if (data.length === 0) return null;
  return (
    <section className="glass-card p-5">
      <h2 className="text-sm font-semibold">Learning Impact</h2>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 24 }}>
            <CartesianGrid stroke="var(--color-border)" horizontal={false} />
            <XAxis type="number" tick={{ fill: "var(--color-text-muted)", fontSize: 12 }} />
            <YAxis dataKey="name" type="category" width={150} tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }} />
            <Tooltip contentStyle={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />
            <Bar dataKey="score" fill="var(--color-accent)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

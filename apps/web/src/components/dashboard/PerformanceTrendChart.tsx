"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { PerformanceTrendPoint } from "@/types/dashboard";

type Props = {
  trend: PerformanceTrendPoint[];
  isLoading: boolean;
};

export function PerformanceTrendChart({ trend, isLoading }: Props) {
  const latest = trend[trend.length - 1];

  return (
    <section className="glass-card p-5 lg:col-span-2">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Campaign Performance Trend
          </h2>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
            Daily spend and revenue from ad performance logs
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Latest ROAS</div>
          <div className="text-lg font-semibold" style={{ color: "var(--color-info)" }}>
            {latest ? `${latest.roas.toFixed(2)}x` : "--"}
          </div>
        </div>
      </div>

      <div className="h-[280px]">
        {isLoading ? (
          <div className="h-full rounded-lg animate-pulse" style={{ background: "var(--color-bg-tertiary)" }} />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#1e2030" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#5e6078", fontSize: 11 }}
                tickFormatter={(value) => String(value).slice(5)}
              />
              <YAxis
                tick={{ fill: "#5e6078", fontSize: 11 }}
                tickFormatter={(value) => `$${Math.round(Number(value) / 1000)}K`}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  color: "var(--color-text-primary)",
                }}
                formatter={(value, name) => [formatCurrency(Number(value)), name]}
              />
              <Line type="monotone" dataKey="spend" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}


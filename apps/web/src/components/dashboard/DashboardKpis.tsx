"use client";

import { AlertTriangle, DollarSign, Lightbulb, Target, TrendingUp, Zap } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { DashboardSummary } from "@/types/dashboard";

type Props = {
  summary: DashboardSummary;
  isLoading: boolean;
};

export function DashboardKpis({ summary, isLoading }: Props) {
  const cards = [
    {
      title: "Estimated weekly savings",
      value: formatCurrency(summary.estimated_weekly_savings),
      helper: "From active optimization recommendations",
      icon: DollarSign,
      color: "var(--color-success)",
      bg: "var(--color-success-subtle)",
    },
    {
      title: "Active recommendations",
      value: formatNumber(summary.active_recommendations),
      helper: "New, approved, or needs more evidence",
      icon: Lightbulb,
      color: "var(--color-accent)",
      bg: "var(--color-accent-subtle)",
    },
    {
      title: "High-risk alerts",
      value: formatNumber(summary.high_risk_alerts),
      helper: "Require review before execution",
      icon: AlertTriangle,
      color: "var(--color-danger)",
      bg: "var(--color-danger-subtle)",
    },
    {
      title: "Avg ROAS",
      value: `${summary.avg_roas.toFixed(2)}x`,
      helper: "Revenue divided by ad spend",
      icon: TrendingUp,
      color: "var(--color-info)",
      bg: "var(--color-info-subtle)",
    },
    {
      title: "Total ad spend",
      value: formatCurrency(summary.total_spend),
      helper: "Selected window",
      icon: Target,
      color: "var(--color-warning)",
      bg: "var(--color-warning-subtle)",
    },
    {
      title: "Executed actions",
      value: formatNumber(summary.executed_actions),
      helper: "Optimizations already applied",
      icon: Zap,
      color: "var(--color-success)",
      bg: "var(--color-success-subtle)",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <section key={card.title} className="glass-card p-5 min-h-[150px]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase" style={{ color: "var(--color-text-muted)" }}>
                  {card.title}
                </p>
                <div className="text-2xl font-bold mt-3" style={{ color: "var(--color-text-primary)" }}>
                  {isLoading ? "..." : card.value}
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: card.bg }}>
                <Icon size={20} style={{ color: card.color }} />
              </div>
            </div>
            <p className="text-xs mt-4" style={{ color: "var(--color-text-secondary)" }}>
              {card.helper}
            </p>
          </section>
        );
      })}
    </div>
  );
}


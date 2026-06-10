"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DollarSign,
  Lightbulb,
  AlertTriangle,
  Zap,
  TrendingUp,
  ArrowUpRight,
  Eye,
  Check,
  X,
} from "lucide-react";
import { mockKPIs, mockRecommendations } from "@/lib/mock-data";
import { apiGet } from "@/lib/api";
import { formatCurrency, timeAgo } from "@/lib/utils";
import Link from "next/link";

const trendData = mockKPIs.trend_7d.wasted_spend_saved.map((value, i) => ({
  day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
  saved: value,
  recommendations: mockKPIs.trend_7d.recommendations_created[i],
}));

type DashboardSummary = typeof mockKPIs & {
  total_clients?: number;
  total_spend?: number;
  average_roas?: number;
  latest_ingestion_status?: {
    status?: string;
  } | null;
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary>(mockKPIs);
  const priorityRecs = mockRecommendations
    .filter((r) => r.decision_required)
    .slice(0, 4);

  useEffect(() => {
    apiGet<DashboardSummary>("/dashboard/summary", mockKPIs).then(setSummary);
  }, []);

  const kpiCards = useMemo(
    () => [
      {
        title: "Wasted Spend Saved",
        value: formatCurrency(summary.wasted_spend_saved),
        icon: DollarSign,
        color: "#22c55e",
        bgColor: "rgba(34, 197, 94, 0.12)",
        change: "+12.3%",
      },
      {
        title: "Active Recommendations",
        value: summary.active_recommendations.toString(),
        icon: Lightbulb,
        color: "#6366f1",
        bgColor: "rgba(99, 102, 241, 0.12)",
        change: "+6",
      },
      {
        title: "High-Risk Alerts",
        value: summary.high_risk_alerts.toString(),
        icon: AlertTriangle,
        color: "#ef4444",
        bgColor: "rgba(239, 68, 68, 0.12)",
        change: "-2",
      },
      {
        title: "Auto-Actions Executed",
        value: summary.auto_actions_executed.toString(),
        icon: Zap,
        color: "#f59e0b",
        bgColor: "rgba(245, 158, 11, 0.12)",
        change: "+18",
      },
    ],
    [summary],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">
            Intelligence Command Center
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            Real-time overview of AI-powered ad optimization across all clients
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full pulse-dot" style={{ background: "var(--color-success)" }} />
          <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
            Live
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="glass-card p-5 animate-fade-in"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-lg"
                  style={{ background: kpi.bgColor }}
                >
                  <Icon size={20} style={{ color: kpi.color }} />
                </div>
                <span
                  className="flex items-center gap-1 text-xs font-medium"
                  style={{
                    color: kpi.change.startsWith("+") ? "var(--color-success)" : "var(--color-danger)",
                  }}
                >
                  <TrendingUp size={12} />
                  {kpi.change}
                </span>
              </div>
              <div className="text-2xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
                {kpi.value}
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                {kpi.title}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-5">
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>
            Wasted Spend Recovered — Last 7 Days
          </h2>
          <div className="h-[240px]">
            <svg viewBox="0 0 720 240" className="h-full w-full" role="img" aria-label="Wasted spend saved trend">
              <defs>
                <linearGradient id="savedArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 1, 2, 3].map((line) => (
                <line
                  key={line}
                  x1="42"
                  x2="700"
                  y1={24 + line * 48}
                  y2={24 + line * 48}
                  stroke="#1e2030"
                  strokeDasharray="3 3"
                />
              ))}
              <path
                d={`M 42 202 ${trendData
                  .map((point, index) => {
                    const x = 64 + index * 100;
                    const y = 190 - (point.saved / 60000) * 150;
                    return `L ${x.toFixed(1)} ${y.toFixed(1)}`;
                  })
                  .join(" ")} L 664 202 Z`}
                fill="url(#savedArea)"
              />
              <polyline
                points={trendData
                  .map((point, index) => {
                    const x = 64 + index * 100;
                    const y = 190 - (point.saved / 60000) * 150;
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="#6366f1"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {trendData.map((point, index) => {
                const x = 64 + index * 100;
                const y = 190 - (point.saved / 60000) * 150;
                return (
                  <g key={point.day}>
                    <circle cx={x} cy={y} r="4" fill="#818cf8" />
                    <text x={x} y="224" textAnchor="middle" fontSize="12" fill="#5e6078">
                      {point.day}
                    </text>
                  </g>
                );
              })}
              {[0, 20, 40, 60].map((tick) => (
                <text key={tick} x="8" y={194 - (tick / 60) * 150} fontSize="12" fill="#5e6078">
                  ${tick}K
                </text>
              ))}
            </svg>
          </div>
        </div>

        {/* Quick stats */}
        <div className="glass-card p-5 flex flex-col justify-between">
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>
            This Week&apos;s Activity
          </h2>
          <div className="space-y-4 flex-1">
              {[
                { label: "Recommendations Generated", value: summary.active_recommendations.toString(), icon: Lightbulb, color: "#6366f1" },
                { label: "Clients Loaded", value: (summary.total_clients || 0).toString(), icon: Eye, color: "#3b82f6" },
                { label: "Average ROAS", value: `${(summary.average_roas || 0).toFixed(2)}x`, icon: TrendingUp, color: "#a855f7" },
                { label: "Actions Auto-Executed", value: summary.auto_actions_executed.toString(), icon: Zap, color: "#22c55e" },
              ].map((stat, i) => {
              const StatIcon = stat.icon;
              return (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatIcon size={16} style={{ color: stat.color }} />
                    <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      {stat.label}
                    </span>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                    {stat.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Priority Recommendations */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Priority Recommendations — Awaiting Decision
          </h2>
          <Link
            href="/recommendations"
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: "var(--color-accent)" }}
          >
            View all <ArrowUpRight size={12} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Recommendation</th>
                <th>Client</th>
                <th>Platform</th>
                <th>Impact</th>
                <th>Confidence</th>
                <th>Risk</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {priorityRecs.map((rec) => (
                <tr key={rec.id}>
                  <td>
                    <Link
                      href={`/recommendations/${rec.id}`}
                      className="font-medium hover:underline"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {rec.title}
                    </Link>
                    <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                      {timeAgo(rec.created_at)}
                    </div>
                  </td>
                  <td style={{ color: "var(--color-text-secondary)" }}>{rec.client_name}</td>
                  <td>
                    <span className="badge badge-info">{rec.platform}</span>
                  </td>
                  <td style={{ color: "var(--color-success)" }} className="font-medium">
                    {formatCurrency(rec.expected_savings)}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-16 h-1.5 rounded-full overflow-hidden"
                        style={{ background: "var(--color-bg-tertiary)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${rec.confidence * 100}%`,
                            background: rec.confidence >= 0.9 ? "var(--color-success)" : rec.confidence >= 0.8 ? "var(--color-accent)" : "var(--color-warning)",
                          }}
                        />
                      </div>
                      <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        {(rec.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${rec.risk}`}>
                      {rec.risk.charAt(0).toUpperCase() + rec.risk.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Link href={`/recommendations/${rec.id}`}>
                        <button className="btn btn-secondary btn-sm">
                          <Eye size={14} /> View
                        </button>
                      </Link>
                      <button className="btn btn-success btn-sm">
                        <Check size={14} />
                      </button>
                      <button className="btn btn-danger btn-sm">
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

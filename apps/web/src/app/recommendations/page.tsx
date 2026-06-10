"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  ArrowUpRight,
  Eye,
  Check,
  X,
} from "lucide-react";
import { mockRecommendations, type Recommendation } from "@/lib/mock-data";
import { apiGet, apiSend } from "@/lib/api";
import { formatCurrency, timeAgo } from "@/lib/utils";

const platforms = ["All", "Meta", "Google", "TikTok"];
const risks = ["All", "low", "medium", "high"];
const statuses = ["All", "pending", "approved", "auto_approved", "rejected"];

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>(mockRecommendations);
  const [platformFilter, setPlatformFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    apiGet<{ recommendations: Recommendation[] }>("/recommendations", {
      recommendations: mockRecommendations,
    }).then((result) => setRecommendations(result.recommendations));
  }, []);

  const handleDecision = async (id: string, decision: "approve" | "reject") => {
    await apiSend(`/recommendations/${id}/${decision}`, "POST", {});
    setRecommendations((prev) =>
      prev.map((rec) =>
        rec.id === id
          ? { ...rec, status: decision === "approve" ? "approved" : "rejected", decision_required: false }
          : rec,
      ),
    );
  };

  const filtered = recommendations.filter((rec) => {
    if (platformFilter !== "All" && rec.platform !== platformFilter) return false;
    if (riskFilter !== "All" && rec.risk !== riskFilter) return false;
    if (statusFilter !== "All" && rec.status !== statusFilter) return false;
    if (searchQuery && !rec.title.toLowerCase().includes(searchQuery.toLowerCase()) && !rec.client_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold gradient-text">Recommendation Queue</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
          {recommendations.length} total recommendations · {recommendations.filter((r) => r.decision_required).length} awaiting decision
        </p>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-2 rounded-lg" style={{ background: "var(--color-bg-tertiary)", border: "1px solid var(--color-border)" }}>
            <Search size={16} style={{ color: "var(--color-text-muted)" }} />
            <input
              type="text"
              placeholder="Search by title or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm flex-1 outline-none"
              style={{ color: "var(--color-text-primary)" }}
            />
          </div>

          {/* Platform filter */}
          <div className="flex items-center gap-2">
            <Filter size={14} style={{ color: "var(--color-text-muted)" }} />
            <div className="flex gap-1">
              {platforms.map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatformFilter(p)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    platformFilter === p ? "text-white" : ""
                  }`}
                  style={{
                    background: platformFilter === p ? "var(--color-accent)" : "var(--color-bg-tertiary)",
                    color: platformFilter === p ? "white" : "var(--color-text-secondary)",
                    border: `1px solid ${platformFilter === p ? "var(--color-accent)" : "var(--color-border)"}`,
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Risk filter */}
          <div className="flex gap-1">
            {risks.map((r) => (
              <button
                key={r}
                onClick={() => setRiskFilter(r)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer`}
                style={{
                  background: riskFilter === r ? "var(--color-accent)" : "var(--color-bg-tertiary)",
                  color: riskFilter === r ? "white" : "var(--color-text-secondary)",
                  border: `1px solid ${riskFilter === r ? "var(--color-accent)" : "var(--color-border)"}`,
                }}
              >
                {r === "All" ? "All Risk" : r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-md text-xs font-medium outline-none cursor-pointer"
            style={{
              background: "var(--color-bg-tertiary)",
              color: "var(--color-text-secondary)",
              border: "1px solid var(--color-border)",
            }}
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "All Statuses" : s.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-3">
        {filtered.map((rec, idx) => (
          <div
            key={rec.id}
            className="glass-card glass-card-hover p-5 animate-fade-in"
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Link
                    href={`/recommendations/${rec.id}`}
                    className="text-sm font-semibold hover:underline"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {rec.title}
                  </Link>
                  <span className={`badge badge-${rec.risk}`}>
                    {rec.risk.charAt(0).toUpperCase() + rec.risk.slice(1)} Risk
                  </span>
                  <span className="badge badge-info">{rec.platform}</span>
                  {rec.status === "pending" && (
                    <span className="badge badge-medium">Decision Required</span>
                  )}
                  {rec.status === "auto_approved" && (
                    <span className="badge badge-low">Auto-Approved</span>
                  )}
                  {rec.status === "approved" && (
                    <span className="badge badge-low">Approved</span>
                  )}
                </div>
                <p className="text-xs mb-2" style={{ color: "var(--color-text-secondary)" }}>
                  {rec.client_name} · {rec.type.replace(/_/g, " ")} · {timeAgo(rec.created_at)}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {rec.summary}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="text-right">
                  <div className="text-lg font-bold" style={{ color: "var(--color-success)" }}>
                    {formatCurrency(rec.expected_savings)}
                  </div>
                  <div className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                    est. savings/mo
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                      {(rec.confidence * 100).toFixed(0)}% conf.
                    </div>
                  </div>
                  <div
                    className="w-12 h-1.5 rounded-full overflow-hidden"
                    style={{ background: "var(--color-bg-tertiary)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${rec.confidence * 100}%`,
                        background: rec.confidence >= 0.9 ? "var(--color-success)" : "var(--color-accent)",
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-1">
                  <Link href={`/recommendations/${rec.id}`}>
                    <button className="btn btn-secondary btn-sm">
                      <Eye size={14} /> Evidence
                      <ArrowUpRight size={12} />
                    </button>
                  </Link>
                  {rec.decision_required && (
                    <>
                      <button onClick={() => handleDecision(rec.id, "approve")} className="btn btn-success btn-sm">
                        <Check size={14} /> Approve
                      </button>
                      <button onClick={() => handleDecision(rec.id, "reject")} className="btn btn-danger btn-sm">
                        <X size={14} /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="glass-card p-12 text-center">
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              No recommendations match your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

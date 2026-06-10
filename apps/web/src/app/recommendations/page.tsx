"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, DollarSign, FileQuestion, ShieldAlert, Users } from "lucide-react";
import {
  decideRecommendation,
  fallbackRecommendationFacets,
  fallbackRecommendationSummary,
  getRecommendationFacets,
  getRecommendationSummary,
  getRecommendations,
} from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  defaultRecommendationFilters,
  hasActiveRecommendationFilters,
  RecommendationFilters,
} from "@/components/recommendations/RecommendationFilters";
import { RecommendationEmptyState } from "@/components/recommendations/RecommendationEmptyState";
import { RecommendationTable } from "@/components/recommendations/RecommendationTable";
import { RecommendationToolbar } from "@/components/recommendations/RecommendationToolbar";
import type {
  RecommendationAction,
  RecommendationFacets,
  RecommendationFilters as FilterState,
  RecommendationRecord,
  RecommendationSummary,
} from "@/types/recommendations";

export default function RecommendationsPage() {
  const [filters, setFilters] = useState<FilterState>(defaultRecommendationFilters);
  const [facets, setFacets] = useState<RecommendationFacets>(fallbackRecommendationFacets);
  const [summary, setSummary] = useState<RecommendationSummary>(fallbackRecommendationSummary);
  const [recommendations, setRecommendations] = useState<RecommendationRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchRecommendationData = useCallback(async (nextFilters: FilterState) => {
    const [nextFacets, nextSummary, list] = await Promise.all([
      getRecommendationFacets(),
      getRecommendationSummary(),
      getRecommendations(nextFilters),
    ]);

    return { nextFacets, nextSummary, list };
  }, []);

  const applyRecommendationData = useCallback((data: Awaited<ReturnType<typeof fetchRecommendationData>>) => {
    setFacets(data.nextFacets);
    setSummary(data.nextSummary);
    setRecommendations(data.list.items);
    setTotal(data.list.total);
  }, []);

  const loadRecommendations = useCallback(async (nextFilters: FilterState = filters, clearMessage = true) => {
    setIsLoading(true);
    if (clearMessage) setMessage(null);
    try {
      applyRecommendationData(await fetchRecommendationData(nextFilters));
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Unable to load recommendations.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [applyRecommendationData, fetchRecommendationData, filters]);

  useEffect(() => {
    let isCurrent = true;

    fetchRecommendationData(filters)
      .then((data) => {
        if (isCurrent) applyRecommendationData(data);
      })
      .catch((error) => {
        if (!isCurrent) return;
        setMessage({
          type: "error",
          text: error instanceof Error ? error.message : "Unable to load recommendations.",
        });
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [applyRecommendationData, fetchRecommendationData, filters]);

  const isFallback = summary.source !== "database" || facets.source !== "database";
  const hasFilters = useMemo(() => hasActiveRecommendationFilters(filters), [filters]);

  const handleAction = async (id: string, action: RecommendationAction, note?: string) => {
    setBusyId(id);
    setMessage(null);
    try {
      await decideRecommendation(id, action, note);
      const actionLabel =
        action === "approve"
          ? "approved"
          : action === "reject"
            ? "rejected"
            : "marked for more evidence";
      await loadRecommendations(filters, false);
      setMessage({ type: "success", text: `Recommendation ${actionLabel}.` });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Decision update failed.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const resetFilters = () => setFilters(defaultRecommendationFilters);

  return (
    <div className="space-y-6">
      <RecommendationToolbar isLoading={isLoading} isFallback={isFallback} onRefresh={() => loadRecommendations(filters)} />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard icon={<Users size={18} />} label="Total recommendations" value={formatNumber(summary.total)} />
        <SummaryCard icon={<AlertCircle size={18} />} label="Human approval required" value={formatNumber(summary.human_approval_required)} />
        <SummaryCard icon={<ShieldAlert size={18} />} label="High-risk recommendations" value={formatNumber(summary.high_risk)} tone="danger" />
        <SummaryCard icon={<DollarSign size={18} />} label="Estimated weekly savings" value={formatCurrency(summary.estimated_weekly_savings)} tone="success" />
        <SummaryCard icon={<FileQuestion size={18} />} label="Needs more evidence" value={formatNumber(summary.needs_more_evidence)} />
      </div>

      <RecommendationFilters
        facets={facets}
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
      />

      {message && (
        <div
          className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm"
          style={{
            background: message.type === "success" ? "var(--color-success-subtle)" : "var(--color-danger-subtle)",
            borderColor: message.type === "success" ? "var(--color-success)" : "var(--color-danger)",
            color: message.type === "success" ? "var(--color-success)" : "var(--color-danger)",
          }}
        >
          {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
        <span>
          Showing {formatNumber(recommendations.length)} of {formatNumber(total)} recommendations
        </span>
        {isLoading && <span>Refreshing recommendations...</span>}
      </div>

      {recommendations.length > 0 ? (
        <RecommendationTable recommendations={recommendations} busyId={busyId} onAction={handleAction} />
      ) : (
        <RecommendationEmptyState hasFilters={hasFilters} onReset={resetFilters} />
      )}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: "success" | "danger";
}) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="rounded-lg p-2" style={{ background: "var(--color-bg-tertiary)", color: "var(--color-accent)" }}>
          {icon}
        </div>
      </div>
      <div
        className="mt-3 text-2xl font-bold"
        style={{
          color:
            tone === "success"
              ? "var(--color-success)"
              : tone === "danger"
                ? "var(--color-danger)"
                : "var(--color-text-primary)",
        }}
      >
        {value}
      </div>
      <div className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
        {label}
      </div>
    </div>
  );
}

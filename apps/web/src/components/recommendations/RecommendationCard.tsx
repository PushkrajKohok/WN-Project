"use client";

import Link from "next/link";
import { ArrowUpRight, Eye } from "lucide-react";
import { formatCurrency, timeAgo } from "@/lib/utils";
import type { RecommendationAction, RecommendationRecord } from "@/types/recommendations";
import { RecommendationDecisionPanel } from "./RecommendationDecisionPanel";
import { RecommendationStatusBadge } from "./RecommendationStatusBadge";

export function RecommendationCard({
  recommendation,
  isBusy,
  onAction,
}: {
  recommendation: RecommendationRecord;
  isBusy: boolean;
  onAction: (id: string, action: RecommendationAction, note?: string) => Promise<void>;
}) {
  const confidence = Math.round(recommendation.confidence_score * 100);

  return (
    <article className="glass-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <RecommendationStatusBadge value={recommendation.risk_level} kind="risk" />
        <RecommendationStatusBadge value={recommendation.status} kind="status" />
        <RecommendationStatusBadge value={recommendation.decision_required} kind="decision" />
        <RecommendationStatusBadge value={recommendation.target_platform} kind="platform" />
      </div>

      <Link href={`/recommendations/${recommendation.recommendation_id}`} className="mt-3 block text-sm font-semibold hover:underline">
        {recommendation.title}
      </Link>
      <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
        {recommendation.brand_name} · {recommendation.recommendation_type.replace(/_/g, " ")} ·{" "}
        {recommendation.detected_at ? timeAgo(recommendation.detected_at) : "recently"}
      </p>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
        {recommendation.evidence_summary}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Metric label="Weekly savings" value={formatCurrency(recommendation.expected_weekly_savings)} tone="success" />
        <Metric label="ROAS lift" value={`${recommendation.expected_roas_lift_pct.toFixed(1)}%`} />
        <Metric label="Confidence" value={`${confidence}%`} />
        <Metric label="Campaign" value={recommendation.target_campaign_id || "Portfolio"} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <Link href={`/recommendations/${recommendation.recommendation_id}`} className="btn btn-secondary btn-sm">
          <Eye size={14} />
          View Evidence
          <ArrowUpRight size={12} />
        </Link>
        <RecommendationDecisionPanel recommendation={recommendation} isBusy={isBusy} onAction={onAction} />
      </div>
    </article>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "success" }) {
  return (
    <div className="rounded-lg border p-3" style={{ background: "var(--color-bg-tertiary)", borderColor: "var(--color-border)" }}>
      <div className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </div>
      <div className="mt-1 truncate font-semibold" style={{ color: tone === "success" ? "var(--color-success)" : "var(--color-text-primary)" }}>
        {value}
      </div>
    </div>
  );
}

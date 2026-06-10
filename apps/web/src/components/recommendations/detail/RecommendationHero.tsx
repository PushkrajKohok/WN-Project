"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatCurrency, timeAgo } from "@/lib/utils";
import type { RecommendationRecord } from "@/types/recommendations";
import { RecommendationStatusBadge } from "../RecommendationStatusBadge";

export function RecommendationHero({
  recommendation,
  isFallback,
}: {
  recommendation: RecommendationRecord;
  isFallback: boolean;
}) {
  return (
    <div className="space-y-4">
      <Link href="/recommendations" className="inline-flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: "var(--color-accent)" }}>
        <ArrowLeft size={14} />
        Back to Recommendations
      </Link>

      <div className="glass-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              {isFallback && <span className="badge badge-info">Demo fallback mode</span>}
              <RecommendationStatusBadge value={recommendation.target_platform} kind="platform" />
              <RecommendationStatusBadge value={recommendation.risk_level} kind="risk" />
              <RecommendationStatusBadge value={recommendation.status} kind="status" />
              <RecommendationStatusBadge value={recommendation.decision_required} kind="decision" />
            </div>
            <h1 className="mt-3 text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
              {recommendation.title}
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {recommendation.brand_name} · {recommendation.brand_category || "Client"} ·{" "}
              {recommendation.target_campaign_id || "Client-level portfolio"} ·{" "}
              {recommendation.detected_at ? timeAgo(recommendation.detected_at) : "recently"}
            </p>
            <p className="mt-4 max-w-4xl text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              {recommendation.evidence_summary}
            </p>
          </div>

          <div className="grid min-w-[260px] grid-cols-2 gap-3">
            <HeroMetric label="Weekly savings" value={formatCurrency(recommendation.expected_weekly_savings)} tone="success" />
            <HeroMetric label="ROAS lift" value={`${recommendation.expected_roas_lift_pct.toFixed(1)}%`} />
            <HeroMetric label="Confidence" value={`${(recommendation.confidence_score * 100).toFixed(0)}%`} />
            <HeroMetric label="Spend band" value={recommendation.monthly_ad_spend_band || "N/A"} />
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroMetric({ label, value, tone }: { label: string; value: string; tone?: "success" }) {
  return (
    <div className="rounded-lg border p-3" style={{ background: "var(--color-bg-tertiary)", borderColor: "var(--color-border)" }}>
      <div className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </div>
      <div className="mt-1 truncate text-lg font-semibold" style={{ color: tone === "success" ? "var(--color-success)" : "var(--color-text-primary)" }}>
        {value}
      </div>
    </div>
  );
}

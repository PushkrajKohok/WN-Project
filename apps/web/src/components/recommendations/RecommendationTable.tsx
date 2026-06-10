"use client";

import Link from "next/link";
import { ArrowUpRight, Eye } from "lucide-react";
import { formatCurrency, timeAgo } from "@/lib/utils";
import type { RecommendationAction, RecommendationRecord } from "@/types/recommendations";
import { RecommendationCard } from "./RecommendationCard";
import { RecommendationDecisionPanel } from "./RecommendationDecisionPanel";
import { RecommendationStatusBadge } from "./RecommendationStatusBadge";

export function RecommendationTable({
  recommendations,
  busyId,
  onAction,
}: {
  recommendations: RecommendationRecord[];
  busyId: string | null;
  onAction: (id: string, action: RecommendationAction, note?: string) => Promise<void>;
}) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border lg:block" style={{ borderColor: "var(--color-border)" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Recommendation</th>
              <th>Client</th>
              <th>Signal</th>
              <th>Impact</th>
              <th>Status</th>
              <th>Decision</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {recommendations.map((recommendation) => (
              <tr key={recommendation.recommendation_id}>
                <td className="max-w-[360px]">
                  <Link href={`/recommendations/${recommendation.recommendation_id}`} className="font-semibold hover:underline" style={{ color: "var(--color-text-primary)" }}>
                    {recommendation.title}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {recommendation.evidence_summary}
                  </p>
                </td>
                <td>
                  <div className="font-medium">{recommendation.brand_name}</div>
                  <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {recommendation.brand_category || recommendation.client_id}
                  </div>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1.5">
                    <RecommendationStatusBadge value={recommendation.target_platform} kind="platform" />
                    <RecommendationStatusBadge value={recommendation.risk_level} kind="risk" />
                  </div>
                  <div className="mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {recommendation.detected_at ? timeAgo(recommendation.detected_at) : "recent"}
                  </div>
                </td>
                <td>
                  <div className="font-semibold" style={{ color: "var(--color-success)" }}>
                    {formatCurrency(recommendation.expected_weekly_savings)}
                  </div>
                  <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {(recommendation.confidence_score * 100).toFixed(0)}% confidence · {recommendation.expected_roas_lift_pct.toFixed(1)}% ROAS
                  </div>
                </td>
                <td>
                  <RecommendationStatusBadge value={recommendation.status} kind="status" />
                </td>
                <td>
                  <RecommendationStatusBadge value={recommendation.decision_required} kind="decision" />
                </td>
                <td>
                  <div className="flex flex-col items-end gap-2">
                    <Link href={`/recommendations/${recommendation.recommendation_id}`} className="btn btn-secondary btn-sm">
                      <Eye size={14} />
                      View Evidence
                      <ArrowUpRight size={12} />
                    </Link>
                    <RecommendationDecisionPanel
                      recommendation={recommendation}
                      isBusy={busyId === recommendation.recommendation_id}
                      onAction={onAction}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:hidden">
        {recommendations.map((recommendation) => (
          <RecommendationCard
            key={recommendation.recommendation_id}
            recommendation={recommendation}
            isBusy={busyId === recommendation.recommendation_id}
            onAction={onAction}
          />
        ))}
      </div>
    </>
  );
}

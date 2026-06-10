"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { PriorityRecommendation } from "@/types/dashboard";

type Props = {
  recommendations: PriorityRecommendation[];
  isLoading: boolean;
};

function riskClass(risk: string) {
  return `badge-${risk.toLowerCase()}`;
}

export function RecommendationPriorityList({ recommendations, isLoading }: Props) {
  return (
    <section className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Priority Recommendations
          </h2>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
            Highest-risk and highest-savings recommendations
          </p>
        </div>
        <Link href="/recommendations" className="text-xs flex items-center gap-1" style={{ color: "var(--color-accent)" }}>
          View all <ArrowUpRight size={12} />
        </Link>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-20 rounded-lg animate-pulse" style={{ background: "var(--color-bg-tertiary)" }} />
          ))
        ) : recommendations.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            No active recommendations match this filter.
          </p>
        ) : (
          recommendations.map((rec) => (
            <div
              key={rec.recommendation_id}
              className="p-3 rounded-lg border"
              style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
                    {rec.title}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    <span>{rec.brand_name}</span>
                    <span className="badge badge-info">{rec.target_platform}</span>
                    <span className={`badge ${riskClass(rec.risk_level)}`}>{rec.risk_level}</span>
                    {rec.decision_required ? <span className="badge badge-medium">Decision required</span> : null}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold" style={{ color: "var(--color-success)" }}>
                    {formatCurrency(rec.expected_weekly_savings)}
                  </div>
                  <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {(rec.confidence_score * 100).toFixed(0)}% confidence
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Status: {rec.status.replaceAll("_", " ")}
                </span>
                <Link href={`/recommendations/${rec.recommendation_id}`}>
                  <button className="btn btn-secondary btn-sm">View Evidence</button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}


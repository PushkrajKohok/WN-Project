"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  decideRecommendation,
  getRecommendationDetail,
} from "@/lib/api";
import { DecisionActionPanel } from "@/components/recommendations/detail/DecisionActionPanel";
import { EvidenceDrawer } from "@/components/recommendations/detail/EvidenceDrawer";
import { RecommendationHero } from "@/components/recommendations/detail/RecommendationHero";
import type { RecommendationDetailResponse } from "@/types/evidence";
import type { RecommendationAction } from "@/types/recommendations";

export default function RecommendationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [detail, setDetail] = useState<RecommendationDetailResponse | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadDetail = useCallback(async (clearMessage = false) => {
    setIsLoading(true);
    if (clearMessage) setMessage(null);
    const nextDetail = await getRecommendationDetail(id);
    setDetail(nextDetail);
    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    let isCurrent = true;
    getRecommendationDetail(id)
      .then((nextDetail) => {
        if (isCurrent) setDetail(nextDetail);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [id]);

  const handleAction = async (recommendationId: string, action: RecommendationAction, note?: string) => {
    setBusyId(recommendationId);
    setMessage(null);
    try {
      await decideRecommendation(recommendationId, action, note);
      await loadDetail(false);
      setMessage({
        type: "success",
        text:
          action === "approve"
            ? "Recommendation approved."
            : action === "reject"
              ? "Recommendation rejected."
              : "More evidence requested.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Recommendation action failed.",
      });
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading && !detail) {
    return (
      <div className="space-y-4">
        <div className="h-36 animate-pulse rounded-xl" style={{ background: "var(--color-bg-card)" }} />
        <div className="h-96 animate-pulse rounded-xl" style={{ background: "var(--color-bg-card)" }} />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="glass-card p-12 text-center">
        <p style={{ color: "var(--color-text-muted)" }}>Recommendation not found.</p>
        <Link href="/recommendations" className="btn btn-secondary mt-4 inline-flex">
          <ArrowLeft size={14} />
          Back to Recommendations
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RecommendationHero
        recommendation={detail.recommendation}
        isFallback={detail.source !== "database"}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <main className="space-y-4">
          <section className="glass-card p-5">
            <h2 className="text-sm font-semibold">Decision Rationale</h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              This recommendation is supported by structured campaign performance, anonymized cross-client benchmarks, retrieved RAG context, and Corrective RAG validation checks. Only public evidence summaries are shown here; hidden agent reasoning is not exposed.
            </p>
          </section>
          <EvidenceDrawer detail={detail} />
        </main>

        <DecisionActionPanel
          recommendation={detail.recommendation}
          isBusy={busyId === detail.recommendation.recommendation_id}
          message={message}
          onAction={handleAction}
        />
      </div>
    </div>
  );
}

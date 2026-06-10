"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { AgentActivityPreview } from "@/components/dashboard/AgentActivityPreview";
import { CrossClientSignalCard } from "@/components/dashboard/CrossClientSignalCard";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { DashboardKpis } from "@/components/dashboard/DashboardKpis";
import { IngestionHealthCard } from "@/components/dashboard/IngestionHealthCard";
import { PerformanceTrendChart } from "@/components/dashboard/PerformanceTrendChart";
import { RecommendationPriorityList } from "@/components/dashboard/RecommendationPriorityList";
import { RiskDistributionCard } from "@/components/dashboard/RiskDistributionCard";
import {
  fallbackDashboardSummary,
  fallbackPerformanceTrend,
  fallbackPriorityRecommendations,
  fallbackRiskDistribution,
  getClients,
  getDashboardAgentActivity,
  getDashboardPerformanceTrend,
  getDashboardPriorityRecommendations,
  getDashboardRiskDistribution,
  getDashboardSummaryData,
  getIngestionFrequency,
} from "@/lib/api";
import type {
  AgentActivityItem,
  ClientOption,
  DashboardFilters as FilterState,
  DashboardSummary,
  PerformanceTrendPoint,
  PriorityRecommendation,
  RiskDistributionItem,
} from "@/types/dashboard";

export default function DashboardPage() {
  const [filters, setFilters] = useState<FilterState>({ client_id: "all", platform: "All", days: 30 });
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>(fallbackDashboardSummary);
  const [trend, setTrend] = useState<PerformanceTrendPoint[]>(fallbackPerformanceTrend);
  const [riskDistribution, setRiskDistribution] = useState<RiskDistributionItem[]>(fallbackRiskDistribution);
  const [recommendations, setRecommendations] = useState<PriorityRecommendation[]>(fallbackPriorityRecommendations);
  const [activity, setActivity] = useState<AgentActivityItem[]>([]);
  const [frequencyLabel, setFrequencyLabel] = useState("1 Hour");
  const [isLoading, setIsLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);

  const loadDashboard = async (nextFilters = filters) => {
    setIsLoading(true);
    const [
      nextSummary,
      nextTrend,
      nextRisk,
      nextRecommendations,
      nextActivity,
      nextClients,
      nextFrequency,
    ] = await Promise.all([
      getDashboardSummaryData(nextFilters),
      getDashboardPerformanceTrend(nextFilters),
      getDashboardRiskDistribution(nextFilters),
      getDashboardPriorityRecommendations(nextFilters),
      getDashboardAgentActivity(),
      getClients(),
      getIngestionFrequency(),
    ]);

    setSummary(nextSummary);
    setTrend(nextTrend);
    setRiskDistribution(nextRisk);
    setRecommendations(nextRecommendations);
    setActivity(nextActivity);
    setClients(nextClients.clients);
    setFrequencyLabel(nextFrequency.frequency_label);
    setFallbackMode(nextSummary.source !== "database" || nextTrend.some((item) => item.source && item.source !== "database"));
    setIsLoading(false);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadDashboard();
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiltersChange = (nextFilters: FilterState) => {
    setFilters(nextFilters);
    loadDashboard(nextFilters);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold gradient-text">Intelligence Command Center</h1>
            {fallbackMode ? <span className="badge badge-medium">Demo fallback mode</span> : null}
          </div>
          <p className="text-sm mt-1 max-w-3xl" style={{ color: "var(--color-text-secondary)" }}>
            Always-on multi-agent RAG monitoring for client performance, ad spend waste, and cross-client optimization patterns.
          </p>
        </div>
        <DashboardFilters
          clients={clients}
          filters={filters}
          isLoading={isLoading}
          onChange={handleFiltersChange}
          onRefresh={() => loadDashboard(filters)}
        />
      </div>

      {summary.is_empty ? (
        <section className="glass-card p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} style={{ color: "var(--color-warning)" }} />
            <div>
              <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
                No ingested data yet.
              </h2>
              <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                Generate and load synthetic data from Data & Ingestion Control.
              </p>
            </div>
          </div>
          <Link href="/data">
            <button className="btn btn-primary">Go to Data & Ingestion Control</button>
          </Link>
        </section>
      ) : null}

      <DashboardKpis summary={summary} isLoading={isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PerformanceTrendChart trend={trend} isLoading={isLoading} />
        <div className="space-y-4">
          <RiskDistributionCard items={riskDistribution} />
          <IngestionHealthCard summary={summary} frequencyLabel={frequencyLabel} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <RecommendationPriorityList recommendations={recommendations} isLoading={isLoading} />
        <div className="space-y-4">
          <AgentActivityPreview activity={activity} isLoading={isLoading} />
          <CrossClientSignalCard summary={summary} />
        </div>
      </div>
    </div>
  );
}

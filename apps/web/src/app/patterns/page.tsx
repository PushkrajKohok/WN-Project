"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { BenchmarkDetailPanel } from "@/components/patterns/BenchmarkDetailPanel";
import { BenchmarkTable } from "@/components/patterns/BenchmarkTable";
import { NetworkEffectsExplainer } from "@/components/patterns/NetworkEffectsExplainer";
import { defaultPatternFilters, PatternFilters } from "@/components/patterns/PatternFilters";
import { PatternGraphView } from "@/components/patterns/PatternGraphView";
import { PatternSummaryCards } from "@/components/patterns/PatternSummaryCards";
import { PrivacyBoundaryCard } from "@/components/patterns/PrivacyBoundaryCard";
import { StrategyLiftChart } from "@/components/patterns/StrategyLiftChart";
import {
  fallbackPatternFacets,
  fallbackPatternSummary,
  getBenchmarkDetail,
  getBenchmarks,
  getPatternFacets,
  getPatternGraph,
  getPatternSummary,
  getStrategyLift,
} from "@/lib/api";
import type {
  BenchmarkDetail,
  BenchmarkPattern,
  PatternFacets,
  PatternFilters as Filters,
  PatternGraphResponse,
  PatternSummary,
  StrategyLiftItem,
} from "@/types/patterns";

export default function PatternsPage() {
  const [filters, setFilters] = useState<Filters>(defaultPatternFilters);
  const [summary, setSummary] = useState<PatternSummary>(fallbackPatternSummary);
  const [facets, setFacets] = useState<PatternFacets>(fallbackPatternFacets);
  const [benchmarks, setBenchmarks] = useState<BenchmarkPattern[]>([]);
  const [total, setTotal] = useState(0);
  const [lift, setLift] = useState<StrategyLiftItem[]>([]);
  const [graph, setGraph] = useState<PatternGraphResponse>({ nodes: [], edges: [], source: "mock" });
  const [selected, setSelected] = useState<BenchmarkPattern | null>(null);
  const [detail, setDetail] = useState<BenchmarkDetail | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const appliedFilters = useMemo(
    () => ({
      brand_category: filters.brand_category,
      spend_band: filters.spend_band,
      metric: filters.metric,
      privacy_level: filters.privacy_level,
      search: filters.search,
      sort_by: filters.sort_by,
      sort_dir: filters.sort_dir,
      limit: filters.limit,
      offset: filters.offset,
    }),
    [filters],
  );

  useEffect(() => {
    let active = true;
    Promise.all([
      getPatternFacets(),
      getPatternSummary(appliedFilters),
      getBenchmarks(filters),
      getStrategyLift(appliedFilters),
      getPatternGraph({ limit: 80 }),
    ])
      .then(([nextFacets, nextSummary, nextBenchmarks, nextLift, nextGraph]) => {
        if (!active) return;
        setFacets(nextFacets);
        setSummary(nextSummary);
        setBenchmarks(nextBenchmarks.items);
        setTotal(nextBenchmarks.total);
        setLift(nextLift);
        setGraph(nextGraph);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [appliedFilters, filters]);

  const selectBenchmark = (benchmark: BenchmarkPattern) => {
    setSelected(benchmark);
    setDetail(undefined);
    setIsDetailLoading(true);
    getBenchmarkDetail(benchmark.benchmark_id)
      .then((nextDetail) => setDetail(nextDetail))
      .finally(() => setIsDetailLoading(false));
  };

  const updateFilters = (nextFilters: Filters) => {
    setIsLoading(true);
    setFilters(nextFilters);
  };

  const resetFilters = () => {
    setIsLoading(true);
    setFilters({ ...defaultPatternFilters });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold gradient-text">Cross-Client Pattern Explorer</h1>
            {summary.source === "mock" && <span className="badge badge-info">Demo fallback mode</span>}
          </div>
          <p className="mt-1 max-w-3xl text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Explore privacy-safe benchmark cohorts, strategy lift, and GraphRAG relationships learned across WasteNot clients.
          </p>
        </div>
        <button type="button" onClick={resetFilters} className="btn btn-secondary">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <PatternSummaryCards summary={summary} />
      <NetworkEffectsExplainer />
      <PatternFilters facets={facets} filters={filters} onChange={updateFilters} onReset={resetFilters} />

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
        <span>{isLoading ? "Loading benchmarks..." : `${total} privacy-safe benchmark cohorts available`}</span>
        <span className="flex items-center gap-2">
          <ShieldCheck size={15} style={{ color: "var(--color-success)" }} /> aggregated, anonymized, and cohort-scoped
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <StrategyLiftChart items={lift} />
        <PrivacyBoundaryCard />
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1.4fr_0.8fr]">
        <BenchmarkTable items={benchmarks} selectedId={selected?.benchmark_id} onSelect={selectBenchmark} />
        <BenchmarkDetailPanel benchmark={selected} detail={detail} isLoading={isDetailLoading} onClose={() => setSelected(null)} />
      </div>

      <PatternGraphView graph={graph} />
    </div>
  );
}

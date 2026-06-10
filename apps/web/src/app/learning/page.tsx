"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bot, RefreshCw, SearchCode } from "lucide-react";
import { LearningEventsTimeline } from "@/components/learning/LearningEventsTimeline";
import { LearningImpactChart } from "@/components/learning/LearningImpactChart";
import { LearningLoopExplainer } from "@/components/learning/LearningLoopExplainer";
import { LearningPrivacyCard } from "@/components/learning/LearningPrivacyCard";
import { LearningSummaryCards } from "@/components/learning/LearningSummaryCards";
import { MemoryUpdatePanel } from "@/components/learning/MemoryUpdatePanel";
import { OutcomeMeasurementTable } from "@/components/learning/OutcomeMeasurementTable";
import { RunLearningCyclePanel } from "@/components/learning/RunLearningCyclePanel";
import { StrategyLearningScoreTable } from "@/components/learning/StrategyLearningScoreTable";
import {
  getLearningEvents,
  getLearningMemoryUpdates,
  getLearningSummary,
  getOutcomeMeasurements,
  getStrategyLearningScores,
  promoteStrategyToBenchmark,
  runLearningCycle,
} from "@/lib/api";
import type { LearningEvent, LearningMemoryDocument, LearningSummary, OutcomeMeasurement, RunLearningCycleRequest, RunLearningCycleResponse, StrategyLearningScore } from "@/types/learning";

const emptySummary: LearningSummary = {
  total_learning_events: 0,
  outcomes_measured: 0,
  successful_outcomes: 0,
  rolled_back_outcomes: 0,
  avg_measured_impact_pct: 0,
  strategies_tracked: 0,
  rag_docs_created: 0,
  benchmarks_updated: 0,
  graph_edges_updated: 0,
};

export default function LearningPage() {
  const [summary, setSummary] = useState<LearningSummary>(emptySummary);
  const [events, setEvents] = useState<LearningEvent[]>([]);
  const [outcomes, setOutcomes] = useState<OutcomeMeasurement[]>([]);
  const [scores, setScores] = useState<StrategyLearningScore[]>([]);
  const [memory, setMemory] = useState<LearningMemoryDocument[]>([]);
  const [result, setResult] = useState<RunLearningCycleResponse | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([
      getLearningSummary(),
      getLearningEvents({ limit: 50 }),
      getOutcomeMeasurements({ limit: 50 }),
      getStrategyLearningScores({ limit: 50 }),
      getLearningMemoryUpdates(),
    ]).then(([nextSummary, nextEvents, nextOutcomes, nextScores, nextMemory]) => {
      setSummary(nextSummary);
      setEvents(nextEvents.items);
      setOutcomes(nextOutcomes.items);
      setScores(nextScores.items);
      setMemory(nextMemory.items);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runCycle = (payload: RunLearningCycleRequest) => {
    setIsLoading(true);
    setNotice(null);
    runLearningCycle(payload)
      .then((nextResult) => {
        setResult(nextResult);
        setNotice(nextResult.summary);
        load();
      })
      .finally(() => setIsLoading(false));
  };

  const promote = (score: StrategyLearningScore) => {
    promoteStrategyToBenchmark({ strategy_key: score.strategy_key })
      .then(() => setNotice("Strategy promoted to benchmark. Open Cross-Client Patterns to inspect it."))
      .catch((error) => setNotice(error.message || "Promotion criteria not met yet."));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold gradient-text">Recursive Learning Loop</h1>
            {summary.source === "mock" && <span className="badge badge-info">Demo fallback mode</span>}
          </div>
          <p className="mt-1 max-w-3xl text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Turns recommendation outcomes into reusable memory, benchmark updates, and graph signals so the intelligence layer improves over time.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={load} className="btn btn-secondary"><RefreshCw size={15} /> Refresh</button>
          <Link href="/rag" className="btn btn-secondary"><SearchCode size={15} /> RAG Retrieval</Link>
          <Link href="/agents" className="btn btn-primary"><Bot size={15} /> Agent Workbench</Link>
        </div>
      </div>

      {notice && <div className="rounded-lg border px-4 py-3 text-sm" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>{notice}</div>}

      <LearningLoopExplainer />
      <LearningSummaryCards summary={summary} />
      {summary.total_learning_events === 0 && (
        <div className="glass-card p-6 text-center">
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>No executed or rolled-back actions available yet. Simulate execution from Action Log first.</p>
          <Link href="/actions" className="btn btn-primary mt-4">Go to Action Log</Link>
        </div>
      )}
      <RunLearningCyclePanel isLoading={isLoading} result={result} onRun={runCycle} />
      <LearningImpactChart items={scores} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <LearningEventsTimeline events={events} />
        <MemoryUpdatePanel items={memory} />
      </div>
      <OutcomeMeasurementTable items={outcomes} />
      <StrategyLearningScoreTable items={scores} onPromote={promote} />
      <LearningPrivacyCard />
    </div>
  );
}

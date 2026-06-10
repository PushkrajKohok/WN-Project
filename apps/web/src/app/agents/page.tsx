"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Database, Lightbulb, RefreshCw } from "lucide-react";
import {
  getAgentLogs,
  getAgentRunDetail,
  getAgentRuns,
  getAgentStatuses,
  getClients,
  getCurrentInvestigation,
  runAgentScan,
} from "@/lib/api";
import { AgentFailureRecoveryCard } from "@/components/agents/AgentFailureRecoveryCard";
import { AgentFilters } from "@/components/agents/AgentFilters";
import { AgentLogTimeline } from "@/components/agents/AgentLogTimeline";
import { AgentRunControls } from "@/components/agents/AgentRunControls";
import { AgentRunTimeline } from "@/components/agents/AgentRunTimeline";
import { AgentStatusBoard } from "@/components/agents/AgentStatusBoard";
import { AgentToolCallCard } from "@/components/agents/AgentToolCallCard";
import { CurrentInvestigationPanel } from "@/components/agents/CurrentInvestigationPanel";
import type {
  AgentLog,
  AgentLogFilters,
  AgentRun,
  AgentRunDetail,
  AgentStatus,
  CurrentInvestigation,
  RunScanRequest,
  RunScanResponse,
} from "@/types/agents";
import type { ClientOption } from "@/types/dashboard";

const defaultScan: RunScanRequest = {
  client_id: null,
  platform: "All",
  scan_depth: "standard",
};

const defaultFilters: AgentLogFilters = {
  agent_name: "all",
  severity: "all",
  search: "",
};

export default function AgentWorkbenchPage() {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [runDetail, setRunDetail] = useState<AgentRunDetail | null>(null);
  const [investigation, setInvestigation] = useState<CurrentInvestigation>({ empty: true });
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [filters, setFilters] = useState<AgentLogFilters>(defaultFilters);
  const [scan, setScan] = useState<RunScanRequest>(defaultScan);
  const [lastResult, setLastResult] = useState<RunScanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkbench = useCallback(async (nextFilters: AgentLogFilters) => {
    const [statusResponse, logResponse, runResponse, investigationResponse, clientResponse] = await Promise.all([
      getAgentStatuses(),
      getAgentLogs(nextFilters),
      getAgentRuns(),
      getCurrentInvestigation(),
      getClients(),
    ]);
    const latestRun = runResponse.items[0];
    const detail = latestRun ? await getAgentRunDetail(latestRun.run_id) : null;
    return { statusResponse, logResponse, runResponse, investigationResponse, clientResponse, detail };
  }, []);

  const applyWorkbench = useCallback((data: Awaited<ReturnType<typeof fetchWorkbench>>) => {
    setAgents(data.statusResponse.agents);
    setLogs(data.logResponse.items);
    setRuns(data.runResponse.items);
    setRunDetail(data.detail);
    setInvestigation(data.investigationResponse);
    setClients(data.clientResponse.clients);
    setIsFallback(data.statusResponse.source !== "database" || data.logResponse.source !== "database");
  }, []);

  const refresh = useCallback(async (nextFilters: AgentLogFilters = filters) => {
    setIsLoading(true);
    setError(null);
    try {
      applyWorkbench(await fetchWorkbench(nextFilters));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to refresh agent workbench.");
    } finally {
      setIsLoading(false);
    }
  }, [applyWorkbench, fetchWorkbench, filters]);

  useEffect(() => {
    let isCurrent = true;
    fetchWorkbench(filters)
      .then((data) => {
        if (isCurrent) applyWorkbench(data);
      })
      .catch((err) => {
        if (isCurrent) setError(err instanceof Error ? err.message : "Unable to load agent workbench.");
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [applyWorkbench, fetchWorkbench, filters]);

  const handleRunScan = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const result = await runAgentScan(scan);
      setLastResult(result);
      await refresh(filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Run scan failed.");
    } finally {
      setIsRunning(false);
    }
  };

  const updateFilters = (nextFilters: AgentLogFilters) => setFilters(nextFilters);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold gradient-text">Agent Workbench</h1>
            {isFallback && <span className="badge badge-info">Demo fallback mode</span>}
          </div>
          <p className="mt-1 max-w-4xl text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Live operational view of WasteNot&apos;s multi-agent RAG system: scans, retrieval, recommendations, risk validation, approvals, and execution readiness.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => refresh(filters)} disabled={isLoading} className="btn btn-secondary">
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
            Refresh Logs
          </button>
          <Link href="/recommendations" className="btn btn-secondary">
            <Lightbulb size={15} />
            Go to Recommendations
          </Link>
          <Link href="/data" className="btn btn-primary">
            <Database size={15} />
            Go to Data Control
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border p-3 text-sm" style={{ background: "var(--color-danger-subtle)", borderColor: "var(--color-danger)", color: "var(--color-danger)" }}>
          {error}
        </div>
      )}

      <AgentRunControls
        clients={clients}
        value={scan}
        isRunning={isRunning}
        lastResult={lastResult}
        onChange={setScan}
        onRun={handleRunScan}
      />

      {lastResult?.new_recommendation_ids?.length ? (
        <div className="glass-card p-4">
          <h2 className="text-sm font-semibold">New Recommendations</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {lastResult.new_recommendation_ids.map((id) => (
              <Link key={id} href={`/recommendations/${id}`} className="btn btn-secondary btn-sm">
                {id}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <AgentStatusBoard agents={agents} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <CurrentInvestigationPanel investigation={investigation} />
          <AgentRunTimeline detail={runDetail} />
          <AgentToolCallCard />
        </div>
        <div className="space-y-5">
          <AgentFailureRecoveryCard />
          <section className="glass-card p-4">
            <h2 className="text-sm font-semibold">Latest Runs</h2>
            <div className="mt-3 space-y-2">
              {runs.map((run) => (
                <button
                  key={run.run_id}
                  onClick={async () => setRunDetail(await getAgentRunDetail(run.run_id))}
                  className="w-full rounded-lg border p-3 text-left text-sm"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{run.run_id}</span>
                    <span className="badge badge-low">{run.status}</span>
                  </div>
                  <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>{run.summary}</p>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      <section className="space-y-3">
        <AgentFilters filters={filters} onChange={updateFilters} />
        <AgentLogTimeline logs={logs} />
      </section>
    </div>
  );
}

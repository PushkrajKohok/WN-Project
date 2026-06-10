"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bot, Database, RefreshCw } from "lucide-react";
import { ActionDetailDrawer } from "@/components/actions/ActionDetailDrawer";
import { ActionFilters, defaultActionFilters } from "@/components/actions/ActionFilters";
import { ActionHistoryTable } from "@/components/actions/ActionHistoryTable";
import { ActionSummaryCards } from "@/components/actions/ActionSummaryCards";
import { ExecutionSafetyCard } from "@/components/actions/ExecutionSafetyCard";
import { SimulateExecutionModal } from "@/components/actions/SimulateExecutionModal";
import { SimulateRollbackModal } from "@/components/actions/SimulateRollbackModal";
import {
  fallbackActionFacets,
  fallbackActionSummary,
  getActionDetail,
  getActionFacets,
  getActions,
  getActionSummary,
  simulateActionExecution,
  simulateActionRollback,
} from "@/lib/api";
import type { ActionDetail, ActionFacets, ActionFilters as Filters, ActionSummary, OptimizationAction } from "@/types/actions";

export default function ActionLogPage() {
  const [filters, setFilters] = useState<Filters>(defaultActionFilters);
  const [summary, setSummary] = useState<ActionSummary>(fallbackActionSummary);
  const [facets, setFacets] = useState<ActionFacets>(fallbackActionFacets);
  const [actions, setActions] = useState<OptimizationAction[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedDetail, setSelectedDetail] = useState<ActionDetail | undefined>();
  const [executeAction, setExecuteAction] = useState<OptimizationAction | null>(null);
  const [rollbackAction, setRollbackAction] = useState<OptimizationAction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const appliedFilters = useMemo(() => ({ ...filters }), [filters]);

  const loadData = useCallback(() => {
    setIsLoading(true);
    Promise.all([getActionSummary(), getActionFacets(), getActions(appliedFilters)])
      .then(([nextSummary, nextFacets, nextActions]) => {
        setSummary(nextSummary);
        setFacets(nextFacets);
        setActions(nextActions.items);
        setTotal(nextActions.total);
      })
      .finally(() => setIsLoading(false));
  }, [appliedFilters]);

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, [loadData]);

  const updateFilters = (nextFilters: Filters) => {
    setIsLoading(true);
    setFilters(nextFilters);
  };

  const resetFilters = () => {
    setIsLoading(true);
    setFilters({ ...defaultActionFilters });
  };

  const viewDetail = (action: OptimizationAction) => {
    getActionDetail(action.optimization_id).then((detail) => {
      if (detail) setSelectedDetail(detail);
    });
  };

  const confirmExecution = (note: string) => {
    if (!executeAction) return;
    setIsSubmitting(true);
    simulateActionExecution(executeAction.optimization_id, { executed_by: "human_ops", note })
      .then(() => {
        setNotice("Simulated execution completed. No external ad platform API was called.");
        setExecuteAction(null);
        loadData();
      })
      .catch((error) => setNotice(error.message || "Simulated execution failed."))
      .finally(() => setIsSubmitting(false));
  };

  const confirmRollback = (reason: string) => {
    if (!rollbackAction) return;
    setIsSubmitting(true);
    simulateActionRollback(rollbackAction.optimization_id, { rolled_back_by: "human_ops", reason })
      .then(() => {
        setNotice("Simulated rollback completed and audit event recorded.");
        setRollbackAction(null);
        loadData();
      })
      .catch((error) => setNotice(error.message || "Simulated rollback failed."))
      .finally(() => setIsSubmitting(false));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold gradient-text">Action Log + Rollback History</h1>
            {summary.source === "mock" && <span className="badge badge-info">Demo fallback mode</span>}
          </div>
          <p className="mt-1 max-w-3xl text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Auditable record of generated, approved, executed, rejected, and rolled-back optimizations. External ad-platform execution is simulated in this demo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={loadData} className="btn btn-secondary"><RefreshCw size={15} /> Refresh</button>
          <Link href="/recommendations" className="btn btn-secondary"><Database size={15} /> Recommendations</Link>
          <Link href="/agents" className="btn btn-primary"><Bot size={15} /> Agent Workbench</Link>
        </div>
      </div>

      {notice && (
        <div className="rounded-lg border px-4 py-3 text-sm" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
          {notice}
        </div>
      )}

      <ActionSummaryCards summary={summary} />
      <ExecutionSafetyCard />
      <ActionFilters facets={facets} filters={filters} onChange={updateFilters} onReset={resetFilters} />

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
        <span>{isLoading ? "Loading action history..." : `${total} optimization actions available`}</span>
        <span>Execution and rollback are simulated; audit trail remains real within the app.</span>
      </div>

      <ActionHistoryTable items={actions} onView={viewDetail} onExecute={setExecuteAction} onRollback={setRollbackAction} />

      {actions.length === 0 && !isLoading && (
        <div className="glass-card p-8 text-center">
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>No optimization actions found. Generate and ingest synthetic data first.</p>
          <Link href="/data" className="btn btn-primary mt-4">Go to Data & Ingestion Control</Link>
        </div>
      )}

      <ActionDetailDrawer detail={selectedDetail} onClose={() => setSelectedDetail(undefined)} />
      <SimulateExecutionModal action={executeAction} isSubmitting={isSubmitting} onClose={() => setExecuteAction(null)} onConfirm={confirmExecution} />
      <SimulateRollbackModal action={rollbackAction} isSubmitting={isSubmitting} onClose={() => setRollbackAction(null)} onConfirm={confirmRollback} />
    </div>
  );
}

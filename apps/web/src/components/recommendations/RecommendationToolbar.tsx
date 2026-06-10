"use client";

import Link from "next/link";
import { Database, RefreshCw, Workflow } from "lucide-react";

export function RecommendationToolbar({
  isLoading,
  isFallback,
  onRefresh,
}: {
  isLoading: boolean;
  isFallback: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold gradient-text">Optimization Recommendations</h1>
          {isFallback && <span className="badge badge-info">Demo fallback mode</span>}
        </div>
        <p className="text-sm mt-1 max-w-3xl" style={{ color: "var(--color-text-secondary)" }}>
          AI-generated actions from client data, ad performance, and cross-client patterns. Review, approve, reject, or request more evidence.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={onRefresh} disabled={isLoading} className="btn btn-secondary">
          <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>
        <Link href="/agents" className="btn btn-secondary">
          <Workflow size={15} />
          Go to Agent Workbench
        </Link>
        <Link href="/data" className="btn btn-primary">
          <Database size={15} />
          Go to Data Control
        </Link>
      </div>
    </div>
  );
}

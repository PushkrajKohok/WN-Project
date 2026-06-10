"use client";

import Link from "next/link";
import { Database, RotateCcw } from "lucide-react";

export function RecommendationEmptyState({
  hasFilters,
  onReset,
}: {
  hasFilters: boolean;
  onReset: () => void;
}) {
  return (
    <div className="glass-card p-10 text-center">
      <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
        {hasFilters ? "No recommendations match these filters." : "No recommendations found."}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm" style={{ color: "var(--color-text-secondary)" }}>
        {hasFilters
          ? "Clear the filters or broaden the search to review more optimization actions."
          : "Generate and ingest synthetic data from Data & Ingestion Control to populate the recommendation_records table."}
      </p>
      <div className="mt-5 flex justify-center gap-2">
        {hasFilters ? (
          <button onClick={onReset} className="btn btn-secondary">
            <RotateCcw size={15} />
            Reset filters
          </button>
        ) : (
          <Link href="/data" className="btn btn-primary">
            <Database size={15} />
            Go to Data Control
          </Link>
        )}
      </div>
    </div>
  );
}

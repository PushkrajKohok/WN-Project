"use client";

import { ArrowDownUp, Eye, Lock } from "lucide-react";
import type { BenchmarkPattern } from "@/types/patterns";

export function BenchmarkTable({
  items,
  selectedId,
  onSelect,
}: {
  items: BenchmarkPattern[];
  selectedId?: string | null;
  onSelect: (benchmark: BenchmarkPattern) => void;
}) {
  return (
    <section className="glass-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Anonymized Benchmarks</h2>
          <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            Cohort-level lift patterns only. Select a row to inspect supporting recommendations.
          </p>
        </div>
        <span className="badge badge-info flex items-center gap-1">
          <ArrowDownUp size={12} /> sortable API
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Spend band</th>
              <th>Strategy</th>
              <th>Metric</th>
              <th>Avg lift</th>
              <th>Sample</th>
              <th>Confidence</th>
              <th>Privacy</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.benchmark_id}
                className="cursor-pointer"
                onClick={() => onSelect(item)}
                style={{
                  background: selectedId === item.benchmark_id ? "var(--color-accent-subtle)" : undefined,
                }}
              >
                <td className="font-semibold text-white">{item.brand_category}</td>
                <td style={{ color: "var(--color-text-secondary)" }}>{item.monthly_ad_spend_band}</td>
                <td className="max-w-[280px] truncate" title={item.strategy} style={{ color: "var(--color-text-secondary)" }}>
                  {item.strategy}
                </td>
                <td>{item.primary_metric}</td>
                <td className="font-bold" style={{ color: "var(--color-success)" }}>
                  +{(item.avg_lift_pct * 100).toFixed(1)}%
                </td>
                <td>{item.sample_size} brands</td>
                <td>{(item.confidence_score * 100).toFixed(0)}%</td>
                <td>
                  <span className="badge badge-accent flex w-fit items-center gap-1">
                    <Lock size={10} /> {item.privacy_level}
                  </span>
                </td>
                <td>
                  <button type="button" onClick={() => onSelect(item)} className="btn btn-secondary btn-sm">
                    <Eye size={13} /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length === 0 && (
        <div className="mt-4 rounded-lg border p-8 text-center text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
          No privacy-safe benchmark cohorts match the current filters.
        </div>
      )}
    </section>
  );
}

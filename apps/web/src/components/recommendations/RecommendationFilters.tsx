"use client";

import { RotateCcw, Search } from "lucide-react";
import type { RecommendationFacets, RecommendationFilters as FilterState } from "@/types/recommendations";

const sortOptions = [
  { value: "detected_at", label: "Detected date" },
  { value: "expected_weekly_savings", label: "Savings" },
  { value: "confidence_score", label: "Confidence" },
  { value: "risk_level", label: "Risk" },
] as const;

export const defaultRecommendationFilters: FilterState = {
  client_id: "all",
  platform: "all",
  risk_level: "all",
  status: "all",
  decision_required: "all",
  search: "",
  sort_by: "detected_at",
  sort_dir: "desc",
  limit: 50,
  offset: 0,
};

export function hasActiveRecommendationFilters(filters: FilterState) {
  return (
    filters.client_id !== "all" ||
    filters.platform !== "all" ||
    filters.risk_level !== "all" ||
    filters.status !== "all" ||
    filters.decision_required !== "all" ||
    filters.search.trim().length > 0
  );
}

export function RecommendationFilters({
  facets,
  filters,
  onChange,
  onReset,
}: {
  facets: RecommendationFacets;
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}) {
  const update = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch, offset: 0 });

  return (
    <div className="glass-card p-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(240px,1.4fr)_repeat(6,minmax(130px,1fr))_auto]">
        <label className="flex items-center gap-2 rounded-lg border px-3 py-2" style={{ background: "var(--color-bg-tertiary)", borderColor: "var(--color-border)" }}>
          <Search size={16} style={{ color: "var(--color-text-muted)" }} />
          <input
            value={filters.search}
            onChange={(event) => update({ search: event.target.value })}
            placeholder="Search recommendation, client, campaign..."
            className="w-full bg-transparent text-sm outline-none"
            style={{ color: "var(--color-text-primary)" }}
          />
        </label>

        <select value={filters.client_id} onChange={(event) => update({ client_id: event.target.value })} className="rounded-lg border px-3 py-2 text-sm" style={selectStyle}>
          <option value="all">All clients</option>
          {facets.clients.map((client) => (
            <option key={client.client_id} value={client.client_id}>
              {client.brand_name}
            </option>
          ))}
        </select>

        <select value={filters.platform} onChange={(event) => update({ platform: event.target.value })} className="rounded-lg border px-3 py-2 text-sm" style={selectStyle}>
          <option value="all">All platforms</option>
          {facets.platforms.map((platform) => (
            <option key={platform} value={platform}>
              {platform}
            </option>
          ))}
        </select>

        <select value={filters.risk_level} onChange={(event) => update({ risk_level: event.target.value })} className="rounded-lg border px-3 py-2 text-sm" style={selectStyle}>
          <option value="all">All risks</option>
          {facets.risk_levels.map((risk) => (
            <option key={risk} value={risk}>
              {risk} risk
            </option>
          ))}
        </select>

        <select value={filters.status} onChange={(event) => update({ status: event.target.value })} className="rounded-lg border px-3 py-2 text-sm" style={selectStyle}>
          <option value="all">All statuses</option>
          {facets.statuses.map((status) => (
            <option key={status} value={status}>
              {status.replace(/_/g, " ")}
            </option>
          ))}
        </select>

        <select value={filters.decision_required} onChange={(event) => update({ decision_required: event.target.value })} className="rounded-lg border px-3 py-2 text-sm" style={selectStyle}>
          <option value="all">All decisions</option>
          {facets.decision_required.map((decision) => (
            <option key={decision} value={decision}>
              {decision.replace(/_/g, " ")}
            </option>
          ))}
        </select>

        <select value={filters.sort_by} onChange={(event) => update({ sort_by: event.target.value as FilterState["sort_by"] })} className="rounded-lg border px-3 py-2 text-sm" style={selectStyle}>
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              Sort: {option.label}
            </option>
          ))}
        </select>

        <select value={filters.sort_dir} onChange={(event) => update({ sort_dir: event.target.value as FilterState["sort_dir"] })} className="rounded-lg border px-3 py-2 text-sm" style={selectStyle}>
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>

        <button onClick={onReset} className="btn btn-secondary whitespace-nowrap" type="button">
          <RotateCcw size={15} />
          Reset
        </button>
      </div>
    </div>
  );
}

const selectStyle = {
  background: "var(--color-bg-tertiary)",
  borderColor: "var(--color-border)",
  color: "var(--color-text-primary)",
};

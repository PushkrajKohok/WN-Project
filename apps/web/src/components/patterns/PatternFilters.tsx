"use client";

import { RotateCcw, Search } from "lucide-react";
import type { PatternFacets, PatternFilters as Filters } from "@/types/patterns";

export const defaultPatternFilters: Filters = {
  search: "",
  brand_category: "all",
  spend_band: "all",
  metric: "all",
  privacy_level: "all",
  sort_by: "confidence_score",
  sort_dir: "desc",
  limit: 50,
  offset: 0,
};

export function PatternFilters({ facets, filters, onChange, onReset }: { facets: PatternFacets; filters: Filters; onChange: (filters: Filters) => void; onReset: () => void }) {
  const update = (patch: Partial<Filters>) => onChange({ ...filters, ...patch, offset: 0 });
  return (
    <section className="glass-card p-4">
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(260px,1.4fr)_repeat(6,minmax(130px,1fr))_auto]">
        <label className="flex items-center gap-2 rounded-lg border px-3 py-2" style={controlStyle}>
          <Search size={15} style={{ color: "var(--color-text-muted)" }} />
          <input value={filters.search} onChange={(event) => update({ search: event.target.value })} placeholder="Search strategy, category, metric..." className="w-full bg-transparent text-sm outline-none" />
        </label>
        <Select value={filters.brand_category} onChange={(value) => update({ brand_category: value })} options={facets.brand_categories} label="All categories" />
        <Select value={filters.spend_band} onChange={(value) => update({ spend_band: value })} options={facets.spend_bands} label="All spend bands" />
        <Select value={filters.metric} onChange={(value) => update({ metric: value })} options={facets.metrics} label="All metrics" />
        <Select value={filters.privacy_level} onChange={(value) => update({ privacy_level: value })} options={facets.privacy_levels} label="All privacy" />
        <select value={filters.sort_by} onChange={(event) => update({ sort_by: event.target.value as Filters["sort_by"] })} className="rounded-lg border px-3 py-2 text-sm" style={controlStyle}>
          <option value="confidence_score">Sort: Confidence</option>
          <option value="avg_lift_pct">Sort: Avg lift</option>
          <option value="sample_size">Sort: Sample size</option>
          <option value="generated_at">Sort: Generated</option>
        </select>
        <select value={filters.sort_dir} onChange={(event) => update({ sort_dir: event.target.value as Filters["sort_dir"] })} className="rounded-lg border px-3 py-2 text-sm" style={controlStyle}>
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
        <button onClick={onReset} className="btn btn-secondary"><RotateCcw size={15} /> Reset</button>
      </div>
    </section>
  );
}

function Select({ value, onChange, options, label }: { value: string; onChange: (value: string) => void; options: string[]; label: string }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-lg border px-3 py-2 text-sm" style={controlStyle}>
      <option value="all">{label}</option>
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  );
}

const controlStyle = { background: "var(--color-bg-tertiary)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" };

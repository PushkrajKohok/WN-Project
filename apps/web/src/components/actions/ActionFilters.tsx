"use client";

import { RotateCcw, Search } from "lucide-react";
import type { ActionFacets, ActionFilters as Filters } from "@/types/actions";

export const defaultActionFilters: Filters = {
  search: "",
  client_id: "all",
  platform: "all",
  risk_level: "all",
  status: "all",
  agent_name: "all",
  rollback_flag: "all",
  sort_by: "created_at",
  sort_dir: "desc",
  limit: 50,
  offset: 0,
};

export function ActionFilters({ facets, filters, onChange, onReset }: { facets: ActionFacets; filters: Filters; onChange: (filters: Filters) => void; onReset: () => void }) {
  const update = (patch: Partial<Filters>) => onChange({ ...filters, ...patch, offset: 0 });
  return (
    <section className="glass-card p-4">
      <div className="grid grid-cols-1 gap-2 xl:grid-cols-[minmax(240px,1.4fr)_repeat(8,minmax(120px,1fr))_auto]">
        <label className="flex items-center gap-2 rounded-lg border px-3 py-2" style={controlStyle}>
          <Search size={15} style={{ color: "var(--color-text-muted)" }} />
          <input value={filters.search} onChange={(event) => update({ search: event.target.value })} placeholder="Search action, campaign, actor..." className="w-full bg-transparent text-sm outline-none" />
        </label>
        <select value={filters.client_id} onChange={(event) => update({ client_id: event.target.value })} className="rounded-lg border px-3 py-2 text-sm" style={controlStyle}>
          <option value="all">All clients</option>
          {facets.clients.map((client) => <option key={client.client_id} value={client.client_id}>{client.brand_name}</option>)}
        </select>
        <Select value={filters.platform} onChange={(value) => update({ platform: value })} options={facets.platforms} label="All platforms" />
        <Select value={filters.risk_level} onChange={(value) => update({ risk_level: value })} options={facets.risk_levels} label="All risks" />
        <Select value={filters.status} onChange={(value) => update({ status: value })} options={facets.statuses} label="All statuses" />
        <Select value={filters.agent_name} onChange={(value) => update({ agent_name: value })} options={facets.agents} label="All agents" />
        <select value={filters.rollback_flag} onChange={(event) => update({ rollback_flag: event.target.value })} className="rounded-lg border px-3 py-2 text-sm" style={controlStyle}>
          <option value="all">Any rollback</option>
          <option value="true">Rolled back</option>
          <option value="false">Not rolled back</option>
        </select>
        <select value={filters.sort_by} onChange={(event) => update({ sort_by: event.target.value as Filters["sort_by"] })} className="rounded-lg border px-3 py-2 text-sm" style={controlStyle}>
          <option value="created_at">Sort: Created</option>
          <option value="confidence_score">Sort: Confidence</option>
          <option value="expected_impact_pct">Sort: Expected</option>
          <option value="actual_impact_pct">Sort: Actual</option>
          <option value="status">Sort: Status</option>
          <option value="risk_level">Sort: Risk</option>
        </select>
        <select value={filters.sort_dir} onChange={(event) => update({ sort_dir: event.target.value as Filters["sort_dir"] })} className="rounded-lg border px-3 py-2 text-sm" style={controlStyle}>
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
        <button type="button" onClick={onReset} className="btn btn-secondary"><RotateCcw size={15} /> Reset</button>
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

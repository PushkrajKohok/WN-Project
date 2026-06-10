"use client";

import { RefreshCw } from "lucide-react";
import type { ClientOption, DashboardFilters as FilterState } from "@/types/dashboard";

type Props = {
  clients: ClientOption[];
  filters: FilterState;
  isLoading: boolean;
  onChange: (filters: FilterState) => void;
  onRefresh: () => void;
};

export function DashboardFilters({ clients, filters, isLoading, onChange, onRefresh }: Props) {
  const update = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={filters.client_id || "all"}
        onChange={(event) => update({ client_id: event.target.value })}
        className="px-3 py-2 rounded-lg text-sm border min-w-[190px]"
        style={{
          background: "var(--color-bg-tertiary)",
          borderColor: "var(--color-border)",
          color: "var(--color-text-primary)",
        }}
      >
        <option value="all">All clients</option>
        {clients.map((client) => (
          <option key={client.client_id} value={client.client_id}>
            {client.brand_name}
          </option>
        ))}
      </select>

      <select
        value={filters.platform || "All"}
        onChange={(event) => update({ platform: event.target.value })}
        className="px-3 py-2 rounded-lg text-sm border"
        style={{
          background: "var(--color-bg-tertiary)",
          borderColor: "var(--color-border)",
          color: "var(--color-text-primary)",
        }}
      >
        <option value="All">All platforms</option>
        <option value="Meta">Meta</option>
        <option value="Google">Google</option>
      </select>

      <select
        value={filters.days}
        onChange={(event) => update({ days: Number(event.target.value) })}
        className="px-3 py-2 rounded-lg text-sm border"
        style={{
          background: "var(--color-bg-tertiary)",
          borderColor: "var(--color-border)",
          color: "var(--color-text-primary)",
        }}
      >
        <option value={7}>7 days</option>
        <option value={30}>30 days</option>
        <option value={90}>90 days</option>
      </select>

      <button onClick={onRefresh} disabled={isLoading} className="btn btn-secondary">
        <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
        Refresh
      </button>
    </div>
  );
}


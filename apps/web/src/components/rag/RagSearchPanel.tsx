"use client";

import { Search } from "lucide-react";
import type { RagSearchRequest } from "@/types/rag";

export function RagSearchPanel({ value, onChange, onSubmit, isLoading }: { value: RagSearchRequest; onChange: (value: RagSearchRequest) => void; onSubmit: () => void; isLoading: boolean }) {
  const patch = (patchValue: Partial<RagSearchRequest>) => onChange({ ...value, ...patchValue });
  return (
    <section className="glass-card p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold"><Search size={18} style={{ color: "var(--color-accent)" }} /> RAG Search</h2>
      <textarea value={value.query} onChange={(event) => patch({ query: event.target.value })} className="mt-4 h-24 w-full rounded-lg border p-3 text-sm" style={fieldStyle} placeholder="Why should we exclude recent buyers from Meta prospecting?" />
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <input value={value.client_id || ""} onChange={(event) => patch({ client_id: event.target.value || undefined })} className="rounded-lg border px-3 py-2 text-sm" style={fieldStyle} placeholder="Client ID optional" />
        <input value={value.recommendation_id || ""} onChange={(event) => patch({ recommendation_id: event.target.value || undefined })} className="rounded-lg border px-3 py-2 text-sm" style={fieldStyle} placeholder="Recommendation ID optional" />
        <select value={value.top_k} onChange={(event) => patch({ top_k: Number(event.target.value) })} className="rounded-lg border px-3 py-2 text-sm" style={fieldStyle}>
          {[4, 6, 8, 10, 12].map((count) => <option key={count} value={count}>Top {count}</option>)}
        </select>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Toggle label="SQL context" checked={value.include_sql} onChange={(checked) => patch({ include_sql: checked })} />
        <Toggle label="RAG documents" checked={value.include_rag_docs} onChange={(checked) => patch({ include_rag_docs: checked })} />
        <Toggle label="Graph context" checked={value.include_graph} onChange={(checked) => patch({ include_graph: checked })} />
      </div>
      <button type="button" onClick={onSubmit} disabled={isLoading || !value.query.trim()} className="btn btn-primary mt-4">
        Run Retrieval
      </button>
    </section>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

const fieldStyle = { background: "var(--color-bg-tertiary)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" };

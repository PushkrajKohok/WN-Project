"use client";

import type { RagDocumentResult } from "@/types/rag";

export function RagResultCard({ doc }: { doc: RagDocumentResult }) {
  return (
    <article className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold">{doc.doc_id}</div>
        <span className="badge badge-accent">{(doc.relevance_score * 100).toFixed(0)}% relevant</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
        <span>{doc.doc_type}</span>
        <span>{doc.embedding_group}</span>
        <span>{doc.source_table}</span>
        <span>{doc.source_record_id}</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{doc.snippet || doc.text}</p>
    </article>
  );
}

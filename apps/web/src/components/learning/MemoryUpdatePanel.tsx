"use client";

import { timeAgo } from "@/lib/utils";
import type { LearningMemoryDocument } from "@/types/learning";

export function MemoryUpdatePanel({ items }: { items: LearningMemoryDocument[] }) {
  return (
    <section className="glass-card p-5">
      <h2 className="text-sm font-semibold">RAG Memory Updates</h2>
      <div className="mt-4 space-y-3">
        {items.map((doc) => (
          <div key={doc.doc_id} className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
            <div className="flex flex-wrap justify-between gap-2">
              <div className="text-sm font-semibold">{doc.doc_id}</div>
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{doc.updated_at ? timeAgo(doc.updated_at) : "recent"}</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
              <span>{doc.client_id}</span><span>{doc.doc_type}</span><span>{doc.embedding_group}</span>
            </div>
            <p className="mt-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>{doc.text.slice(0, 260)}</p>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>No learning-memory RAG documents yet.</p>}
      </div>
    </section>
  );
}

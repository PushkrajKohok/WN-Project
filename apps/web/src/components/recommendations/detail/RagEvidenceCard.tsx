"use client";

import { FileSearch } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import type { RagEvidence } from "@/types/evidence";

export function RagEvidenceCard({ evidence }: { evidence: RagEvidence }) {
  return (
    <section className="glass-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <FileSearch size={16} style={{ color: "#a855f7" }} />
        <h2 className="text-sm font-semibold">RAG Documents</h2>
      </div>
      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
        These documents simulate the text chunks that would be embedded for hybrid RAG retrieval.
      </p>
      <div className="mt-4 space-y-3">
        {evidence.documents.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No matching RAG documents were found.</p>
        ) : (
          evidence.documents.map((doc) => (
            <article key={doc.doc_id} className="rounded-lg border p-3" style={{ background: "var(--color-bg-tertiary)", borderColor: "var(--color-border)" }}>
              <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                <span className="badge badge-accent">{doc.doc_type || "document"}</span>
                <span>{doc.embedding_group || "default"}</span>
                <span>{doc.source_table}:{doc.source_record_id}</span>
                {doc.updated_at && <span>{timeAgo(doc.updated_at)}</span>}
              </div>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{doc.text}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

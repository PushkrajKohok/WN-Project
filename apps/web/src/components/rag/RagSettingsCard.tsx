"use client";

import type { LlmStatus } from "@/types/rag";

export function RagSettingsCard({ status }: { status?: LlmStatus }) {
  const settings = [
    ["Mode", status?.mode?.replace(/_/g, " ") || "keyword fallback"],
    ["LLM", status?.llm_features_enabled ? "enabled" : "disabled"],
    ["LLM model", status?.model || "gpt-4o"],
    ["Vector RAG", status?.vector_rag_enabled ? "enabled" : "disabled"],
    ["OpenAI key", status?.openai_key_configured ? "configured" : "missing"],
    ["Embedding model", status?.embedding_model || "text-embedding-3-small"],
    ["Embedded docs", `${status?.embedded_docs_count ?? 0} / ${status?.total_rag_docs_count ?? 0}`],
    ["Safety", "deterministic guardrails control execution"],
  ];
  return (
    <section className="glass-card p-5">
      <h2 className="text-sm font-semibold">Real RAG Status</h2>
      <div className="mt-4 space-y-2">
        {settings.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
            <span style={{ color: "var(--color-text-secondary)" }}>{label}</span>
            <span className="font-semibold text-right">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

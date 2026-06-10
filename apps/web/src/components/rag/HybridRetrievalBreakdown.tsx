"use client";

import { Database, FileText, GitBranch } from "lucide-react";
import type { RagSearchResponse } from "@/types/rag";

export function HybridRetrievalBreakdown({ response }: { response?: RagSearchResponse }) {
  if (!response) return null;
  const cards = [
    ["SQL Context", response.sql_context?.performance_summary ? 1 : 0, "Structured metrics, campaign settings, and optimization history.", <Database key="sql" size={18} />],
    ["RAG Documents", response.rag_documents.length, "Keyword and deterministic semantic-style text matches.", <FileText key="docs" size={18} />],
    ["Graph/Benchmark", (response.graph_context?.edges?.length || 0) + response.benchmark_context.length, "Benchmark support and graph relationships.", <GitBranch key="graph" size={18} />],
  ];
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {cards.map(([label, count, text, icon]) => (
        <div key={String(label)} className="glass-card p-4">
          <div style={{ color: "var(--color-accent)" }}>{icon}</div>
          <div className="mt-3 text-2xl font-bold">{count}</div>
          <div className="text-sm font-semibold">{label}</div>
          <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>{text}</p>
        </div>
      ))}
    </div>
  );
}

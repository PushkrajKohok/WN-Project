"use client";

import Link from "next/link";
import { useState } from "react";
import { Bot, Lightbulb, RefreshCw } from "lucide-react";
import { EvidenceScoreCard } from "@/components/rag/EvidenceScoreCard";
import { GraphContextPanel } from "@/components/rag/GraphContextPanel";
import { HybridRetrievalBreakdown } from "@/components/rag/HybridRetrievalBreakdown";
import { RagEmptyState } from "@/components/rag/RagEmptyState";
import { RagResultCard } from "@/components/rag/RagResultCard";
import { RagSearchPanel } from "@/components/rag/RagSearchPanel";
import { RagSettingsCard } from "@/components/rag/RagSettingsCard";
import { RetrievalTraceTimeline } from "@/components/rag/RetrievalTraceTimeline";
import { SqlContextPanel } from "@/components/rag/SqlContextPanel";
import { rebuildRagIndex, searchRag } from "@/lib/api";
import type { RagRebuildIndexResponse, RagSearchRequest, RagSearchResponse } from "@/types/rag";

const defaultSearch: RagSearchRequest = {
  query: "Why should we exclude recent buyers from Meta prospecting?",
  top_k: 8,
  include_sql: true,
  include_graph: true,
  include_rag_docs: true,
};

export default function RagPage() {
  const [request, setRequest] = useState<RagSearchRequest>(defaultSearch);
  const [response, setResponse] = useState<RagSearchResponse | undefined>();
  const [rebuild, setRebuild] = useState<RagRebuildIndexResponse | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const runSearch = () => {
    setIsLoading(true);
    setNotice(null);
    searchRag(request)
      .then((result) => {
        setResponse(result);
        if (result.source === "mock") setNotice("Demo fallback mode");
      })
      .finally(() => setIsLoading(false));
  };

  const runRebuild = () => {
    setIsLoading(true);
    rebuildRagIndex()
      .then((result) => {
        setRebuild(result);
        setNotice(`RAG index rebuild ${result.status}: ${result.documents_indexed} documents indexed.`);
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold gradient-text">RAG Retrieval Layer</h1>
            {response?.source === "mock" && <span className="badge badge-info">Demo fallback mode</span>}
          </div>
          <p className="mt-1 max-w-3xl text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Hybrid retrieval over SQL metrics, RAG documents, and cross-client graph context with corrective evidence scoring.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={runRebuild} disabled={isLoading} className="btn btn-primary"><RefreshCw size={15} /> Rebuild RAG Index</button>
          <Link href="/recommendations" className="btn btn-secondary"><Lightbulb size={15} /> Recommendations</Link>
          <Link href="/agents" className="btn btn-secondary"><Bot size={15} /> Agent Workbench</Link>
        </div>
      </div>

      {notice && <div className="rounded-lg border px-4 py-3 text-sm" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>{notice}</div>}
      {rebuild && (
        <div className="rounded-lg border px-4 py-3 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
          Embedding mode: {rebuild.embedding_mode}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <RagSearchPanel value={request} onChange={setRequest} onSubmit={runSearch} isLoading={isLoading} />
        <RagSettingsCard />
      </div>

      {!response && <RagEmptyState />}
      <HybridRetrievalBreakdown response={response} />
      <EvidenceScoreCard score={response?.evidence_score} />

      {response && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <SqlContextPanel context={response.sql_context} />
          <GraphContextPanel graph={response.graph_context} benchmarks={response.benchmark_context} />
        </div>
      )}

      {response && (
        <section className="glass-card p-5">
          <h2 className="text-sm font-semibold">Retrieved RAG Documents</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
            {response.rag_documents.map((doc) => <RagResultCard key={doc.doc_id} doc={doc} />)}
          </div>
        </section>
      )}

      {response && <RetrievalTraceTimeline steps={response.retrieval_trace} />}
    </div>
  );
}

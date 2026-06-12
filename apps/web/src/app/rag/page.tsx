"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bot, Lightbulb, RefreshCw, Search, Sparkles } from "lucide-react";
import { EvidenceScoreCard } from "@/components/rag/EvidenceScoreCard";
import { GraphContextPanel } from "@/components/rag/GraphContextPanel";
import { HybridRetrievalBreakdown } from "@/components/rag/HybridRetrievalBreakdown";
import { RagEmptyState } from "@/components/rag/RagEmptyState";
import { RagResultCard } from "@/components/rag/RagResultCard";
import { RagSearchPanel } from "@/components/rag/RagSearchPanel";
import { RagSettingsCard } from "@/components/rag/RagSettingsCard";
import { RetrievalTraceTimeline } from "@/components/rag/RetrievalTraceTimeline";
import { SqlContextPanel } from "@/components/rag/SqlContextPanel";
import { getLlmStatus, hybridSearch, rebuildEmbeddings, rebuildRagIndex, searchRag, vectorSearch } from "@/lib/api";
import type { HybridSearchResponse, LlmStatus, RagRebuildIndexResponse, RagSearchRequest, RagSearchResponse, VectorSearchResponse } from "@/types/rag";

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
  const [llmStatus, setLlmStatus] = useState<LlmStatus | undefined>();
  const [vectorResponse, setVectorResponse] = useState<VectorSearchResponse | undefined>();
  const [hybridResponse, setHybridResponse] = useState<HybridSearchResponse | undefined>();
  const [rebuild, setRebuild] = useState<RagRebuildIndexResponse | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    getLlmStatus().then(setLlmStatus);
  }, []);

  const runSearch = () => {
    setIsLoading(true);
    setNotice(null);
    Promise.all([
      searchRag(request),
      hybridSearch({ query: request.query, recommendation_id: request.recommendation_id, client_id: request.client_id, limit: request.top_k }).catch(() => undefined),
    ])
      .then(([result, hybrid]) => {
        setResponse(result);
        setHybridResponse(hybrid);
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

  const runEmbeddingRebuild = () => {
    setIsLoading(true);
    setNotice(null);
    rebuildEmbeddings(500, false)
      .then((result) => {
        setNotice(`Embeddings rebuilt: ${result.embedded} embedded, ${result.skipped} skipped.`);
        return getLlmStatus().then(setLlmStatus);
      })
      .catch((error) => setNotice(error instanceof Error ? error.message : "Embedding rebuild unavailable."))
      .finally(() => setIsLoading(false));
  };

  const runVectorSearch = () => {
    setIsLoading(true);
    vectorSearch({ query: request.query, limit: request.top_k, client_id: request.client_id })
      .then(setVectorResponse)
      .finally(() => setIsLoading(false));
  };

  const modeLabel = llmStatus?.mode === "vector_rag_ready" ? "Vector RAG Active" : llmStatus?.llm_features_enabled ? "Keyword Fallback Active" : "LLM Disabled";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold gradient-text">RAG Retrieval Layer</h1>
            {response?.source === "mock" && <span className="badge badge-info">Demo fallback mode</span>}
            <span className="badge badge-low">{modeLabel}</span>
          </div>
          <p className="mt-1 max-w-3xl text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Hybrid retrieval over SQL metrics, RAG documents, and cross-client graph context with corrective evidence scoring.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={runRebuild} disabled={isLoading} className="btn btn-primary"><RefreshCw size={15} /> Rebuild RAG Index</button>
          <button type="button" onClick={runEmbeddingRebuild} disabled={isLoading} className="btn btn-secondary"><Sparkles size={15} /> Rebuild Missing Embeddings</button>
          <button type="button" onClick={runVectorSearch} disabled={isLoading} className="btn btn-secondary"><Search size={15} /> Vector Search</button>
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
        <RagSettingsCard status={llmStatus} />
      </div>

      {!response && <RagEmptyState />}
      <HybridRetrievalBreakdown response={response} />
      {hybridResponse && (
        <section className="glass-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Hybrid RAG Score Breakdown</h2>
            <span className="badge badge-info">{hybridResponse.mode.replace(/_/g, " ")}</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-6">
            {Object.entries(hybridResponse.evidence_score).filter(([, value]) => typeof value === "number").map(([key, value]) => (
              <div key={key} className="rounded-lg border p-3 text-sm" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
                <div className="text-xs capitalize" style={{ color: "var(--color-text-secondary)" }}>{key.replace(/_/g, " ")}</div>
                <div className="mt-1 font-semibold">{(Number(value) * 100).toFixed(0)}%</div>
              </div>
            ))}
          </div>
          {hybridResponse.vector_error && <p className="mt-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>{hybridResponse.vector_error}</p>}
        </section>
      )}
      <EvidenceScoreCard score={response?.evidence_score} />

      {vectorResponse && (
        <section className="glass-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Vector Search Results</h2>
            <span className="badge badge-info">{vectorResponse.mode.replace(/_/g, " ")}</span>
          </div>
          {vectorResponse.error_message && <p className="mt-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>{vectorResponse.error_message}</p>}
          <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
            {vectorResponse.results.map((doc) => (
              <RagResultCard key={doc.doc_id} doc={{ ...doc, relevance_score: doc.similarity_score || doc.relevance_score }} />
            ))}
          </div>
        </section>
      )}

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

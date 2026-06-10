export interface RagSearchRequest {
  query: string;
  client_id?: string;
  recommendation_id?: string;
  top_k: number;
  include_sql: boolean;
  include_graph: boolean;
  include_rag_docs: boolean;
}

export interface RagDocumentResult {
  doc_id: string;
  client_id?: string | null;
  doc_type?: string | null;
  source_table?: string | null;
  source_record_id?: string | null;
  chunk_id?: number | null;
  embedding_group?: string | null;
  text: string;
  snippet: string;
  updated_at?: string | null;
  relevance_score: number;
}

export interface SqlContext {
  client?: Record<string, unknown>;
  campaign?: Record<string, unknown>;
  performance_summary?: Record<string, unknown>;
  recent_trend?: Array<Record<string, unknown>>;
  optimization_history?: Array<Record<string, unknown>>;
}

export interface GraphContext {
  edges: Array<Record<string, unknown>>;
  similar_client_edge_count?: number;
}

export interface BenchmarkContext {
  benchmark_id?: string;
  brand_category?: string;
  monthly_ad_spend_band?: string;
  strategy?: string;
  avg_lift_pct: number;
  sample_size: number;
  confidence_score: number;
  privacy_level?: string;
}

export interface EvidenceScore {
  overall_score: number;
  sql_score: number;
  rag_score: number;
  graph_score: number;
  freshness_score: number;
  guardrail_compliance?: number;
  recommendation: string;
  decision: string;
  review_required: boolean;
  score_breakdown?: Record<string, number>;
  reasons?: string[];
}

export interface RetrievalTraceStep {
  step: number;
  retriever: string;
  summary: string;
  status: string;
}

export interface RagSearchResponse {
  query: string;
  client_id?: string;
  recommendation_id?: string;
  recommendation?: Record<string, unknown>;
  results: {
    sql_context: SqlContext;
    rag_documents: RagDocumentResult[];
    graph_context: Array<Record<string, unknown>>;
    benchmark_context: BenchmarkContext[];
  };
  sql_context: SqlContext;
  rag_documents: RagDocumentResult[];
  graph_context: GraphContext;
  benchmark_context: BenchmarkContext[];
  evidence_score: EvidenceScore;
  retrieval_trace: RetrievalTraceStep[];
  source?: string;
}

export interface RagFacetResponse {
  doc_types: string[];
  embedding_groups: string[];
  source_tables: string[];
  source?: string;
}

export interface RagDocumentListResponse {
  items: RagDocumentResult[];
  total: number;
  limit: number;
  offset: number;
  source?: string;
}

export interface RagRebuildIndexResponse {
  status: string;
  documents_indexed: number;
  embedding_mode: string;
}

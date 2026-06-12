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

export interface LlmStatus {
  llm_features_enabled: boolean;
  vector_rag_enabled: boolean;
  openai_key_configured: boolean;
  model: string;
  embedding_model: string;
  embedding_dimensions: number;
  openai_sdk_available?: boolean;
  database_configured?: boolean;
  embedded_docs_count?: number;
  total_rag_docs_count?: number;
  last_embedding_update?: string | null;
  mode?: string;
  error_message?: string;
}

export interface VectorSearchRequest {
  query: string;
  limit?: number;
  client_id?: string | null;
  embedding_group?: string | null;
}

export interface VectorSearchResponse {
  mode: string;
  query: string;
  results: Array<RagDocumentResult & { distance?: number; similarity_score?: number }>;
  error_message?: string;
}

export interface HybridSearchRequest {
  query: string;
  recommendation_id?: string | null;
  client_id?: string | null;
  campaign_id?: string | null;
  limit?: number;
}

export interface HybridSearchResponse {
  mode: "vector_hybrid" | "fallback_keyword";
  query: string;
  recommendation_id?: string | null;
  client_id?: string | null;
  sql_context: SqlContext;
  vector_results: VectorSearchResponse["results"];
  keyword_results: RagDocumentResult[];
  graph_context: Array<Record<string, unknown>>;
  benchmark_context: BenchmarkContext[];
  evidence_score: Record<string, number | boolean | string>;
  final_score: number;
  review_required: boolean;
  retrieval_trace: RetrievalTraceStep[];
  vector_error?: string | null;
}

export interface EmbeddingRebuildResponse {
  status: string;
  embedded: number;
  skipped: number;
  limit: number;
  force: boolean;
}

export interface RecommendationLlmExplanation {
  status: string;
  recommendation_id: string;
  explanation?: {
    summary?: string;
    why_now?: string;
    evidence_used?: string[];
    risk_notes?: string[];
    recommended_action?: string;
    approval_required?: boolean;
    confidence_adjustment?: number;
  };
  error_message?: string;
  notice?: string;
}

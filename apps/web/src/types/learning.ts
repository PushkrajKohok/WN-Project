export interface LearningSummary {
  total_learning_events: number;
  outcomes_measured: number;
  successful_outcomes: number;
  rolled_back_outcomes: number;
  avg_measured_impact_pct: number;
  strategies_tracked: number;
  rag_docs_created: number;
  benchmarks_updated: number;
  graph_edges_updated: number;
  last_learning_cycle_at?: string | null;
  source?: string;
}

export interface RunLearningCycleRequest {
  window_days: number;
  client_id?: string | null;
  mode: "quick" | "standard" | "deep";
}

export interface RunLearningCycleResponse {
  status: string;
  learning_events_created: number;
  outcome_measurements_created: number;
  rag_documents_created: number;
  benchmarks_updated: number;
  graph_edges_updated: number;
  summary: string;
  source?: string;
}

export interface LearningEvent {
  event_id: string;
  source_type: string;
  source_id: string;
  client_id?: string | null;
  strategy?: string | null;
  platform?: string | null;
  outcome_type?: string | null;
  outcome_status?: string | null;
  expected_impact_pct?: number | null;
  actual_impact_pct?: number | null;
  confidence_before?: number | null;
  confidence_after?: number | null;
  benchmark_id?: string | null;
  graph_edge_id?: string | null;
  rag_doc_id?: string | null;
  learning_summary?: string | null;
  created_at?: string | null;
}

export interface OutcomeMeasurement {
  measurement_id: string;
  recommendation_id?: string | null;
  optimization_id?: string | null;
  client_id?: string | null;
  brand_name?: string | null;
  campaign_id?: string | null;
  platform?: string | null;
  measurement_window_days: number;
  spend_before: number;
  spend_after: number;
  revenue_before: number;
  revenue_after: number;
  roas_before: number;
  roas_after: number;
  cpa_before: number;
  cpa_after: number;
  purchases_before: number;
  purchases_after: number;
  measured_impact_pct: number;
  outcome_label: string;
  created_at?: string | null;
}

export interface StrategyLearningScore {
  strategy_key: string;
  strategy?: string | null;
  brand_category?: string | null;
  spend_band?: string | null;
  platform?: string | null;
  total_trials: number;
  successful_trials: number;
  rolled_back_trials: number;
  avg_actual_impact_pct: number;
  avg_confidence: number;
  learning_score: number;
  last_updated_at?: string | null;
}

export interface LearningMemoryDocument {
  doc_id: string;
  client_id?: string | null;
  doc_type?: string | null;
  source_table?: string | null;
  source_record_id?: string | null;
  embedding_group?: string | null;
  text: string;
  updated_at?: string | null;
}

export interface PromoteToBenchmarkRequest {
  strategy_key: string;
}

export interface PromoteToBenchmarkResponse {
  benchmark: Record<string, unknown>;
  source?: string;
}

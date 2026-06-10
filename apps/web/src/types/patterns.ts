export interface PatternSummary {
  total_benchmarks: number;
  total_graph_edges: number;
  unique_categories: number;
  unique_spend_bands: number;
  avg_confidence: number;
  avg_lift_pct: number;
  total_sample_size: number;
  privacy_levels: Record<string, number>;
  source?: string;
}

export interface BenchmarkPattern {
  benchmark_id: string;
  anonymized_cohort_id: string;
  brand_category: string;
  monthly_ad_spend_band: string;
  strategy: string;
  primary_metric: string;
  avg_lift_pct: number;
  median_lift_pct: number;
  sample_size: number;
  confidence_score: number;
  privacy_level: string;
  generated_at?: string | null;
  related_recommendation_count: number;
}

export interface PatternFacets {
  brand_categories: string[];
  spend_bands: string[];
  metrics: string[];
  privacy_levels: string[];
  source?: string;
}

export interface StrategyLiftItem {
  strategy: string;
  avg_lift_pct: number;
  median_lift_pct: number;
  avg_confidence: number;
  sample_size: number;
  benchmark_count: number;
}

export interface PatternGraphNode {
  id: string;
  type: string;
  label: string;
  metadata: Record<string, unknown>;
}

export interface PatternGraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  weight: number;
  evidence_count: number;
  last_updated_at?: string | null;
}

export interface PatternGraphResponse {
  nodes: PatternGraphNode[];
  edges: PatternGraphEdge[];
  source?: string;
}

export interface BenchmarkDetail {
  benchmark: BenchmarkPattern;
  related_recommendations: Array<{
    recommendation_id: string;
    title: string;
    brand_name?: string;
    target_platform?: string;
    expected_weekly_savings: number;
    confidence_score: number;
    risk_level: string;
    status?: string;
  }>;
  related_rag_documents: Array<Record<string, unknown>>;
  related_graph_edges: PatternGraphEdge[];
  privacy_note: string;
  source?: string;
}

export interface PatternFilters {
  search: string;
  brand_category: string;
  spend_band: string;
  metric: string;
  privacy_level: string;
  sort_by: "avg_lift_pct" | "confidence_score" | "sample_size" | "generated_at";
  sort_dir: "asc" | "desc";
  limit: number;
  offset: number;
}

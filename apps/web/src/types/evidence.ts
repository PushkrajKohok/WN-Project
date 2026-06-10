import type { RecommendationRecord } from "@/types/recommendations";

export interface RecommendationDetailResponse {
  recommendation: RecommendationRecord;
  client: Record<string, unknown>;
  campaign: CampaignSettings;
  evidence: RecommendationEvidence;
  risk_validation: RiskValidation;
  agent_trace: AgentTraceStep[];
  rollback_plan: RollbackPlan;
  related_history: RelatedPastAction[];
  source?: string;
}

export interface RecommendationEvidence {
  sql_evidence: SqlEvidence;
  graph_evidence: GraphEvidence;
  rag_evidence: RagEvidence;
}

export interface SqlEvidence {
  campaign_performance: CampaignPerformance;
  recent_trend: TrendPoint[];
  campaign_settings: CampaignSettings;
}

export interface CampaignPerformance {
  lookback_days: number;
  total_spend: number;
  total_revenue: number;
  roas: number;
  cpa: number;
  purchases: number;
  avg_frequency: number;
}

export interface TrendPoint {
  date: string;
  spend: number;
  revenue: number;
  roas: number;
  cpa: number;
  purchases: number;
}

export interface CampaignSettings {
  campaign_name?: string | null;
  objective?: string | null;
  status?: string | null;
  daily_budget?: number;
  bid_strategy?: string | null;
  attribution_window?: string | null;
}

export interface GraphEvidence {
  supporting_benchmark: SupportingBenchmark;
  related_edges: GraphEdge[];
  similar_client_count: number;
  source?: string;
}

export interface SupportingBenchmark {
  benchmark_id?: string | null;
  brand_category?: string | null;
  monthly_ad_spend_band?: string | null;
  strategy?: string | null;
  primary_metric?: string | null;
  avg_lift_pct: number;
  median_lift_pct: number;
  sample_size: number;
  confidence_score: number;
  privacy_level?: string | null;
}

export interface GraphEdge {
  relationship?: string | null;
  source_node_type?: string | null;
  target_node_type?: string | null;
  weight: number;
  evidence_count: number;
}

export interface RagEvidence {
  documents: RagEvidenceDocument[];
  source?: string;
}

export interface RagEvidenceDocument {
  doc_id: string;
  doc_type?: string | null;
  embedding_group?: string | null;
  source_table?: string | null;
  source_record_id?: string | null;
  text: string;
  updated_at?: string | null;
}

export interface RiskValidation {
  confidence_threshold: number;
  recommendation_confidence: number;
  risk_level: string;
  decision_required: string;
  data_freshness_status: string;
  sample_size_status: string;
  benchmark_quality: string;
  rollback_available: boolean;
  auto_execute_allowed: boolean;
  validation_checks: ValidationCheck[];
}

export interface ValidationCheck {
  check: string;
  status: "passed" | "review_required" | "failed" | string;
  detail: string;
}

export interface AgentTraceStep {
  step: number;
  agent_name: string;
  status: string;
  summary: string;
  tool_used: string;
  timestamp?: string | null;
}

export interface RollbackPlan {
  rollback_available: boolean;
  rollback_type: string;
  summary: string;
  steps: string[];
  related_past_actions: RelatedPastAction[];
}

export interface RelatedPastAction {
  optimization_id: string;
  action_type: string;
  status: string;
  actual_impact_pct: number;
  rollback_flag: boolean;
}

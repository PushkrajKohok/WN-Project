export type RecommendationStatus =
  | "new"
  | "approved"
  | "executed"
  | "dismissed"
  | "needs_more_evidence"
  | string;

export type RecommendationDecision =
  | "human_approval"
  | "auto_execute_allowed"
  | string;

export type RiskLevel = "Low" | "Medium" | "High" | string;
export type DecisionRequired = RecommendationDecision;

export type RecommendationSortBy =
  | "detected_at"
  | "expected_weekly_savings"
  | "confidence_score"
  | "risk_level";

export interface RecommendationRecord {
  recommendation_id: string;
  client_id: string;
  brand_name: string;
  brand_category?: string | null;
  monthly_ad_spend_band?: string | null;
  recommendation_type: string;
  title: string;
  target_platform: string;
  target_campaign_id?: string | null;
  evidence_summary: string;
  supporting_benchmark_id?: string | null;
  expected_weekly_savings: number;
  expected_roas_lift_pct: number;
  confidence_score: number;
  risk_level: RiskLevel;
  decision_required: RecommendationDecision;
  status: RecommendationStatus;
  detected_at?: string | null;
}

export interface RecommendationFilters {
  client_id: string;
  platform: string;
  risk_level: string;
  status: string;
  decision_required: string;
  search: string;
  sort_by: RecommendationSortBy;
  sort_dir: "asc" | "desc";
  limit: number;
  offset: number;
}

export interface RecommendationListResponse {
  items: RecommendationRecord[];
  total: number;
  limit: number;
  offset: number;
  source?: string;
}

export interface RecommendationFacets {
  clients: Array<{
    client_id: string;
    brand_name: string;
    brand_category?: string | null;
  }>;
  platforms: string[];
  risk_levels: string[];
  statuses: RecommendationStatus[];
  decision_required: RecommendationDecision[];
  source?: string;
}

export interface RecommendationSummary {
  total: number;
  new: number;
  approved: number;
  executed: number;
  dismissed: number;
  needs_more_evidence: number;
  human_approval_required: number;
  auto_execute_allowed: number;
  high_risk: number;
  estimated_weekly_savings: number;
  source?: string;
}

export type RecommendationAction = "approve" | "reject" | "needs-more-evidence";

export interface RecommendationActionRequest {
  approved_by?: string;
  rejected_by?: string;
  requested_by?: string;
  note?: string;
  reason?: string;
}

export type Recommendation = RecommendationRecord;

export type PrivacyMode = "aggregated_only" | "k_anonymized" | "internal_firewalled";

export interface GuardrailSettings {
  confidence_threshold: number;
  auto_execute_confidence_threshold: number;
  max_auto_execute_weekly_savings: number;
  high_risk_requires_approval: boolean;
  medium_risk_requires_approval: boolean;
  budget_changes_require_approval: boolean;
  campaign_pause_requires_approval: boolean;
  rollback_required_for_execution: boolean;
  fresh_data_required: boolean;
  max_data_staleness_hours: number;
  auto_execute_low_risk_audience_refresh: boolean;
  auto_execute_tracking_fix: boolean;
  auto_execute_budget_shift: boolean;
  auto_execute_campaign_pause: boolean;
  cross_client_privacy_mode: PrivacyMode;
  require_benchmark_support: boolean;
  min_benchmark_sample_size: number;
  min_benchmark_confidence: number;
  updated_at?: string | null;
  source?: string;
}

export type GuardrailUpdateRequest = Partial<Omit<GuardrailSettings, "updated_at" | "source">>;

export interface GuardrailImpactPreview {
  total_recommendations: number;
  auto_execute_eligible: number;
  human_approval_required: number;
  needs_more_evidence: number;
  blocked_by_guardrails: number;
  high_risk_blocked_or_review: number;
  budget_or_pause_review: number;
  low_confidence_review: number;
  missing_benchmark_review: number;
  source?: string;
}

export interface GuardrailAuditLogItem {
  log_id: string;
  agent_name: string;
  message: string;
  severity: string;
  created_at?: string | null;
}

export interface ActionSummary {
  total_actions: number;
  generated: number;
  approved: number;
  executed: number;
  rejected: number;
  pending_review: number;
  rolled_back: number;
  rollback_rate: number;
  avg_confidence: number;
  estimated_avg_impact_pct: number;
  actual_avg_impact_pct: number;
  source?: string;
}

export interface OptimizationAction {
  optimization_id: string;
  recommendation_id?: string | null;
  client_id: string;
  brand_name: string;
  brand_category?: string | null;
  created_at: string;
  agent_name: string;
  action_type: string;
  target_platform: string;
  target_campaign_id?: string | null;
  campaign_name?: string | null;
  reason: string;
  expected_impact_pct: number;
  confidence_score: number;
  risk_level: "Low" | "Medium" | "High" | string;
  status: "Generated" | "Approved" | "Executed" | "Rejected" | "Pending Review" | "Rolled Back" | string;
  approved_by?: string | null;
  actual_impact_pct?: number | null;
  rollback_flag: boolean;
  evidence_refs: string[];
}

export interface ActionListResponse {
  items: OptimizationAction[];
  total: number;
  limit: number;
  offset: number;
  source?: string;
}

export interface ActionFilters {
  search: string;
  client_id: string;
  platform: string;
  risk_level: string;
  status: string;
  agent_name: string;
  rollback_flag: string;
  sort_by: "created_at" | "confidence_score" | "expected_impact_pct" | "actual_impact_pct" | "status" | "risk_level";
  sort_dir: "asc" | "desc";
  limit: number;
  offset: number;
}

export interface ActionFacets {
  clients: Array<{ client_id: string; brand_name: string }>;
  platforms: string[];
  risk_levels: string[];
  statuses: string[];
  agents: string[];
  source?: string;
}

export interface ActionAuditEvent {
  audit_id: string;
  action_id?: string | null;
  recommendation_id?: string | null;
  client_id?: string | null;
  event_type: string;
  event_status: string;
  actor?: string | null;
  message?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface RollbackPlan {
  rollback_available: boolean;
  rollback_type: string;
  summary: string;
  steps: string[];
  rollback_eligibility: string;
  blocking_reason?: string | null;
}

export interface ActionDetail {
  action: OptimizationAction;
  client: Record<string, unknown>;
  campaign: Record<string, unknown>;
  related_recommendation: Record<string, unknown> | null;
  audit_events: ActionAuditEvent[];
  rollback_plan: RollbackPlan;
  safety_checks: Array<{ label: string; status: string; message: string }>;
  source?: string;
}

export interface SimulateExecutionRequest {
  executed_by: string;
  note: string;
}

export interface SimulateRollbackRequest {
  rolled_back_by: string;
  reason: string;
}

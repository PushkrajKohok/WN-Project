export type DashboardSource = "database" | "mock" | "fallback";

export interface DashboardSummary {
  total_clients: number;
  total_spend: number;
  total_revenue: number;
  avg_roas: number;
  avg_cpa: number;
  total_purchases: number;
  active_recommendations: number;
  high_risk_alerts: number;
  executed_actions: number;
  rolled_back_actions: number;
  estimated_weekly_savings: number;
  latest_ingestion_status: string | null;
  latest_ingestion_at: string | null;
  schema_drift_open_items: number;
  cross_client_patterns: number;
  knowledge_graph_edges: number;
  source?: DashboardSource | string;
  is_empty?: boolean;
}

export interface PerformanceTrendPoint {
  date: string;
  spend: number;
  revenue: number;
  roas: number;
  cpa: number;
  purchases: number;
  source?: DashboardSource | string;
}

export interface RiskDistributionItem {
  risk_level: "Low" | "Medium" | "High" | string;
  count: number;
  source?: DashboardSource | string;
}

export interface PriorityRecommendation {
  recommendation_id: string;
  client_id: string;
  brand_name: string;
  title: string;
  recommendation_type: string;
  target_platform: string;
  target_campaign_id: string | null;
  expected_weekly_savings: number;
  expected_roas_lift_pct: number;
  confidence_score: number;
  risk_level: "Low" | "Medium" | "High" | string;
  decision_required: boolean | string;
  status: string;
  detected_at: string;
  source?: DashboardSource | string;
}

export interface AgentActivityItem {
  timestamp: string;
  agent_name: string;
  status: string;
  message: string;
  severity: "info" | "warning" | "error" | "success" | string;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
}

export interface ClientOption {
  client_id: string;
  brand_name: string;
  brand_category: string;
  monthly_ad_spend_band: string;
  source?: DashboardSource | string;
}

export interface DashboardFilters {
  client_id?: string;
  platform?: "All" | "Meta" | "Google" | string;
  days: number;
}


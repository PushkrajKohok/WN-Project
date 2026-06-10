export type AgentSeverity = "info" | "warning" | "error" | "success" | string;
export type AgentHealth = "healthy" | "degraded" | "failed" | string;
export type AgentRunStatus = "idle" | "running" | "waiting" | "completed" | "failed" | string;

export interface AgentStatus {
  agent_name: string;
  status: AgentRunStatus;
  current_task: string;
  last_seen_at: string;
  health: AgentHealth;
  tasks_completed_today: number;
  open_errors: number;
}

export interface AgentLog {
  log_id: string;
  id?: string;
  agent_name: string;
  agent?: string;
  severity: AgentSeverity;
  level?: AgentSeverity;
  message: string;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  created_at: string;
  ts?: string;
}

export interface AgentRun {
  run_id: string;
  run_type: string;
  status: string;
  started_at: string;
  completed_at?: string | null;
  triggered_by: string;
  summary: string;
  error_message?: string | null;
}

export interface AgentRunStep {
  step_id: string;
  run_id: string;
  step_order: number;
  agent_name: string;
  status: string;
  tool_used: string;
  public_summary: string;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface AgentRunDetail {
  run: AgentRun;
  steps: AgentRunStep[];
  source?: string;
}

export interface RunScanRequest {
  client_id?: string | null;
  platform: string;
  scan_depth: "quick" | "standard" | "deep" | string;
}

export interface RunScanResponse {
  run_id: string;
  status: string;
  summary: string;
  new_recommendation_ids: string[];
}

export interface CurrentInvestigation {
  empty?: boolean;
  message?: string;
  run?: AgentRun;
  current_issue?: string;
  agents_involved?: string[];
  recommendation_ids?: string[];
  evidence_summary?: string;
  risk_outcome?: string;
  next_action?: string;
}

export interface AgentLogFilters {
  agent_name: string;
  severity: string;
  search: string;
}

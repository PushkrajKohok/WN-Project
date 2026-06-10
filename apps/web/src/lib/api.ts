import {
  mockAgentLogs,
  mockIngestionSettings,
  mockKPIs,
  mockRecommendations,
} from "@/lib/mock-data";
import type {
  AgentActivityItem,
  ClientOption,
  DashboardFilters,
  DashboardSummary,
  PerformanceTrendPoint,
  PriorityRecommendation,
  RiskDistributionItem,
} from "@/types/dashboard";
import type {
  AgentLog,
  AgentLogFilters,
  AgentRun,
  AgentRunDetail,
  AgentStatus,
  CurrentInvestigation,
  RunScanRequest,
  RunScanResponse,
} from "@/types/agents";
import type {
  DataGenerationRequest,
  DataManifestResponse,
  IngestionFrequencySetting,
  IngestionJob,
  IngestionRequest,
} from "@/types/data";
import type {
  RecommendationAction,
  RecommendationActionRequest,
  RecommendationFacets,
  RecommendationFilters,
  RecommendationListResponse,
  RecommendationRecord,
  RecommendationSummary,
} from "@/types/recommendations";
import type {
  AgentTraceStep,
  RecommendationDetailResponse,
  RecommendationEvidence,
  RiskValidation,
  RollbackPlan,
} from "@/types/evidence";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

export async function apiGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${path}`, { cache: "no-store" });
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export async function apiSend<T>(
  path: string,
  method: "POST" | "PATCH",
  body: unknown,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function getIngestionFrequency(): Promise<IngestionFrequencySetting> {
  return apiGet<IngestionFrequencySetting>(
    "/settings/ingestion-frequency",
    mockIngestionSettings,
  );
}

export async function updateIngestionFrequency(
  body: Partial<IngestionFrequencySetting>,
): Promise<IngestionFrequencySetting> {
  return apiSend<IngestionFrequencySetting>("/settings/ingestion-frequency", "PATCH", body);
}

export async function generateSyntheticData(
  body: DataGenerationRequest,
): Promise<IngestionJob> {
  return apiSend<IngestionJob>("/data/generate", "POST", body);
}

export async function ingestData(body: IngestionRequest): Promise<IngestionJob> {
  return apiSend<IngestionJob>("/data/ingest", "POST", body);
}

export async function getDataJob(jobId: string, fallback?: IngestionJob): Promise<IngestionJob> {
  return apiGet<IngestionJob>(
    `/data/jobs/${jobId}`,
    fallback || {
      job_id: jobId,
      status: "failed",
      error_message: "Job status is unavailable.",
      row_counts: {},
    },
  );
}

export async function getDataManifest(): Promise<DataManifestResponse> {
  return apiGet<DataManifestResponse>("/data/manifest", {});
}

const agentNames = [
  "Data Scout",
  "Pattern Miner",
  "Recommendation Engine",
  "Evidence + Risk Grader",
  "Action Executor",
  "Human Interface",
];

export const fallbackAgentStatuses: AgentStatus[] = agentNames.map((agentName, index) => ({
  agent_name: agentName,
  status: agentName === "Action Executor" ? "waiting" : "idle",
  current_task: [
    "Scanning ad performance and schema drift events",
    "Matching cross-client benchmarks and graph edges",
    "Synthesizing optimization candidates",
    "Validating confidence, risk, and rollback readiness",
    "Waiting for execution approval",
    "Routing recommendations for operator review",
  ][index],
  last_seen_at: "2026-06-09T14:30:00Z",
  health: "healthy",
  tasks_completed_today: 3 + index,
  open_errors: 0,
}));

export const fallbackAgentLogs: AgentLog[] = mockAgentLogs.map((log) => ({
  log_id: log.id,
  id: log.id,
  agent_name: log.agent,
  agent: log.agent,
  severity: log.level,
  level: log.level,
  message: log.message,
  created_at: log.ts,
  ts: log.ts,
  related_entity_type: null,
  related_entity_id: null,
}));

export const fallbackAgentRun: AgentRun = {
  run_id: "RUN_DEMO",
  run_type: "optimization_scan",
  status: "completed",
  started_at: "2026-06-09T14:00:00Z",
  completed_at: "2026-06-09T14:02:00Z",
  triggered_by: "demo",
  summary: "Demo scan completed across campaign performance, recommendations, benchmarks, and risk rules.",
  error_message: null,
};

export const fallbackAgentRunDetail: AgentRunDetail = {
  run: fallbackAgentRun,
  steps: agentNames.map((agentName, index) => ({
    step_id: `STEP_DEMO_${index + 1}`,
    run_id: "RUN_DEMO",
    step_order: index + 1,
    agent_name: agentName,
    status: agentName === "Action Executor" ? "waiting" : "completed",
    tool_used: [
      "SQL performance scan",
      "GraphRAG benchmark lookup",
      "Recommendation synthesis",
      "Guardrail validation",
      "Execution queue",
      "Approval workflow",
    ][index],
    public_summary: [
      "Scanned campaign performance and schema freshness.",
      "Matched anonymized benchmarks for similar brands.",
      "Prepared optimization candidates for review.",
      "Validated confidence, risk, and approval requirements.",
      "Waiting for execution approval.",
      "Queued recommendations for human review.",
    ][index],
    related_entity_type: "run",
    related_entity_id: "RUN_DEMO",
    started_at: "2026-06-09T14:00:00Z",
    completed_at: "2026-06-09T14:02:00Z",
  })),
  source: "mock",
};

export async function getAgentStatuses(): Promise<{ agents: AgentStatus[]; source?: string }> {
  return apiGet<{ agents: AgentStatus[]; source?: string }>("/agents/status", {
    agents: fallbackAgentStatuses,
    source: "mock",
  });
}

function agentLogQuery(filters?: Partial<AgentLogFilters>, extra?: Record<string, string | number>) {
  const params = new URLSearchParams();
  if (filters?.agent_name && filters.agent_name !== "all") params.set("agent_name", filters.agent_name);
  if (filters?.severity && filters.severity !== "all") params.set("severity", filters.severity);
  if (filters?.search) params.set("search", filters.search);
  Object.entries(extra || {}).forEach(([key, value]) => params.set(key, String(value)));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function getAgentLogs(
  filters?: Partial<AgentLogFilters>,
): Promise<{ items: AgentLog[]; logs: AgentLog[]; total: number; source?: string }> {
  return apiGet(`/agents/logs${agentLogQuery(filters, { limit: 100 })}`, {
    items: fallbackAgentLogs,
    logs: fallbackAgentLogs,
    total: fallbackAgentLogs.length,
    source: "mock",
  });
}

export async function getAgentRuns(): Promise<{ items: AgentRun[]; source?: string }> {
  return apiGet<{ items: AgentRun[]; source?: string }>("/agents/runs", {
    items: [fallbackAgentRun],
    source: "mock",
  });
}

export async function getAgentRunDetail(runId: string): Promise<AgentRunDetail> {
  return apiGet<AgentRunDetail>(`/agents/runs/${runId}`, fallbackAgentRunDetail);
}

export async function runAgentScan(payload: RunScanRequest): Promise<RunScanResponse> {
  return apiSend<RunScanResponse>("/agents/run-scan", "POST", payload);
}

export async function getCurrentInvestigation(): Promise<CurrentInvestigation> {
  return apiGet<CurrentInvestigation>("/agents/current-investigation", {
    empty: false,
    run: fallbackAgentRun,
    current_issue: "Demo scan found optimization candidates requiring evidence review.",
    agents_involved: agentNames,
    recommendation_ids: ["rec-001"],
    evidence_summary: "Public summaries combine SQL scans, GraphRAG lookup, RAG retrieval, and guardrail validation.",
    risk_outcome: "Human review remains required for material spend changes.",
    next_action: "Open the recommendation or run a fresh optimization scan.",
  });
}

export async function getDashboardSummary(): Promise<typeof mockKPIs> {
  return apiGet("/dashboard/summary", mockKPIs);
}

function dashboardQuery(filters?: Partial<DashboardFilters>, extra?: Record<string, string | number>) {
  const params = new URLSearchParams();
  if (filters?.client_id && filters.client_id !== "all") {
    params.set("client_id", filters.client_id);
  }
  if (filters?.platform && filters.platform !== "All") {
    params.set("platform", filters.platform);
  }
  if (filters?.days) {
    params.set("days", String(filters.days));
  }
  Object.entries(extra || {}).forEach(([key, value]) => {
    params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

export const fallbackDashboardSummary: DashboardSummary = {
  total_clients: 8,
  total_spend: 0,
  total_revenue: 0,
  avg_roas: 0,
  avg_cpa: 0,
  total_purchases: 0,
  active_recommendations: mockKPIs.active_recommendations,
  high_risk_alerts: mockKPIs.high_risk_alerts,
  executed_actions: mockKPIs.auto_actions_executed,
  rolled_back_actions: 0,
  estimated_weekly_savings: mockKPIs.wasted_spend_saved,
  latest_ingestion_status: "mock",
  latest_ingestion_at: null,
  schema_drift_open_items: 0,
  cross_client_patterns: 47,
  knowledge_graph_edges: 156,
  source: "mock",
  is_empty: false,
};

export const fallbackPerformanceTrend: PerformanceTrendPoint[] =
  mockKPIs.trend_7d.wasted_spend_saved.map((value, index) => ({
    date: `2026-06-${String(index + 2).padStart(2, "0")}`,
    spend: value * 0.8,
    revenue: value * 2.2,
    roas: 2.75,
    cpa: 42,
    purchases: 100 + index * 8,
    source: "mock",
  }));

export const fallbackRiskDistribution: RiskDistributionItem[] = [
  { risk_level: "Low", count: 2, source: "mock" },
  { risk_level: "Medium", count: 2, source: "mock" },
  { risk_level: "High", count: 1, source: "mock" },
];

export const fallbackPriorityRecommendations: PriorityRecommendation[] =
  mockRecommendations.slice(0, 5).map((rec) => ({
    recommendation_id: rec.id,
    client_id: rec.client_id,
    brand_name: rec.client_name,
    title: rec.title,
    recommendation_type: rec.type,
    target_platform: rec.platform,
    target_campaign_id: null,
    expected_weekly_savings: rec.expected_savings,
    expected_roas_lift_pct: 0,
    confidence_score: rec.confidence,
    risk_level: rec.risk.charAt(0).toUpperCase() + rec.risk.slice(1),
    decision_required: rec.decision_required,
    status: rec.status,
    detected_at: rec.created_at,
    source: "mock",
  }));

export async function getDashboardSummaryData(
  filters: DashboardFilters,
): Promise<DashboardSummary> {
  return apiGet<DashboardSummary>(
    `/dashboard/summary${dashboardQuery(filters)}`,
    fallbackDashboardSummary,
  );
}

export async function getDashboardPerformanceTrend(
  filters: DashboardFilters,
): Promise<PerformanceTrendPoint[]> {
  return apiGet<PerformanceTrendPoint[]>(
    `/dashboard/performance-trend${dashboardQuery(filters)}`,
    fallbackPerformanceTrend,
  );
}

export async function getDashboardRiskDistribution(
  filters: DashboardFilters,
): Promise<RiskDistributionItem[]> {
  return apiGet<RiskDistributionItem[]>(
    `/dashboard/risk-distribution${dashboardQuery(filters)}`,
    fallbackRiskDistribution,
  );
}

export async function getDashboardPriorityRecommendations(
  filters: DashboardFilters,
): Promise<PriorityRecommendation[]> {
  return apiGet<PriorityRecommendation[]>(
    `/dashboard/priority-recommendations${dashboardQuery(filters, { limit: 5 })}`,
    fallbackPriorityRecommendations,
  );
}

export async function getDashboardAgentActivity(): Promise<AgentActivityItem[]> {
  return apiGet<AgentActivityItem[]>(
    "/dashboard/agent-activity",
    mockAgentLogs.slice(0, 8).map((log) => ({
      timestamp: log.ts,
      agent_name: log.agent,
      status: log.level,
      message: log.message,
      severity: log.level,
    })),
  );
}

export async function getClients(): Promise<{ clients: ClientOption[] }> {
  return apiGet<{ clients: ClientOption[] }>("/clients", { clients: [] });
}

function normalizeRecommendationStatus(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "pending" || normalized === "generated") return "new";
  if (normalized === "rejected") return "dismissed";
  if (normalized === "auto_approved") return "approved";
  return normalized;
}

function normalizeRecommendationRisk(risk: string) {
  return risk.charAt(0).toUpperCase() + risk.slice(1).toLowerCase();
}

export const fallbackRecommendationItems: RecommendationRecord[] = mockRecommendations.map((rec) => ({
  recommendation_id: rec.id,
  client_id: rec.client_id,
  brand_name: rec.client_name,
  brand_category: null,
  monthly_ad_spend_band: "$10k-$50k",
  recommendation_type: rec.type,
  title: rec.title,
  target_platform: rec.platform,
  target_campaign_id: null,
  evidence_summary: rec.summary,
  supporting_benchmark_id: null,
  expected_weekly_savings: rec.expected_savings,
  expected_roas_lift_pct: 0,
  confidence_score: rec.confidence,
  risk_level: normalizeRecommendationRisk(rec.risk),
  decision_required: rec.decision_required ? "human_approval" : "auto_execute_allowed",
  status: normalizeRecommendationStatus(rec.status),
  detected_at: rec.created_at,
}));

export const fallbackRecommendationFacets: RecommendationFacets = {
  clients: Array.from(
    new Map(
      fallbackRecommendationItems.map((item) => [
        item.client_id,
        { client_id: item.client_id, brand_name: item.brand_name, brand_category: item.brand_category },
      ]),
    ).values(),
  ),
  platforms: Array.from(new Set(fallbackRecommendationItems.map((item) => item.target_platform))),
  risk_levels: ["Low", "Medium", "High"],
  statuses: ["new", "approved", "executed", "dismissed", "needs_more_evidence"],
  decision_required: ["human_approval", "auto_execute_allowed"],
  source: "mock",
};

export const fallbackRecommendationSummary: RecommendationSummary = {
  total: fallbackRecommendationItems.length,
  new: fallbackRecommendationItems.filter((item) => item.status === "new").length,
  approved: fallbackRecommendationItems.filter((item) => item.status === "approved").length,
  executed: fallbackRecommendationItems.filter((item) => item.status === "executed").length,
  dismissed: fallbackRecommendationItems.filter((item) => item.status === "dismissed").length,
  needs_more_evidence: fallbackRecommendationItems.filter((item) => item.status === "needs_more_evidence").length,
  human_approval_required: fallbackRecommendationItems.filter((item) => item.decision_required === "human_approval").length,
  auto_execute_allowed: fallbackRecommendationItems.filter((item) => item.decision_required === "auto_execute_allowed").length,
  high_risk: fallbackRecommendationItems.filter((item) => item.risk_level === "High").length,
  estimated_weekly_savings: fallbackRecommendationItems
    .filter((item) => ["new", "approved", "needs_more_evidence"].includes(item.status))
    .reduce((sum, item) => sum + item.expected_weekly_savings, 0),
  source: "mock",
};

function recommendationQuery(filters: RecommendationFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (["client_id", "platform", "risk_level", "status", "decision_required"].includes(key) && value === "all") return;
    params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function getRecommendations(filters: RecommendationFilters): Promise<RecommendationListResponse> {
  return apiGet<RecommendationListResponse>(
    `/recommendations${recommendationQuery(filters)}`,
    {
      items: fallbackRecommendationItems,
      total: fallbackRecommendationItems.length,
      limit: filters.limit,
      offset: filters.offset,
      source: "mock",
    },
  );
}

export async function getRecommendationFacets(): Promise<RecommendationFacets> {
  return apiGet<RecommendationFacets>("/recommendations/facets", fallbackRecommendationFacets);
}

export async function getRecommendationSummary(): Promise<RecommendationSummary> {
  return apiGet<RecommendationSummary>("/recommendations/summary", fallbackRecommendationSummary);
}

export function fallbackRecommendationDetail(id: string): RecommendationDetailResponse | undefined {
  const recommendation = fallbackRecommendationItems.find((item) => item.recommendation_id === id);
  const source = mockRecommendations.find((item) => item.id === id);
  if (!recommendation || !source) return undefined;
  const spend = Math.max(recommendation.expected_weekly_savings * 2.7, 1800);
  const revenue = spend * (2.1 + recommendation.confidence_score);
  const purchases = Math.max(Math.round(revenue / 92), 12);
  return {
    recommendation,
    client: {
      client_id: recommendation.client_id,
      brand_name: recommendation.brand_name,
      brand_category: recommendation.brand_category,
      monthly_ad_spend_band: recommendation.monthly_ad_spend_band,
      data_consent_status: "synthetic_demo",
    },
    campaign: {
      campaign_name: recommendation.target_campaign_id || `${recommendation.target_platform} optimization portfolio`,
      objective: recommendation.recommendation_type.replace(/_/g, " "),
      status: "active",
      daily_budget: spend / 30,
      bid_strategy: "lowest_cost",
      attribution_window: "7d_click",
    },
    evidence: {
      sql_evidence: {
        campaign_performance: {
          lookback_days: 30,
          total_spend: spend,
          total_revenue: revenue,
          roas: revenue / spend,
          cpa: spend / purchases,
          purchases,
          avg_frequency: 2.4,
        },
        recent_trend: Array.from({ length: 14 }, (_, index) => ({
          date: `2026-06-${String(index + 1).padStart(2, "0")}`,
          spend: (spend / 30) * (0.85 + index * 0.02),
          revenue: (revenue / 30) * (0.8 + index * 0.03),
          roas: 1.9 + index * 0.08,
          cpa: (spend / purchases) * (1.1 - index * 0.01),
          purchases: Math.max(1, Math.round((purchases / 30) * (0.8 + index * 0.04))),
        })),
        campaign_settings: {
          campaign_name: recommendation.target_campaign_id || `${recommendation.target_platform} optimization portfolio`,
          objective: recommendation.recommendation_type.replace(/_/g, " "),
          status: "active",
          daily_budget: spend / 30,
          bid_strategy: "lowest_cost",
          attribution_window: "7d_click",
        },
      },
      graph_evidence: {
        supporting_benchmark: {
          benchmark_id: recommendation.supporting_benchmark_id || "BM_DEMO_001",
          brand_category: recommendation.brand_category || "Comparable cohort",
          monthly_ad_spend_band: recommendation.monthly_ad_spend_band || "$10k-$50k",
          strategy: recommendation.recommendation_type.replace(/_/g, " "),
          primary_metric: "ROAS lift",
          avg_lift_pct: 0.097,
          median_lift_pct: 0.084,
          sample_size: 14,
          confidence_score: Math.max(recommendation.confidence_score - 0.08, 0.62),
          privacy_level: "aggregated_only",
        },
        related_edges: [
          {
            relationship: "supported_by_benchmark",
            source_node_type: "Recommendation",
            target_node_type: "Benchmark",
            weight: 0.84,
            evidence_count: 12,
          },
        ],
        similar_client_count: 14,
        source: "mock",
      },
      rag_evidence: {
        documents: [
          {
            doc_id: `DOC_${id}_SUMMARY`,
            doc_type: "recommendation_summary",
            embedding_group: "recommendation_context",
            source_table: "recommendation_records",
            source_record_id: id,
            text: recommendation.evidence_summary,
            updated_at: recommendation.detected_at,
          },
          {
            doc_id: `DOC_${recommendation.client_id}_PLAYBOOK`,
            doc_type: "playbook_excerpt",
            embedding_group: "optimization_playbooks",
            source_table: "rag_documents",
            source_record_id: recommendation.target_campaign_id || recommendation.client_id,
            text: source.evidence.vector,
            updated_at: recommendation.detected_at,
          },
        ],
        source: "mock",
      },
    },
    risk_validation: {
      confidence_threshold: 0.75,
      recommendation_confidence: recommendation.confidence_score,
      risk_level: recommendation.risk_level,
      decision_required: recommendation.decision_required,
      data_freshness_status: "fresh",
      sample_size_status: "sufficient",
      benchmark_quality: "strong",
      rollback_available: true,
      auto_execute_allowed: recommendation.decision_required === "auto_execute_allowed" && recommendation.risk_level === "Low",
      validation_checks: [
        { check: "Confidence above threshold", status: "passed", detail: `${recommendation.confidence_score.toFixed(2)} confidence exceeds the 0.75 threshold.` },
        { check: "Benchmark support", status: "passed", detail: "Aggregated benchmark evidence has sufficient sample size and confidence." },
        { check: "Spend impact", status: recommendation.risk_level === "Low" ? "passed" : "review_required", detail: "Material spend changes remain gated for human review." },
        { check: "Rollback path", status: "passed", detail: "Rollback can restore the prior campaign or audience state." },
      ],
    },
    agent_trace: [
      { step: 1, agent_name: "Data Scout", status: "completed", summary: "Detected the performance condition in structured campaign data.", tool_used: "SQL performance scan", timestamp: recommendation.detected_at },
      { step: 2, agent_name: "Pattern Miner", status: "completed", summary: "Matched similar anonymized benchmark cohorts.", tool_used: "GraphRAG benchmark lookup", timestamp: recommendation.detected_at },
      { step: 3, agent_name: "Recommendation Engine", status: "completed", summary: "Generated the optimization and expected impact.", tool_used: "Recommendation synthesis", timestamp: recommendation.detected_at },
      { step: 4, agent_name: "Evidence + Risk Grader", status: "completed", summary: "Validated confidence, risk, evidence quality, and approval requirement.", tool_used: "Corrective RAG validation", timestamp: recommendation.detected_at },
      { step: 5, agent_name: "Human Interface", status: "waiting", summary: "Human approval is required before execution.", tool_used: "Approval workflow", timestamp: recommendation.detected_at },
    ],
    rollback_plan: {
      rollback_available: true,
      rollback_type: "restore_previous_audience_or_campaign_config",
      summary: "Restore the previous campaign, audience, or bid configuration if post-approval performance breaches guardrails.",
      steps: [
        "Snapshot current campaign and audience configuration before execution.",
        "Apply the approved optimization after execution is enabled.",
        "Monitor ROAS, CPA, spend, purchases, and frequency for 24-72 hours.",
        "Restore previous configuration if guardrail thresholds are breached.",
        "Log rollback outcome into optimization_history.",
      ],
      related_past_actions: [
        {
          optimization_id: `OPT_${id}_DEMO`,
          action_type: recommendation.recommendation_type.replace(/_/g, " "),
          status: "simulated_history",
          actual_impact_pct: Math.max(recommendation.expected_roas_lift_pct, 0.04),
          rollback_flag: false,
        },
      ],
    },
    related_history: [
      {
        optimization_id: `OPT_${id}_DEMO`,
        action_type: recommendation.recommendation_type.replace(/_/g, " "),
        status: "simulated_history",
        actual_impact_pct: Math.max(recommendation.expected_roas_lift_pct, 0.04),
        rollback_flag: false,
      },
    ],
    source: "mock",
  };
}

export async function getRecommendationDetail(id: string): Promise<RecommendationDetailResponse | undefined> {
  return apiGet<RecommendationDetailResponse | undefined>(
    `/recommendations/${id}`,
    fallbackRecommendationDetail(id),
  );
}

export async function getRecommendationEvidence(id: string): Promise<RecommendationEvidence | undefined> {
  return apiGet<RecommendationEvidence | undefined>(
    `/recommendations/${id}/evidence`,
    fallbackRecommendationDetail(id)?.evidence,
  );
}

export async function getRecommendationAgentTrace(id: string): Promise<AgentTraceStep[]> {
  return apiGet<AgentTraceStep[]>(
    `/recommendations/${id}/agent-trace`,
    fallbackRecommendationDetail(id)?.agent_trace || [],
  );
}

export async function getRecommendationRiskValidation(id: string): Promise<RiskValidation | undefined> {
  return apiGet<RiskValidation | undefined>(
    `/recommendations/${id}/risk-validation`,
    fallbackRecommendationDetail(id)?.risk_validation,
  );
}

export async function getRecommendationRollbackPlan(id: string): Promise<RollbackPlan | undefined> {
  return apiGet<RollbackPlan | undefined>(
    `/recommendations/${id}/rollback-plan`,
    fallbackRecommendationDetail(id)?.rollback_plan,
  );
}

export async function approveRecommendation(
  id: string,
  payload: RecommendationActionRequest = {},
): Promise<RecommendationRecord> {
  return apiSend<RecommendationRecord>(`/recommendations/${id}/approve`, "POST", {
    approved_by: payload.approved_by || "demo_user",
    note: payload.note,
  });
}

export async function rejectRecommendation(
  id: string,
  payload: RecommendationActionRequest = {},
): Promise<RecommendationRecord> {
  return apiSend<RecommendationRecord>(`/recommendations/${id}/reject`, "POST", {
    rejected_by: payload.rejected_by || "demo_user",
    reason: payload.reason || "Rejected during review.",
  });
}

export async function requestMoreEvidence(
  id: string,
  payload: RecommendationActionRequest = {},
): Promise<RecommendationRecord> {
  return apiSend<RecommendationRecord>(`/recommendations/${id}/needs-more-evidence`, "POST", {
    requested_by: payload.requested_by || "demo_user",
    note: payload.note,
  });
}

export async function decideRecommendation(
  recommendationId: string,
  action: RecommendationAction,
  note?: string,
): Promise<RecommendationRecord> {
  if (action === "approve") {
    return approveRecommendation(recommendationId, { note });
  }
  if (action === "reject") {
    return rejectRecommendation(recommendationId, { reason: note || "Rejected during review." });
  }
  return requestMoreEvidence(recommendationId, { note });
}

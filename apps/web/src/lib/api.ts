import {
  mockActions,
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
  ActionAuditEvent,
  ActionDetail,
  ActionFacets,
  ActionFilters,
  ActionListResponse,
  ActionSummary,
  OptimizationAction,
  RollbackPlan,
  SimulateExecutionRequest,
  SimulateRollbackRequest,
} from "@/types/actions";
import type {
  BenchmarkDetail,
  BenchmarkPattern,
  PatternFacets,
  PatternFilters,
  PatternGraphResponse,
  PatternSummary,
  StrategyLiftItem,
} from "@/types/patterns";
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
  RollbackPlan as EvidenceRollbackPlan,
  RecommendationDetailResponse,
  RecommendationEvidence,
  RiskValidation,
} from "@/types/evidence";
import type {
  GuardrailAuditLogItem,
  GuardrailImpactPreview,
  GuardrailSettings,
  GuardrailUpdateRequest,
} from "@/types/guardrails";
import type {
  EvidenceScore,
  EmbeddingRebuildResponse,
  HybridSearchRequest,
  HybridSearchResponse,
  LlmStatus,
  RecommendationLlmExplanation,
  RagDocumentListResponse,
  RagFacetResponse,
  RagRebuildIndexResponse,
  RagSearchRequest,
  RagSearchResponse,
  VectorSearchRequest,
  VectorSearchResponse,
} from "@/types/rag";
import type {
  LearningEvent,
  LearningMemoryDocument,
  LearningSummary,
  OutcomeMeasurement,
  PromoteToBenchmarkRequest,
  PromoteToBenchmarkResponse,
  RunLearningCycleRequest,
  RunLearningCycleResponse,
  StrategyLearningScore,
} from "@/types/learning";

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

export const fallbackGuardrailSettings: GuardrailSettings = {
  confidence_threshold: 0.75,
  auto_execute_confidence_threshold: 0.9,
  max_auto_execute_weekly_savings: 2500,
  high_risk_requires_approval: true,
  medium_risk_requires_approval: true,
  budget_changes_require_approval: true,
  campaign_pause_requires_approval: true,
  rollback_required_for_execution: true,
  fresh_data_required: true,
  max_data_staleness_hours: 24,
  auto_execute_low_risk_audience_refresh: true,
  auto_execute_tracking_fix: false,
  auto_execute_budget_shift: false,
  auto_execute_campaign_pause: false,
  cross_client_privacy_mode: "aggregated_only",
  require_benchmark_support: true,
  min_benchmark_sample_size: 10,
  min_benchmark_confidence: 0.65,
  updated_at: null,
  source: "mock",
};

export async function getGuardrails(): Promise<GuardrailSettings> {
  return apiGet<GuardrailSettings>("/guardrails", fallbackGuardrailSettings);
}

export async function updateGuardrails(payload: GuardrailUpdateRequest): Promise<GuardrailSettings> {
  try {
    return await apiSend<GuardrailSettings>("/guardrails", "PATCH", payload);
  } catch {
    Object.assign(fallbackGuardrailSettings, payload, { source: "mock" });
    return fallbackGuardrailSettings;
  }
}

export async function resetGuardrails(): Promise<GuardrailSettings> {
  try {
    return await apiSend<GuardrailSettings>("/guardrails/reset-defaults", "POST", {});
  } catch {
    Object.assign(fallbackGuardrailSettings, {
      confidence_threshold: 0.75,
      auto_execute_confidence_threshold: 0.9,
      max_auto_execute_weekly_savings: 2500,
      high_risk_requires_approval: true,
      medium_risk_requires_approval: true,
      budget_changes_require_approval: true,
      campaign_pause_requires_approval: true,
      rollback_required_for_execution: true,
      fresh_data_required: true,
      max_data_staleness_hours: 24,
      auto_execute_low_risk_audience_refresh: true,
      auto_execute_tracking_fix: false,
      auto_execute_budget_shift: false,
      auto_execute_campaign_pause: false,
      cross_client_privacy_mode: "aggregated_only",
      require_benchmark_support: true,
      min_benchmark_sample_size: 10,
      min_benchmark_confidence: 0.65,
      source: "mock",
    });
    return fallbackGuardrailSettings;
  }
}

export async function getGuardrailImpactPreview(): Promise<GuardrailImpactPreview> {
  return apiGet<GuardrailImpactPreview>("/guardrails/impact-preview", fallbackGuardrailImpact());
}

export async function getGuardrailAuditLog(): Promise<{ items: GuardrailAuditLogItem[]; source?: string }> {
  return apiGet("/guardrails/audit-log", {
    items: fallbackAgentLogs
      .filter((log) => ["Human Interface", "Evidence + Risk Grader", "Action Executor"].includes(log.agent_name) || /guardrail|approval|risk|threshold/i.test(log.message))
      .map((log) => ({
        log_id: log.log_id,
        agent_name: log.agent_name,
        message: log.message,
        severity: log.severity,
        created_at: log.created_at,
      })),
    source: "mock",
  });
}

function fallbackGuardrailImpact(): GuardrailImpactPreview {
  const settings = fallbackGuardrailSettings;
  return {
    total_recommendations: fallbackRecommendationItems.length,
    auto_execute_eligible: fallbackRecommendationItems.filter((item) => item.risk_level === "Low" && item.confidence_score >= settings.auto_execute_confidence_threshold && item.expected_weekly_savings <= settings.max_auto_execute_weekly_savings).length,
    human_approval_required: fallbackRecommendationItems.filter((item) => item.risk_level !== "Low").length,
    needs_more_evidence: fallbackRecommendationItems.filter((item) => item.confidence_score < settings.confidence_threshold || (settings.require_benchmark_support && !item.supporting_benchmark_id)).length,
    blocked_by_guardrails: 0,
    high_risk_blocked_or_review: fallbackRecommendationItems.filter((item) => item.risk_level === "High").length,
    budget_or_pause_review: fallbackRecommendationItems.filter((item) => /budget|pause|bid|campaign/i.test(item.recommendation_type)).length,
    low_confidence_review: fallbackRecommendationItems.filter((item) => item.confidence_score < settings.confidence_threshold).length,
    missing_benchmark_review: fallbackRecommendationItems.filter((item) => !item.supporting_benchmark_id).length,
    source: "mock",
  };
}

export async function searchRag(payload: RagSearchRequest): Promise<RagSearchResponse> {
  return apiSend<RagSearchResponse>("/rag/search", "POST", payload).catch(() => fallbackRagResponse(payload));
}

export async function getRagForRecommendation(id: string): Promise<RagSearchResponse> {
  return apiGet<RagSearchResponse>(`/rag/recommendation/${id}`, fallbackRagResponse({ query: "recommendation evidence", recommendation_id: id, top_k: 8, include_sql: true, include_graph: true, include_rag_docs: true }));
}

export async function scoreRecommendationEvidence(id: string): Promise<{
  recommendation_id: string;
  overall_score: number;
  score_breakdown: Record<string, number>;
  decision: string;
  review_required: boolean;
  reasons: string[];
}> {
  return apiSend<{
    recommendation_id: string;
    overall_score: number;
    score_breakdown: Record<string, number>;
    decision: string;
    review_required: boolean;
    reasons: string[];
  }>("/rag/score-evidence", "POST", { recommendation_id: id }).catch(() => {
    const response = fallbackRagResponse({ query: "recommendation evidence", recommendation_id: id, top_k: 8, include_sql: true, include_graph: true, include_rag_docs: true });
    return {
      recommendation_id: id,
      overall_score: response.evidence_score.overall_score,
      score_breakdown: response.evidence_score.score_breakdown || {},
      decision: response.evidence_score.decision,
      review_required: response.evidence_score.review_required,
      reasons: response.evidence_score.reasons || [],
    };
  });
}

export async function getRagDocuments(filters?: { client_id?: string; doc_type?: string; embedding_group?: string; search?: string; limit?: number; offset?: number }): Promise<RagDocumentListResponse> {
  const params = new URLSearchParams();
  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "all") params.set(key, String(value));
  });
  const query = params.toString();
  return apiGet<RagDocumentListResponse>(`/rag/documents${query ? `?${query}` : ""}`, {
    items: fallbackRagResponse({ query: filters?.search || "recommendation", top_k: filters?.limit || 8, include_sql: true, include_graph: true, include_rag_docs: true }).rag_documents,
    total: 3,
    limit: filters?.limit || 50,
    offset: filters?.offset || 0,
    source: "mock",
  });
}

export async function getRagFacets(): Promise<RagFacetResponse> {
  return apiGet<RagFacetResponse>("/rag/facets", {
    doc_types: ["demo_context"],
    embedding_groups: ["recommendation_context", "campaign_context", "benchmark_context"],
    source_tables: ["recommendation_records"],
    source: "mock",
  });
}

export async function rebuildRagIndex(): Promise<RagRebuildIndexResponse> {
  return apiSend<RagRebuildIndexResponse>("/rag/rebuild-index", "POST", {}).catch(() => ({
    status: "completed",
    documents_indexed: 3,
    embedding_mode: "simulated_keyword_semantic",
  }));
}

export async function getLlmStatus(): Promise<LlmStatus> {
  return apiGet<LlmStatus>("/llm/status", {
    llm_features_enabled: false,
    vector_rag_enabled: false,
    openai_key_configured: false,
    model: "gpt-5.4-mini",
    embedding_model: "text-embedding-3-small",
    embedding_dimensions: 1536,
    embedded_docs_count: 0,
    total_rag_docs_count: 0,
    mode: "llm_disabled",
  });
}

export async function rebuildEmbeddings(limit = 500, force = false): Promise<EmbeddingRebuildResponse> {
  return apiSend<EmbeddingRebuildResponse>("/admin/embeddings/rebuild", "POST", { limit, force });
}

export async function vectorSearch(payload: VectorSearchRequest): Promise<VectorSearchResponse> {
  return apiSend<VectorSearchResponse>("/rag/vector-search", "POST", payload).catch(() => ({
    mode: "fallback_keyword",
    query: payload.query,
    results: [],
    error_message: "Vector search unavailable.",
  }));
}

export async function hybridSearch(payload: HybridSearchRequest): Promise<HybridSearchResponse> {
  return apiSend<HybridSearchResponse>("/rag/hybrid-search", "POST", payload);
}

export async function explainRecommendationWithLlm(id: string): Promise<RecommendationLlmExplanation> {
  return apiSend<RecommendationLlmExplanation>(`/recommendations/${id}/llm-explain`, "POST", {});
}

export async function getAgentLlmSummary(): Promise<{
  status: string;
  summary?: {
    summary?: string;
    operational_risks?: string[];
    recommended_followups?: string[];
    cited_evidence_ids?: string[];
  };
  error_message?: string;
  logs_considered?: number;
  recommendations_considered?: number;
}> {
  return apiSend("/agents/llm-scan-summary", "POST", {});
}

function fallbackRagResponse(payload: RagSearchRequest): RagSearchResponse {
  const recommendation = fallbackRecommendationItems.find((item) => item.recommendation_id === payload.recommendation_id) || fallbackRecommendationItems[0];
  const docs = [
    {
      doc_id: "rag-demo-001",
      client_id: recommendation.client_id,
      doc_type: "demo_context",
      source_table: "recommendation_records",
      source_record_id: recommendation.recommendation_id,
      chunk_id: 1,
      embedding_group: "recommendation_context",
      text: "Recommendation context links the proposed optimization to campaign waste, confidence, and risk validation.",
      snippet: "Recommendation context links the proposed optimization to campaign waste, confidence, and risk validation.",
      updated_at: recommendation.detected_at,
      relevance_score: 0.86,
    },
    {
      doc_id: "rag-demo-002",
      client_id: recommendation.client_id,
      doc_type: "demo_context",
      source_table: "ad_campaign_settings",
      source_record_id: recommendation.target_campaign_id,
      chunk_id: 2,
      embedding_group: "campaign_context",
      text: "Campaign context includes platform, target campaign, spend efficiency, and recent performance indicators.",
      snippet: "Campaign context includes platform, target campaign, spend efficiency, and recent performance indicators.",
      updated_at: recommendation.detected_at,
      relevance_score: 0.74,
    },
    {
      doc_id: "rag-demo-003",
      client_id: recommendation.client_id,
      doc_type: "demo_context",
      source_table: "cross_client_benchmarks",
      source_record_id: recommendation.supporting_benchmark_id,
      chunk_id: 3,
      embedding_group: "benchmark_context",
      text: "Benchmark context supports the recommendation with anonymized cross-client lift and confidence.",
      snippet: "Benchmark context supports the recommendation with anonymized cross-client lift and confidence.",
      updated_at: recommendation.detected_at,
      relevance_score: 0.79,
    },
  ];
  const evidenceScore: EvidenceScore = {
    overall_score: 0.82,
    sql_score: 0.81,
    rag_score: 0.80,
    graph_score: 0.84,
    freshness_score: 0.88,
    guardrail_compliance: 0.76,
    recommendation: "strong_evidence",
    decision: "strong_evidence",
    review_required: recommendation.risk_level === "High",
    score_breakdown: {
      sql_evidence: 0.81,
      rag_document_relevance: 0.8,
      graph_benchmark_support: 0.84,
      data_freshness: 0.88,
      guardrail_compliance: 0.76,
    },
    reasons: [
      "Campaign performance data exists for the target scope.",
      "RAG documents include recommendation and campaign context.",
      "GraphRAG benchmark support is available.",
      "Recommendation confidence is compared to current guardrails.",
    ],
  };
  return {
    query: payload.query,
    client_id: recommendation.client_id,
    recommendation_id: recommendation.recommendation_id,
    recommendation: { ...recommendation },
    results: {
      sql_context: {
        performance_summary: { scope: "client", spend: 18500, revenue: 42100, roas: 2.27, cpa: 39.5, purchases: 242 },
        recent_trend: [],
        optimization_history: [],
      },
      rag_documents: docs,
      graph_context: [{ edge_id: "edge-demo-001", relationship: "supported_by_benchmark", weight: 0.88 }],
      benchmark_context: [{ benchmark_id: "benchmark-demo", strategy: recommendation.recommendation_type, avg_lift_pct: 0.18, confidence_score: 0.84, sample_size: 18, privacy_level: "aggregated_only" }],
    },
    sql_context: {
      performance_summary: { scope: "client", spend: 18500, revenue: 42100, roas: 2.27, cpa: 39.5, purchases: 242 },
      recent_trend: [],
      optimization_history: [],
    },
    rag_documents: docs,
    graph_context: { edges: [{ edge_id: "edge-demo-001", relationship: "supported_by_benchmark", weight: 0.88 }], similar_client_edge_count: 1 },
    benchmark_context: [{ benchmark_id: "benchmark-demo", strategy: recommendation.recommendation_type, avg_lift_pct: 0.18, confidence_score: 0.84, sample_size: 18, privacy_level: "aggregated_only" }],
    evidence_score: evidenceScore,
    retrieval_trace: [
      { step: 1, retriever: "SQL Retriever", summary: "Loaded campaign performance and settings.", status: "completed" },
      { step: 2, retriever: "RAG Document Retriever", summary: `Retrieved ${docs.length} relevant text chunks from rag_documents.`, status: "completed" },
      { step: 3, retriever: "GraphRAG Retriever", summary: "Retrieved benchmark and graph edges for similar strategy support.", status: "completed" },
      { step: 4, retriever: "Corrective Evidence Scorer", summary: "Scored evidence quality and determined review requirement.", status: "completed" },
    ],
    source: "mock",
  };
}

const fallbackLearningEvents: LearningEvent[] = [];
const fallbackOutcomeMeasurements: OutcomeMeasurement[] = [];
const fallbackLearningScores: StrategyLearningScore[] = [];
const fallbackLearningMemory: LearningMemoryDocument[] = [];

export async function getLearningSummary(): Promise<LearningSummary> {
  return apiGet<LearningSummary>("/learning/summary", computeFallbackLearningSummary());
}

export async function runLearningCycle(payload: RunLearningCycleRequest): Promise<RunLearningCycleResponse> {
  return apiSend<RunLearningCycleResponse>("/learning/run-cycle", "POST", payload).catch(() => runFallbackLearningCycle(payload));
}

export async function getLearningEvents(filters?: { client_id?: string; strategy?: string; outcome_type?: string; limit?: number; offset?: number }): Promise<{ items: LearningEvent[]; total: number; limit: number; offset: number; source?: string }> {
  return apiGet(`/learning/events${learningQuery(filters)}`, {
    items: fallbackLearningEvents,
    total: fallbackLearningEvents.length,
    limit: filters?.limit || 50,
    offset: filters?.offset || 0,
    source: "mock",
  });
}

export async function getOutcomeMeasurements(filters?: { client_id?: string; platform?: string; outcome_label?: string; limit?: number; offset?: number }): Promise<{ items: OutcomeMeasurement[]; total: number; limit: number; offset: number; source?: string }> {
  return apiGet(`/learning/outcomes${learningQuery(filters)}`, {
    items: fallbackOutcomeMeasurements,
    total: fallbackOutcomeMeasurements.length,
    limit: filters?.limit || 50,
    offset: filters?.offset || 0,
    source: "mock",
  });
}

export async function getStrategyLearningScores(filters?: { brand_category?: string; spend_band?: string; platform?: string; sort_by?: string; sort_dir?: string; limit?: number }): Promise<{ items: StrategyLearningScore[]; source?: string }> {
  return apiGet(`/learning/strategy-scores${learningQuery(filters)}`, {
    items: fallbackLearningScores,
    source: "mock",
  });
}

export async function getLearningMemoryUpdates(): Promise<{ items: LearningMemoryDocument[]; source?: string }> {
  return apiGet("/learning/memory-updates", {
    items: fallbackLearningMemory,
    source: "mock",
  });
}

export async function promoteStrategyToBenchmark(payload: PromoteToBenchmarkRequest): Promise<PromoteToBenchmarkResponse> {
  return apiSend<PromoteToBenchmarkResponse>("/learning/promote-to-benchmark", "POST", payload).catch(() => {
    const score = fallbackLearningScores.find((item) => item.strategy_key === payload.strategy_key);
    if (!score || score.total_trials < 3 || score.learning_score < 0.7 || score.rolled_back_trials > 1) {
      throw new Error("Strategy does not meet promotion criteria yet.");
    }
    return {
      benchmark: {
        benchmark_id: `LEARN_BENCH_${Date.now()}`,
        strategy: score.strategy,
        confidence_score: score.avg_confidence,
        sample_size: score.total_trials,
        avg_lift_pct: score.avg_actual_impact_pct,
      },
      source: "mock",
    };
  });
}

function learningQuery(filters?: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

function computeFallbackLearningSummary(): LearningSummary {
  return {
    total_learning_events: fallbackLearningEvents.length,
    outcomes_measured: fallbackOutcomeMeasurements.length,
    successful_outcomes: fallbackOutcomeMeasurements.filter((item) => item.outcome_label === "positive_lift").length,
    rolled_back_outcomes: fallbackOutcomeMeasurements.filter((item) => item.outcome_label === "rolled_back").length,
    avg_measured_impact_pct: fallbackOutcomeMeasurements.reduce((sum, item) => sum + item.measured_impact_pct, 0) / Math.max(fallbackOutcomeMeasurements.length, 1),
    strategies_tracked: fallbackLearningScores.length,
    rag_docs_created: fallbackLearningMemory.length,
    benchmarks_updated: fallbackLearningEvents.length,
    graph_edges_updated: fallbackLearningEvents.length,
    last_learning_cycle_at: fallbackLearningEvents[0]?.created_at || null,
    source: "mock",
  };
}

function runFallbackLearningCycle(payload: RunLearningCycleRequest): RunLearningCycleResponse {
  if (fallbackLearningEvents.length > 0) {
    return {
      status: "completed",
      learning_events_created: 0,
      outcome_measurements_created: 0,
      rag_documents_created: 0,
      benchmarks_updated: 0,
      graph_edges_updated: 0,
      summary: "Learning cycle completed; fallback memory was already populated.",
      source: "mock",
    };
  }
  const actions = fallbackActions.filter((action) => ["Executed", "Rolled Back"].includes(action.status)).slice(0, 5);
  actions.forEach((action, index) => {
    const label = action.status === "Rolled Back" ? "rolled_back" : "positive_lift";
    const impact = label === "rolled_back" ? -0.05 : 0.06 + index * 0.01;
    const measurement: OutcomeMeasurement = {
      measurement_id: `MEAS_DEMO_${index + 1}`,
      recommendation_id: action.recommendation_id,
      optimization_id: action.optimization_id,
      client_id: action.client_id,
      brand_name: action.brand_name,
      campaign_id: action.target_campaign_id,
      platform: action.target_platform,
      measurement_window_days: payload.window_days,
      spend_before: 1200,
      spend_after: 1120,
      revenue_before: 2600,
      revenue_after: 3000,
      roas_before: 2.17,
      roas_after: 2.68,
      cpa_before: 42,
      cpa_after: 35,
      purchases_before: 62,
      purchases_after: 84,
      measured_impact_pct: impact,
      outcome_label: label,
      created_at: new Date().toISOString(),
    };
    const event: LearningEvent = {
      event_id: `LEARN_DEMO_${index + 1}`,
      source_type: "optimization",
      source_id: action.optimization_id,
      client_id: action.client_id,
      strategy: action.action_type,
      platform: action.target_platform,
      outcome_type: label,
      outcome_status: "completed",
      expected_impact_pct: action.expected_impact_pct,
      actual_impact_pct: impact,
      confidence_before: action.confidence_score,
      confidence_after: label === "positive_lift" ? Math.min(action.confidence_score + 0.04, 0.99) : Math.max(action.confidence_score - 0.06, 0.3),
      rag_doc_id: `RAG_LEARN_DEMO_${index + 1}`,
      learning_summary: `Strategy ${action.action_type} produced ${label} with measured impact ${(impact * 100).toFixed(1)}%.`,
      created_at: new Date().toISOString(),
    };
    fallbackOutcomeMeasurements.push(measurement);
    fallbackLearningEvents.push(event);
    fallbackLearningMemory.push({
      doc_id: event.rag_doc_id || `RAG_LEARN_DEMO_${index + 1}`,
      client_id: action.client_id,
      doc_type: "learning_outcome_summary",
      source_table: "learning_events",
      source_record_id: event.event_id,
      embedding_group: "learning_memory",
      text: event.learning_summary || "",
      updated_at: event.created_at,
    });
    fallbackLearningScores.push({
      strategy_key: `${action.action_type}|Demo|Demo|${action.target_platform}`,
      strategy: action.action_type,
      brand_category: "Demo",
      spend_band: "Demo",
      platform: action.target_platform,
      total_trials: label === "positive_lift" ? 3 : 1,
      successful_trials: label === "positive_lift" ? 3 : 0,
      rolled_back_trials: label === "rolled_back" ? 1 : 0,
      avg_actual_impact_pct: impact,
      avg_confidence: event.confidence_after || action.confidence_score,
      learning_score: label === "positive_lift" ? 0.78 : 0.42,
      last_updated_at: event.created_at,
    });
  });
  return {
    status: "completed",
    learning_events_created: actions.length,
    outcome_measurements_created: actions.length,
    rag_documents_created: actions.length,
    benchmarks_updated: actions.length,
    graph_edges_updated: actions.length,
    summary: "Learning cycle completed and updated recursive memory.",
    source: "mock",
  };
}

const fallbackActions: OptimizationAction[] = mockActions.map((action, index) => {
  const statusMap: Record<string, OptimizationAction["status"]> = {
    executed: "Executed",
    rolled_back: "Rolled Back",
    rejected: "Rejected",
    pending: "Pending Review",
    approved: "Approved",
  };
  const platform = action.title.toLowerCase().includes("shopping") || action.title.toLowerCase().includes("search") ? "Google" : "Meta";
  return {
    optimization_id: action.id,
    recommendation_id: action.recommendation_id,
    client_id: `demo-client-${index + 1}`,
    brand_name: action.client_name,
    brand_category: null,
    created_at: action.executed_at || "2026-06-09T14:00:00Z",
    agent_name: action.executed_by === "auto" ? "Action Executor" : "Human Interface",
    action_type: action.type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    target_platform: platform,
    target_campaign_id: `DEMO_CAMPAIGN_${String(index + 1).padStart(2, "0")}`,
    campaign_name: action.title,
    reason: action.rollback_reason || action.rejection_reason || action.title,
    expected_impact_pct: 0.08 + index * 0.01,
    confidence_score: 0.78 + Math.min(index * 0.03, 0.15),
    risk_level: index % 3 === 0 ? "Low" : index % 3 === 1 ? "Medium" : "High",
    status: statusMap[action.status] || "Generated",
    approved_by: action.executed_by === "auto" ? "auto_policy" : "human_ops",
    actual_impact_pct: action.status === "executed" || action.status === "rolled_back" ? 0.04 + index * 0.008 : null,
    rollback_flag: action.status === "rolled_back" || action.rollback_status === "rolled_back",
    evidence_refs: [`recommendation:${action.recommendation_id}`, `optimization:${action.id}`],
  };
});

function computeFallbackActionSummary(): ActionSummary {
  const actualActions = fallbackActions.filter((action) => action.actual_impact_pct != null);
  const rolledBack = fallbackActions.filter((action) => action.rollback_flag).length;
  return {
    total_actions: fallbackActions.length,
    generated: fallbackActions.filter((action) => action.status === "Generated").length,
    approved: fallbackActions.filter((action) => action.status === "Approved").length,
    executed: fallbackActions.filter((action) => action.status === "Executed").length,
    rejected: fallbackActions.filter((action) => action.status === "Rejected").length,
    pending_review: fallbackActions.filter((action) => action.status === "Pending Review").length,
    rolled_back: rolledBack,
    rollback_rate: fallbackActions.length ? rolledBack / fallbackActions.length : 0,
    avg_confidence: fallbackActions.reduce((sum, action) => sum + action.confidence_score, 0) / Math.max(fallbackActions.length, 1),
    estimated_avg_impact_pct: fallbackActions.reduce((sum, action) => sum + action.expected_impact_pct, 0) / Math.max(fallbackActions.length, 1),
    actual_avg_impact_pct: actualActions.reduce((sum, action) => sum + (action.actual_impact_pct || 0), 0) / Math.max(actualActions.length, 1),
    source: "mock",
  };
}

export const fallbackActionSummary: ActionSummary = computeFallbackActionSummary();

export const fallbackActionFacets: ActionFacets = {
  clients: fallbackActions.map((action) => ({ client_id: action.client_id, brand_name: action.brand_name })),
  platforms: ["Meta", "Google"],
  risk_levels: ["Low", "Medium", "High"],
  statuses: ["Generated", "Approved", "Executed", "Rejected", "Pending Review", "Rolled Back"],
  agents: ["Data Scout", "Pattern Miner", "Recommendation Engine", "Risk Guardrail", "Action Executor", "Human Interface"],
  source: "mock",
};

function actionQuery(filters?: Partial<ActionFilters> & { action_id?: string; recommendation_id?: string }, extra?: Record<string, string | number>) {
  const params = new URLSearchParams();
  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === "all") return;
    params.set(key, String(value));
  });
  Object.entries(extra || {}).forEach(([key, value]) => params.set(key, String(value)));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function getActionSummary(): Promise<ActionSummary> {
  return apiGet<ActionSummary>("/actions/summary", computeFallbackActionSummary());
}

export async function getActions(filters: ActionFilters): Promise<ActionListResponse> {
  return apiGet<ActionListResponse>(`/actions${actionQuery(filters)}`, {
    items: fallbackActions,
    total: fallbackActions.length,
    limit: filters.limit,
    offset: filters.offset,
    source: "mock",
  });
}

export async function getActionFacets(): Promise<ActionFacets> {
  return apiGet<ActionFacets>("/actions/facets", fallbackActionFacets);
}

export async function getActionDetail(id: string): Promise<ActionDetail | undefined> {
  const action = fallbackActions.find((item) => item.optimization_id === id);
  return apiGet<ActionDetail | undefined>(
    `/actions/${id}`,
    action
      ? {
          action,
          client: { client_id: action.client_id, brand_name: action.brand_name, brand_category: action.brand_category },
          campaign: { campaign_id: action.target_campaign_id, campaign_name: action.campaign_name, platform: action.target_platform },
          related_recommendation: action.recommendation_id ? { recommendation_id: action.recommendation_id } : null,
          audit_events: fallbackAuditEvents(action),
          rollback_plan: fallbackRollbackPlan(action),
          safety_checks: fallbackSafetyChecks(action),
          source: "mock",
        }
      : undefined,
  );
}

export async function simulateActionExecution(id: string, payload: SimulateExecutionRequest): Promise<{ action: OptimizationAction }> {
  try {
    return await apiSend<{ action: OptimizationAction }>(`/actions/${id}/simulate-execution`, "POST", payload);
  } catch {
    const action = fallbackActions.find((item) => item.optimization_id === id);
    if (!action) throw new Error("Action not found.");
    if (["Rejected", "Rolled Back"].includes(action.status)) throw new Error(`Cannot simulate execution for ${action.status} action.`);
    action.status = "Executed";
    action.actual_impact_pct = action.actual_impact_pct ?? action.expected_impact_pct * 0.75;
    return { action };
  }
}

export async function simulateActionRollback(id: string, payload: SimulateRollbackRequest): Promise<{ action: OptimizationAction }> {
  try {
    return await apiSend<{ action: OptimizationAction }>(`/actions/${id}/simulate-rollback`, "POST", payload);
  } catch {
    const action = fallbackActions.find((item) => item.optimization_id === id);
    if (!action) throw new Error("Action not found.");
    if (!["Executed", "Approved"].includes(action.status)) throw new Error("Only executed or approved actions are eligible for simulated rollback.");
    action.status = "Rolled Back";
    action.rollback_flag = true;
    return { action };
  }
}

export async function getActionRollbackPlan(id: string): Promise<RollbackPlan> {
  const action = fallbackActions.find((item) => item.optimization_id === id);
  return apiGet<RollbackPlan>(`/actions/${id}/rollback-plan`, fallbackRollbackPlan(action || fallbackActions[0]));
}

export async function getActionAuditEvents(filters?: { action_id?: string; recommendation_id?: string; client_id?: string; limit?: number }): Promise<{ items: ActionAuditEvent[]; source?: string }> {
  return apiGet(`/actions/audit-events${actionQuery(filters, { limit: filters?.limit || 100 })}`, {
    items: fallbackActions.flatMap((action) => fallbackAuditEvents(action)),
    source: "mock",
  });
}

function fallbackAuditEvents(action: OptimizationAction): ActionAuditEvent[] {
  return [
    {
      audit_id: `${action.optimization_id}-generated`,
      action_id: action.optimization_id,
      recommendation_id: action.recommendation_id,
      client_id: action.client_id,
      event_type: "recommendation_generated",
      event_status: "completed",
      actor: action.agent_name,
      message: "Public recommendation/action record created.",
      metadata: { simulated: true },
      created_at: action.created_at,
    },
  ];
}

function fallbackRollbackPlan(action: OptimizationAction): RollbackPlan {
  const eligible = ["Executed", "Approved"].includes(action.status);
  return {
    rollback_available: eligible,
    rollback_type: "restore_previous_campaign_or_audience_configuration",
    summary: "Restore the prior campaign/audience state using the audit log and previous optimization state.",
    steps: [
      "Confirm current optimization is underperforming against guardrail thresholds.",
      "Retrieve previous configuration snapshot or prior known-good state.",
      "Revert audience/campaign setting in the ad platform.",
      "Monitor CPA, ROAS, spend, and purchases for the next 24-72 hours.",
      "Record rollback outcome in optimization history and agent logs.",
    ],
    rollback_eligibility: eligible ? "eligible" : "not_eligible",
    blocking_reason: eligible ? null : "Action is not currently eligible for rollback.",
  };
}

function fallbackSafetyChecks(action: OptimizationAction) {
  return [
    { label: "External API calls disabled", status: "passed", message: "Demo execution never calls Meta or Google Ads APIs." },
    { label: "Rollback plan available", status: ["Approved", "Executed", "Rolled Back"].includes(action.status) ? "passed" : "pending", message: "A rollback path is attached before execution." },
    { label: "High-risk approval gate", status: action.risk_level !== "High" || action.approved_by ? "passed" : "blocked", message: "High-risk changes require human approval." },
  ];
}

export const fallbackPatternSummary: PatternSummary = {
  total_benchmarks: 8,
  total_graph_edges: 12,
  unique_categories: 8,
  unique_spend_bands: 8,
  avg_confidence: 0.87,
  avg_lift_pct: 0.268,
  total_sample_size: 100,
  privacy_levels: { aggregated_only: 2, k_anonymized: 6 },
  source: "mock",
};

export const fallbackPatternFacets: PatternFacets = {
  brand_categories: ["Beauty & Skincare", "Consumer Electronics", "Health & Nutrition", "Home & Furniture", "Pet Supplies"],
  spend_bands: ["$2K-$8K/mo", "$5K-$15K/mo", "$10K-$30K/mo", "$20K-$50K/mo"],
  metrics: ["ROAS", "CPA", "Wasted Spend", "CAC"],
  privacy_levels: ["aggregated_only", "k_anonymized", "internal_firewalled"],
  source: "mock",
};

function patternQuery(filters?: Partial<PatternFilters>, extra?: Record<string, string | number>) {
  const params = new URLSearchParams();
  Object.entries(filters || {}).forEach(([key, value]) => {
    if (!value || value === "all") return;
    params.set(key, String(value));
  });
  Object.entries(extra || {}).forEach(([key, value]) => params.set(key, String(value)));
  const query = params.toString();
  return query ? `?${query}` : "";
}

const fallbackBenchmarks: BenchmarkPattern[] = [
  {
    benchmark_id: "pat-001",
    anonymized_cohort_id: "COHORT_pat-001",
    brand_category: "Beauty & Skincare",
    monthly_ad_spend_band: "$5K-$15K/mo",
    strategy: "Pause underperforming lookalike audiences",
    primary_metric: "ROAS",
    avg_lift_pct: 0.224,
    median_lift_pct: 0.224,
    sample_size: 14,
    confidence_score: 0.91,
    privacy_level: "k_anonymized",
    generated_at: null,
    related_recommendation_count: 3,
  },
  {
    benchmark_id: "pat-002",
    anonymized_cohort_id: "COHORT_pat-002",
    brand_category: "Consumer Electronics",
    monthly_ad_spend_band: "$20K-$50K/mo",
    strategy: "Increase Shopping bids on top-converting SKUs",
    primary_metric: "ROAS",
    avg_lift_pct: 0.281,
    median_lift_pct: 0.251,
    sample_size: 8,
    confidence_score: 0.87,
    privacy_level: "k_anonymized",
    generated_at: null,
    related_recommendation_count: 2,
  },
];

const fallbackPatternGraph: PatternGraphResponse = {
  nodes: [
    { id: "client-demo-001", type: "Client", label: "Similar Brand 041", metadata: { privacy: "anonymized_cross_client" } },
    { id: "pat-001", type: "Benchmark", label: "Benchmark pat-001", metadata: { privacy: "anonymized_cross_client" } },
    { id: "pat-002", type: "Benchmark", label: "Benchmark pat-002", metadata: { privacy: "anonymized_cross_client" } },
  ],
  edges: [
    { id: "demo-edge-001", source: "client-demo-001", target: "pat-001", relationship: "matches_pattern", weight: 0.91, evidence_count: 12, last_updated_at: null },
    { id: "demo-edge-002", source: "client-demo-001", target: "pat-002", relationship: "similar_strategy", weight: 0.84, evidence_count: 8, last_updated_at: null },
  ],
  source: "mock",
};

export async function getPatternSummary(filters?: Partial<PatternFilters>): Promise<PatternSummary> {
  return apiGet<PatternSummary>(`/patterns/summary${patternQuery(filters)}`, fallbackPatternSummary);
}

export async function getBenchmarks(filters: PatternFilters): Promise<{ items: BenchmarkPattern[]; total: number; limit: number; offset: number; source?: string }> {
  return apiGet(`/patterns/benchmarks${patternQuery(filters)}`, {
    items: fallbackBenchmarks,
    total: fallbackBenchmarks.length,
    limit: filters.limit,
    offset: filters.offset,
    source: "mock",
  });
}

export async function getPatternFacets(): Promise<PatternFacets> {
  return apiGet<PatternFacets>("/patterns/facets", fallbackPatternFacets);
}

export async function getStrategyLift(filters?: Partial<PatternFilters>): Promise<StrategyLiftItem[]> {
  return apiGet<StrategyLiftItem[]>(`/patterns/strategy-lift${patternQuery(filters, { limit: 10 })}`, fallbackBenchmarks.map((item) => ({
    strategy: item.strategy,
    avg_lift_pct: item.avg_lift_pct,
    median_lift_pct: item.median_lift_pct,
    avg_confidence: item.confidence_score,
    sample_size: item.sample_size,
    benchmark_count: 1,
  })));
}

export async function getPatternGraph(filters?: { relationship?: string; limit?: number }): Promise<PatternGraphResponse> {
  return apiGet<PatternGraphResponse>(`/patterns/graph${patternQuery(filters, { limit: filters?.limit || 100 })}`, fallbackPatternGraph);
}

export async function getBenchmarkDetail(benchmarkId: string): Promise<BenchmarkDetail | undefined> {
  const benchmark = fallbackBenchmarks.find((item) => item.benchmark_id === benchmarkId);
  return apiGet<BenchmarkDetail | undefined>(
    `/patterns/${benchmarkId}`,
    benchmark
      ? {
          benchmark,
          related_recommendations: fallbackRecommendationItems.slice(0, 3).map((item) => ({
            recommendation_id: item.recommendation_id,
            title: item.title,
            brand_name: item.brand_name,
            target_platform: item.target_platform,
            expected_weekly_savings: item.expected_weekly_savings,
            confidence_score: item.confidence_score,
            risk_level: item.risk_level,
            status: item.status,
          })),
          related_rag_documents: [],
          related_graph_edges: fallbackPatternGraph.edges,
          privacy_note: "This benchmark is aggregated and anonymized. It supports strategy decisions without exposing raw client records.",
          source: "mock",
        }
      : undefined,
  );
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

export async function getRecommendationRollbackPlan(id: string): Promise<EvidenceRollbackPlan | undefined> {
  return apiGet<EvidenceRollbackPlan | undefined>(
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

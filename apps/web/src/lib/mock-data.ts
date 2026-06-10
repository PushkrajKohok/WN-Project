/**
 * WasteNot — Mock Data
 * Realistic fallback data for all UI pages when the backend is unavailable.
 */

// ───────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────

export interface KPIs {
  wasted_spend_saved: number;
  active_recommendations: number;
  high_risk_alerts: number;
  auto_actions_executed: number;
  trend_7d: {
    wasted_spend_saved: number[];
    recommendations_created: number[];
    alerts_triggered: number[];
  };
}

export interface AgentTrace {
  agent: string;
  action: string;
  ts: string;
}

export interface Evidence {
  sql: string;
  graph: string;
  vector: string;
}

export interface Recommendation {
  id: string;
  title: string;
  client_id: string;
  client_name: string;
  platform: string;
  type: string;
  expected_savings: number;
  confidence: number;
  risk: "low" | "medium" | "high";
  status: string;
  decision_required: boolean;
  created_at: string;
  summary: string;
  evidence: Evidence;
  risk_assessment: string;
  rollback_plan: string;
  agent_trace: AgentTrace[];
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: "active" | "idle" | "waiting" | "error";
  last_run: string;
  tasks_completed: number;
  icon: string;
}

export interface AgentLog {
  id: string;
  agent: string;
  message: string;
  level: "info" | "warning" | "error" | "success";
  ts: string;
}

export interface Pattern {
  id: string;
  category: string;
  spend_band: string;
  strategy: string;
  avg_lift: number;
  sample_size: number;
  confidence: number;
  privacy_level: string;
}

export interface KnowledgeGraphEdge {
  source: string;
  target: string;
  relation: string;
  weight: number;
}

export interface Action {
  id: string;
  recommendation_id: string;
  title: string;
  client_name: string;
  type: string;
  status: string;
  executed_at: string | null;
  executed_by: string;
  before_config: Record<string, unknown>;
  after_config: Record<string, unknown> | null;
  rollback_status: string;
  rollback_reason?: string;
  rejection_reason?: string;
}

export interface GuardrailRule {
  rule: string;
  enabled: boolean;
}

export interface Guardrails {
  confidence_threshold: number;
  spend_threshold_for_approval: number;
  client_data_sharing_level: string;
  auto_execute_actions: string[];
  restricted_actions: string[];
  rules: GuardrailRule[];
}

export interface IngestionOption {
  value: string;
  label: string;
}

export interface IngestionSettings {
  frequency: string;
  frequency_label: string;
  reason: string;
  options: IngestionOption[];
}

export interface DataPreset {
  clients: number;
  customers_per_client: number;
  days: number;
  seed: number;
  label: string;
}

// ───────────────────────────────────────────────────────────────
// Mock Data
// ───────────────────────────────────────────────────────────────

export const mockKPIs: KPIs = {
  wasted_spend_saved: 284750,
  active_recommendations: 47,
  high_risk_alerts: 8,
  auto_actions_executed: 132,
  trend_7d: {
    wasted_spend_saved: [38200, 41500, 39800, 42100, 40300, 41900, 40950],
    recommendations_created: [12, 8, 15, 7, 11, 9, 14],
    alerts_triggered: [2, 1, 3, 1, 2, 0, 1],
  },
};

export const mockRecommendations: Recommendation[] = [
  {
    id: "rec-001",
    title: "Pause underperforming Meta lookalike audience",
    client_id: "c-001",
    client_name: "Bloom & Blossom",
    platform: "Meta",
    type: "audience_optimization",
    expected_savings: 12400,
    confidence: 0.92,
    risk: "low",
    status: "pending",
    decision_required: true,
    created_at: "2026-06-09T12:30:00Z",
    summary: "Lookalike audience 'LA_Skincare_25-34_US' has a 0.3% CTR vs. 1.8% account average over 14 days. Pausing frees $12.4K/month for higher-performing segments.",
    evidence: {
      sql: "SELECT audience_id, avg(ctr) FROM ad_performance_daily WHERE campaign_id='camp-117' GROUP BY audience_id ORDER BY avg(ctr) ASC LIMIT 5;",
      graph: "14 similar beauty/skincare clients saw 22% avg. ROAS lift after pausing underperforming lookalike audiences in the same spend band ($8K–$15K/month).",
      vector: "RAG retrieval matched 3 internal playbook entries on 'lookalike audience refresh cadence' (similarity: 0.94, 0.91, 0.88).",
    },
    risk_assessment: "Low risk — audience pause is fully reversible. No budget reallocation triggered automatically.",
    rollback_plan: "Re-enable audience segment within Meta Ads Manager. Historical performance data preserved.",
    agent_trace: [
      { agent: "Data Scout", action: "Scanned Meta campaign performance for Bloom & Blossom", ts: "2026-06-09T11:30:00Z" },
      { agent: "Pattern Miner", action: "Found 14 similar benchmark cases in beauty/skincare vertical", ts: "2026-06-09T11:45:00Z" },
      { agent: "Recommendation Engine", action: "Generated recommendation: pause underperforming audience", ts: "2026-06-09T12:00:00Z" },
      { agent: "Risk Grader", action: "Classified as LOW risk — reversible action, no budget impact", ts: "2026-06-09T12:15:00Z" },
      { agent: "Human Interface", action: "Queued for human approval", ts: "2026-06-09T12:30:00Z" },
    ],
  },
  {
    id: "rec-002",
    title: "Increase Google Shopping bid for top-converting SKUs",
    client_id: "c-002",
    client_name: "TechEdge Pro",
    platform: "Google",
    type: "bid_optimization",
    expected_savings: 8200,
    confidence: 0.87,
    risk: "medium",
    status: "pending",
    decision_required: true,
    created_at: "2026-06-09T09:30:00Z",
    summary: "Top 5 converting SKUs are consistently hitting impression share cap at current bid. Estimated 34% revenue uplift with 15% bid increase.",
    evidence: {
      sql: "SELECT sku, impression_share, conversion_rate, roas FROM ad_performance_daily WHERE client_id='c-002' AND impression_share < 0.6 ORDER BY conversion_rate DESC LIMIT 5;",
      graph: "8 electronics clients in similar spend bands ($20K–$50K) achieved 28% avg. revenue lift with targeted bid increases on top SKUs.",
      vector: "RAG matched 2 optimization playbook entries on 'Shopping bid strategy for high-intent queries' (similarity: 0.91, 0.87).",
    },
    risk_assessment: "Medium risk — bid increase will raise spend. Requires monitoring for 48 hours to validate ROAS holds.",
    rollback_plan: "Revert bid multiplier to previous value. Set automated alert if ROAS drops below 3.0x within 48 hours.",
    agent_trace: [
      { agent: "Data Scout", action: "Analyzed Google Shopping performance for TechEdge Pro", ts: "2026-06-09T08:30:00Z" },
      { agent: "Pattern Miner", action: "Found 8 benchmark cases in electronics vertical", ts: "2026-06-09T09:00:00Z" },
      { agent: "Recommendation Engine", action: "Generated recommendation: increase bids on top SKUs", ts: "2026-06-09T09:15:00Z" },
      { agent: "Risk Grader", action: "Classified as MEDIUM risk — spend increase, needs monitoring", ts: "2026-06-09T09:30:00Z" },
      { agent: "Human Interface", action: "Queued for human approval", ts: "2026-06-09T09:30:00Z" },
    ],
  },
  {
    id: "rec-003",
    title: "Refresh stale audience sync for Klaviyo segment",
    client_id: "c-003",
    client_name: "FreshFit Meals",
    platform: "Meta",
    type: "audience_sync",
    expected_savings: 3100,
    confidence: 0.95,
    risk: "low",
    status: "auto_approved",
    decision_required: false,
    created_at: "2026-06-08T14:30:00Z",
    summary: "Klaviyo 'Active_Subscribers_90d' segment hasn't synced to Meta in 12 days. 2,400 new subscribers missing from targeting.",
    evidence: {
      sql: "SELECT segment_name, last_sync_at, member_count FROM audience_segments WHERE client_id='c-003' AND last_sync_at < NOW() - INTERVAL '7 days';",
      graph: "Stale audience syncs correlate with 18% higher CPA across 23 clients in the network.",
      vector: "RAG matched playbook entry on 'audience sync freshness SLA' (similarity: 0.96).",
    },
    risk_assessment: "Low risk — sync refresh is standard maintenance. No spend change.",
    rollback_plan: "Revert to previous audience membership snapshot if needed.",
    agent_trace: [
      { agent: "Data Scout", action: "Detected stale Klaviyo sync for FreshFit Meals", ts: "2026-06-08T13:30:00Z" },
      { agent: "Risk Grader", action: "Classified as LOW risk — auto-approve eligible", ts: "2026-06-08T14:00:00Z" },
      { agent: "Action Executor", action: "Auto-approved and triggered audience sync refresh", ts: "2026-06-08T14:30:00Z" },
    ],
  },
  {
    id: "rec-004",
    title: "Pause campaign with deteriorating ROAS trend",
    client_id: "c-006",
    client_name: "VeloCity Gear",
    platform: "Meta",
    type: "campaign_pause",
    expected_savings: 22800,
    confidence: 0.78,
    risk: "high",
    status: "pending",
    decision_required: true,
    created_at: "2026-06-09T13:30:00Z",
    summary: "Campaign 'Summer_Cycling_Prospecting' ROAS declined from 4.2x to 1.1x over 21 days. Current daily spend: $1,085. Immediate pause recommended.",
    evidence: {
      sql: "SELECT date, spend, revenue, roas FROM ad_performance_daily WHERE campaign_id='camp-312' ORDER BY date DESC LIMIT 21;",
      graph: "6 sports/outdoor clients experienced similar ROAS decay patterns; 5 of 6 recovered after pause + creative refresh.",
      vector: "RAG matched 4 entries on 'ROAS decay detection and campaign triage' (similarity: 0.93, 0.90, 0.88, 0.85).",
    },
    risk_assessment: "High risk — campaign pause affects $1K+/day spend. Requires human approval per guardrail policy.",
    rollback_plan: "Re-enable campaign. Consider creative refresh before relaunch. Set 72-hour monitoring window.",
    agent_trace: [
      { agent: "Data Scout", action: "Detected ROAS decay trend for VeloCity Gear campaign", ts: "2026-06-09T12:00:00Z" },
      { agent: "Pattern Miner", action: "Matched 6 similar decay patterns in sports/outdoor vertical", ts: "2026-06-09T12:30:00Z" },
      { agent: "Recommendation Engine", action: "Generated recommendation: pause deteriorating campaign", ts: "2026-06-09T13:00:00Z" },
      { agent: "Risk Grader", action: "Classified as HIGH risk — spend exceeds $1K/day threshold", ts: "2026-06-09T13:15:00Z" },
      { agent: "Human Interface", action: "Escalated for mandatory human approval", ts: "2026-06-09T13:30:00Z" },
    ],
  },
  {
    id: "rec-005",
    title: "Reallocate budget from Search to Shopping",
    client_id: "c-004",
    client_name: "UrbanNest Living",
    platform: "Google",
    type: "budget_reallocation",
    expected_savings: 15600,
    confidence: 0.83,
    risk: "medium",
    status: "approved",
    decision_required: false,
    created_at: "2026-06-07T14:30:00Z",
    summary: "Google Shopping ROAS is 5.8x vs. Search ROAS of 2.1x. Recommend shifting 30% of Search budget ($4,680/month) to Shopping.",
    evidence: {
      sql: "SELECT channel, sum(spend), sum(revenue), sum(revenue)/sum(spend) as roas FROM ad_performance_daily WHERE client_id='c-004' GROUP BY channel;",
      graph: "11 home & furniture clients with similar channel mix saw 41% overall ROAS improvement after Shopping reallocation.",
      vector: "RAG matched 2 playbook entries on 'channel budget rebalancing methodology' (similarity: 0.92, 0.89).",
    },
    risk_assessment: "Medium risk — budget reallocation changes channel mix. Requires 7-day observation window.",
    rollback_plan: "Revert budget split to previous allocation. Preserve historical data for comparison.",
    agent_trace: [
      { agent: "Data Scout", action: "Analyzed channel performance for UrbanNest Living", ts: "2026-06-07T12:30:00Z" },
      { agent: "Recommendation Engine", action: "Generated recommendation: reallocate Search → Shopping", ts: "2026-06-07T13:30:00Z" },
      { agent: "Risk Grader", action: "Classified as MEDIUM risk — budget change", ts: "2026-06-07T14:00:00Z" },
      { agent: "Human Interface", action: "Approved by account manager", ts: "2026-06-07T14:30:00Z" },
    ],
  },
  {
    id: "rec-006",
    title: "Expand TikTok retargeting audience window",
    client_id: "c-005",
    client_name: "PawPerfect",
    platform: "TikTok",
    type: "audience_optimization",
    expected_savings: 4500,
    confidence: 0.88,
    risk: "low",
    status: "pending",
    decision_required: true,
    created_at: "2026-06-09T06:30:00Z",
    summary: "Current 7-day retargeting window is too narrow; 60% of pet supply purchases happen within 14 days. Expanding to 14-day window projects 18% conversion lift.",
    evidence: {
      sql: "SELECT days_to_purchase, count(*) FROM shopify_orders WHERE client_id='c-005' GROUP BY days_to_purchase ORDER BY days_to_purchase;",
      graph: "9 pet supply clients using 14-day retargeting windows averaged 22% higher ROAS than 7-day windows.",
      vector: "RAG matched playbook entry on 'retargeting window optimization by vertical' (similarity: 0.93).",
    },
    risk_assessment: "Low risk — audience window expansion is reversible and doesn't change budget.",
    rollback_plan: "Revert retargeting window to 7 days in TikTok Ads Manager.",
    agent_trace: [
      { agent: "Data Scout", action: "Analyzed purchase timing data for PawPerfect", ts: "2026-06-09T05:30:00Z" },
      { agent: "Pattern Miner", action: "Found 9 pet supply benchmarks for retargeting windows", ts: "2026-06-09T06:00:00Z" },
      { agent: "Recommendation Engine", action: "Generated recommendation: expand retargeting window", ts: "2026-06-09T06:15:00Z" },
      { agent: "Risk Grader", action: "Classified as LOW risk — no budget impact", ts: "2026-06-09T06:30:00Z" },
    ],
  },
];

export const mockAgents: Agent[] = [
  {
    id: "agent-data-scout",
    name: "Data Scout",
    role: "Continuously scans client data sources for anomalies, stale syncs, and performance shifts.",
    status: "active",
    last_run: "2026-06-09T14:30:00Z",
    tasks_completed: 1247,
    icon: "Radar",
  },
  {
    id: "agent-pattern-miner",
    name: "Pattern Miner",
    role: "Cross-references client performance against anonymized network benchmarks to find optimization opportunities.",
    status: "active",
    last_run: "2026-06-09T14:30:00Z",
    tasks_completed: 892,
    icon: "GitBranch",
  },
  {
    id: "agent-recommendation-engine",
    name: "Recommendation Engine",
    role: "Synthesizes evidence from Data Scout and Pattern Miner to generate actionable optimization recommendations.",
    status: "active",
    last_run: "2026-06-09T13:30:00Z",
    tasks_completed: 634,
    icon: "Lightbulb",
  },
  {
    id: "agent-risk-grader",
    name: "Evidence & Risk Grader",
    role: "Validates recommendation evidence quality and assigns risk scores. Implements Corrective RAG guardrails.",
    status: "idle",
    last_run: "2026-06-09T13:30:00Z",
    tasks_completed: 634,
    icon: "ShieldCheck",
  },
  {
    id: "agent-action-executor",
    name: "Action Executor",
    role: "Executes approved optimizations via ad platform APIs. Handles rollback if performance degrades.",
    status: "waiting",
    last_run: "2026-06-09T12:30:00Z",
    tasks_completed: 312,
    icon: "Zap",
  },
  {
    id: "agent-human-interface",
    name: "Human Interface",
    role: "Routes high-risk or high-impact recommendations for human review. Manages approval workflows.",
    status: "active",
    last_run: "2026-06-09T14:30:00Z",
    tasks_completed: 198,
    icon: "UserCheck",
  },
];

export const mockAgentLogs: AgentLog[] = [
  { id: "log-001", agent: "Data Scout", message: "Scanned Meta campaign performance for Bloom & Blossom. Found 1 underperforming audience segment.", level: "info", ts: "2026-06-09T14:30:00Z" },
  { id: "log-002", agent: "Data Scout", message: "Detected stale Klaviyo sync for FreshFit Meals — last sync 12 days ago.", level: "warning", ts: "2026-06-09T14:28:00Z" },
  { id: "log-003", agent: "Pattern Miner", message: "Found 14 similar benchmark cases for beauty/skincare audience optimization.", level: "info", ts: "2026-06-09T14:25:00Z" },
  { id: "log-004", agent: "Data Scout", message: "Analyzed Google Shopping performance for TechEdge Pro. Top 5 SKUs hitting impression share cap.", level: "info", ts: "2026-06-09T13:45:00Z" },
  { id: "log-005", agent: "Recommendation Engine", message: "Generated recommendation: pause underperforming audience for Bloom & Blossom.", level: "info", ts: "2026-06-09T13:30:00Z" },
  { id: "log-006", agent: "Risk Grader", message: "Flagged MEDIUM risk for TechEdge Pro bid increase — spend impact exceeds monitoring threshold.", level: "warning", ts: "2026-06-09T13:15:00Z" },
  { id: "log-007", agent: "Risk Grader", message: "Classified VeloCity Gear campaign pause as HIGH risk — daily spend exceeds $1,000.", level: "error", ts: "2026-06-09T13:10:00Z" },
  { id: "log-008", agent: "Action Executor", message: "Auto-executed audience sync refresh for FreshFit Meals (low-risk, pre-approved action type).", level: "success", ts: "2026-06-09T12:45:00Z" },
  { id: "log-009", agent: "Human Interface", message: "Escalated campaign pause for VeloCity Gear to human review — mandatory approval required.", level: "warning", ts: "2026-06-09T12:30:00Z" },
  { id: "log-010", agent: "Action Executor", message: "Waiting for human approval on 3 pending recommendations.", level: "info", ts: "2026-06-09T12:15:00Z" },
  { id: "log-011", agent: "Pattern Miner", message: "Cross-client analysis complete: 47 active benchmarks updated across 8 verticals.", level: "info", ts: "2026-06-09T11:30:00Z" },
  { id: "log-012", agent: "Data Scout", message: "Ingested 14,200 new ad performance records across 8 clients.", level: "info", ts: "2026-06-09T11:00:00Z" },
  { id: "log-013", agent: "Recommendation Engine", message: "Generated 6 new recommendations in current scan cycle. 4 pending review, 1 auto-approved, 1 approved.", level: "info", ts: "2026-06-09T10:30:00Z" },
  { id: "log-014", agent: "Data Scout", message: "Schema validation passed for all 18 data tables. No drift detected.", level: "info", ts: "2026-06-09T10:00:00Z" },
  { id: "log-015", agent: "Pattern Miner", message: "Updated knowledge graph: 156 new edges added between client campaigns and benchmark patterns.", level: "info", ts: "2026-06-09T09:30:00Z" },
];

export const mockPatterns: Pattern[] = [
  { id: "pat-001", category: "Beauty & Skincare", spend_band: "$5K–$15K/mo", strategy: "Pause underperforming lookalike audiences", avg_lift: 22.4, sample_size: 14, confidence: 0.91, privacy_level: "anonymized" },
  { id: "pat-002", category: "Consumer Electronics", spend_band: "$20K–$50K/mo", strategy: "Increase Shopping bids on top-converting SKUs", avg_lift: 28.1, sample_size: 8, confidence: 0.87, privacy_level: "anonymized" },
  { id: "pat-003", category: "Health & Nutrition", spend_band: "$3K–$10K/mo", strategy: "Refresh stale audience syncs weekly", avg_lift: 18.3, sample_size: 23, confidence: 0.94, privacy_level: "anonymized" },
  { id: "pat-004", category: "Home & Furniture", spend_band: "$15K–$40K/mo", strategy: "Reallocate Search budget to Shopping", avg_lift: 41.2, sample_size: 11, confidence: 0.85, privacy_level: "anonymized" },
  { id: "pat-005", category: "Pet Supplies", spend_band: "$5K–$20K/mo", strategy: "Expand retargeting window to 14 days", avg_lift: 22.0, sample_size: 9, confidence: 0.88, privacy_level: "anonymized" },
  { id: "pat-006", category: "Sports & Outdoors", spend_band: "$10K–$30K/mo", strategy: "Pause campaigns with >60% ROAS decay over 21 days", avg_lift: 35.7, sample_size: 6, confidence: 0.78, privacy_level: "aggregated" },
  { id: "pat-007", category: "Fashion & Apparel", spend_band: "$20K–$60K/mo", strategy: "Seasonal creative refresh every 14 days", avg_lift: 19.8, sample_size: 17, confidence: 0.90, privacy_level: "anonymized" },
  { id: "pat-008", category: "Food & Beverage", spend_band: "$2K–$8K/mo", strategy: "Daypart budget optimization for meal-time targeting", avg_lift: 26.5, sample_size: 12, confidence: 0.86, privacy_level: "anonymized" },
];

export const mockKnowledgeGraphEdges: KnowledgeGraphEdge[] = [
  { source: "Bloom & Blossom", target: "Beauty & Skincare Benchmark", relation: "matches_pattern", weight: 0.92 },
  { source: "TechEdge Pro", target: "Electronics Bid Strategy", relation: "matches_pattern", weight: 0.87 },
  { source: "FreshFit Meals", target: "Audience Sync SLA", relation: "violates_sla", weight: 0.95 },
  { source: "UrbanNest Living", target: "Channel Rebalancing Pattern", relation: "matches_pattern", weight: 0.85 },
  { source: "PawPerfect", target: "Retargeting Window Benchmark", relation: "matches_pattern", weight: 0.88 },
  { source: "VeloCity Gear", target: "ROAS Decay Detection", relation: "triggers_alert", weight: 0.78 },
  { source: "LuxeThread Co.", target: "Creative Refresh Cadence", relation: "matches_pattern", weight: 0.90 },
  { source: "BrewHaus Coffee", target: "Daypart Optimization", relation: "matches_pattern", weight: 0.86 },
  { source: "Beauty & Skincare Benchmark", target: "Lookalike Audience Playbook", relation: "references", weight: 0.94 },
  { source: "Electronics Bid Strategy", target: "Shopping Bid Playbook", relation: "references", weight: 0.91 },
  { source: "ROAS Decay Detection", target: "Campaign Triage Playbook", relation: "references", weight: 0.93 },
  { source: "Audience Sync SLA", target: "Sync Freshness Playbook", relation: "references", weight: 0.96 },
];

export const mockActions: Action[] = [
  {
    id: "act-001",
    recommendation_id: "rec-003",
    title: "Refresh stale audience sync for Klaviyo segment",
    client_name: "FreshFit Meals",
    type: "audience_sync",
    status: "executed",
    executed_at: "2026-06-08T14:30:00Z",
    executed_by: "auto",
    before_config: { sync_status: "stale", last_sync: "2026-05-28", member_count: 4200 },
    after_config: { sync_status: "active", last_sync: "2026-06-08", member_count: 6600 },
    rollback_status: "not_needed",
  },
  {
    id: "act-002",
    recommendation_id: "rec-005",
    title: "Reallocate budget from Search to Shopping",
    client_name: "UrbanNest Living",
    type: "budget_reallocation",
    status: "executed",
    executed_at: "2026-06-07T14:30:00Z",
    executed_by: "account_manager",
    before_config: { search_budget: 15600, shopping_budget: 10400 },
    after_config: { search_budget: 10920, shopping_budget: 15080 },
    rollback_status: "not_needed",
  },
  {
    id: "act-003",
    recommendation_id: "rec-007",
    title: "Creative refresh for summer campaign",
    client_name: "LuxeThread Co.",
    type: "creative_refresh",
    status: "rolled_back",
    executed_at: "2026-06-04T14:30:00Z",
    executed_by: "auto",
    before_config: { creative_set: "summer_v1", ctr: 2.1 },
    after_config: { creative_set: "summer_v2", ctr: 1.4 },
    rollback_status: "rolled_back",
    rollback_reason: "CTR dropped 33% within 48 hours. Reverted to previous creative set.",
  },
  {
    id: "act-004",
    recommendation_id: "rec-008",
    title: "Increase daily budget cap for Q2 push",
    client_name: "BrewHaus Coffee",
    type: "budget_increase",
    status: "rejected",
    executed_at: null,
    executed_by: "account_manager",
    before_config: { daily_budget: 250 },
    after_config: null,
    rollback_status: "not_applicable",
    rejection_reason: "Client has not approved Q2 budget increase. Waiting for client sign-off.",
  },
  {
    id: "act-005",
    recommendation_id: "rec-009",
    title: "Pause low-ROAS prospecting campaign",
    client_name: "TechEdge Pro",
    type: "campaign_pause",
    status: "approved",
    executed_at: null,
    executed_by: "account_manager",
    before_config: { campaign_status: "active", daily_spend: 890 },
    after_config: { campaign_status: "paused" },
    rollback_status: "pending",
  },
];

export const mockGuardrails: Guardrails = {
  confidence_threshold: 0.75,
  spend_threshold_for_approval: 1000,
  client_data_sharing_level: "anonymized_benchmarks",
  auto_execute_actions: [
    "audience_sync_refresh",
    "stale_data_fix",
    "low_risk_audience_adjustment",
  ],
  restricted_actions: [
    "campaign_pause",
    "budget_reallocation",
    "bid_increase_above_20pct",
    "account_level_changes",
  ],
  rules: [
    { rule: "Human approval required for high-risk recommendations", enabled: true },
    { rule: "Human approval required for budget/campaign pause actions", enabled: true },
    { rule: "Auto-execute allowed for low-risk audience refreshes", enabled: true },
    { rule: "Auto-execute allowed for stale sync fixes", enabled: true },
    { rule: "Maximum auto-spend change: $500/day per client", enabled: true },
    { rule: "Rollback triggered if KPI drops >15% within 48 hours", enabled: true },
  ],
};

export const mockIngestionSettings: IngestionSettings = {
  frequency: "1_hour",
  frequency_label: "1 Hour",
  reason: "Hourly is the best MVP default because it is frequent enough to detect ad performance issues quickly, but avoids excessive API calls, noisy minute-by-minute decisions, and unstable ad-platform signals.",
  options: [
    { value: "realtime", label: "Real-time" },
    { value: "15_min", label: "15 Minutes" },
    { value: "1_hour", label: "1 Hour" },
    { value: "6_hours", label: "6 Hours" },
    { value: "daily", label: "Daily" },
  ],
};

export const mockDataPresets: Record<string, DataPreset> = {
  small: { clients: 10, customers_per_client: 200, days: 30, seed: 7, label: "Small Demo" },
  default: { clients: 60, customers_per_client: 800, days: 90, seed: 42, label: "Default" },
  large: { clients: 100, customers_per_client: 1500, days: 180, seed: 99, label: "Large Dataset" },
};

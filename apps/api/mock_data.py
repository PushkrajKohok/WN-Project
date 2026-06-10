"""
WasteNot Always-On Intelligence Layer — Mock Data
Realistic mock data for all API endpoints, used when database is unavailable.
"""

import uuid
from datetime import datetime, timedelta
import random

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _ts(days_ago: int = 0, hours_ago: int = 0) -> str:
    """Return an ISO timestamp shifted from 'now'."""
    dt = datetime(2026, 6, 9, 14, 30, 0) - timedelta(days=days_ago, hours=hours_ago)
    return dt.isoformat() + "Z"


# ---------------------------------------------------------------------------
# KPIs
# ---------------------------------------------------------------------------

DASHBOARD_KPIS = {
    "wasted_spend_saved": 284_750.00,
    "active_recommendations": 47,
    "high_risk_alerts": 8,
    "auto_actions_executed": 132,
    "trend_7d": {
        "wasted_spend_saved": [38200, 41500, 39800, 42100, 40300, 41900, 40950],
        "recommendations_created": [12, 8, 15, 7, 11, 9, 14],
        "alerts_triggered": [2, 1, 3, 1, 2, 0, 1],
    },
}


# ---------------------------------------------------------------------------
# Recommendations
# ---------------------------------------------------------------------------

CLIENTS = [
    {"id": "c-001", "name": "Bloom & Blossom", "vertical": "Beauty & Skincare", "platform": "Meta"},
    {"id": "c-002", "name": "TechEdge Pro", "vertical": "Consumer Electronics", "platform": "Google"},
    {"id": "c-003", "name": "FreshFit Meals", "vertical": "Health & Nutrition", "platform": "Meta"},
    {"id": "c-004", "name": "UrbanNest Living", "vertical": "Home & Furniture", "platform": "Google"},
    {"id": "c-005", "name": "PawPerfect", "vertical": "Pet Supplies", "platform": "TikTok"},
    {"id": "c-006", "name": "VeloCity Gear", "vertical": "Sports & Outdoors", "platform": "Meta"},
    {"id": "c-007", "name": "LuxeThread Co.", "vertical": "Fashion & Apparel", "platform": "Google"},
    {"id": "c-008", "name": "BrewHaus Coffee", "vertical": "Food & Beverage", "platform": "Meta"},
]

RECOMMENDATIONS = [
    {
        "id": "rec-001",
        "title": "Pause underperforming Meta lookalike audience",
        "client_id": "c-001",
        "client_name": "Bloom & Blossom",
        "platform": "Meta",
        "type": "audience_optimization",
        "expected_savings": 12400.0,
        "confidence": 0.92,
        "risk": "low",
        "status": "pending",
        "decision_required": True,
        "created_at": _ts(0, 2),
        "summary": "Lookalike audience 'LA_Skincare_25-34_US' has a 0.3% CTR vs. 1.8% account average over 14 days. Pausing frees $12.4K/month for higher-performing segments.",
        "evidence": {
            "sql": "SELECT audience_id, avg(ctr) FROM ad_performance_daily WHERE campaign_id='camp-117' GROUP BY audience_id ORDER BY avg(ctr) ASC LIMIT 5;",
            "graph": "14 similar beauty/skincare clients saw 22% avg. ROAS lift after pausing underperforming lookalike audiences in the same spend band ($8K-$15K/month).",
            "vector": "RAG retrieval matched 3 internal playbook entries on 'lookalike audience refresh cadence' (similarity: 0.94, 0.91, 0.88).",
        },
        "risk_assessment": "Low risk — audience pause is fully reversible. No budget reallocation triggered automatically.",
        "rollback_plan": "Re-enable audience segment within Meta Ads Manager. Historical performance data preserved.",
        "agent_trace": [
            {"agent": "Data Scout", "action": "Scanned Meta campaign performance for Bloom & Blossom", "ts": _ts(0, 3)},
            {"agent": "Pattern Miner", "action": "Found 14 similar benchmark cases in beauty/skincare vertical", "ts": _ts(0, 2.5)},
            {"agent": "Recommendation Engine", "action": "Generated recommendation: pause underperforming audience", "ts": _ts(0, 2.2)},
            {"agent": "Risk Grader", "action": "Classified as LOW risk — reversible action, no budget impact", "ts": _ts(0, 2)},
            {"agent": "Human Interface", "action": "Queued for human approval", "ts": _ts(0, 2)},
        ],
    },
    {
        "id": "rec-002",
        "title": "Increase Google Shopping bid for top-converting SKUs",
        "client_id": "c-002",
        "client_name": "TechEdge Pro",
        "platform": "Google",
        "type": "bid_optimization",
        "expected_savings": 8200.0,
        "confidence": 0.87,
        "risk": "medium",
        "status": "pending",
        "decision_required": True,
        "created_at": _ts(0, 5),
        "summary": "Top 5 converting SKUs are consistently hitting impression share cap at current bid. Estimated 34% revenue uplift with 15% bid increase.",
        "evidence": {
            "sql": "SELECT sku, impression_share, conversion_rate, roas FROM ad_performance_daily WHERE client_id='c-002' AND impression_share < 0.6 ORDER BY conversion_rate DESC LIMIT 5;",
            "graph": "8 electronics clients in similar spend bands ($20K-$50K) achieved 28% avg. revenue lift with targeted bid increases on top SKUs.",
            "vector": "RAG matched 2 optimization playbook entries on 'Shopping bid strategy for high-intent queries' (similarity: 0.91, 0.87).",
        },
        "risk_assessment": "Medium risk — bid increase will raise spend. Requires monitoring for 48 hours to validate ROAS holds.",
        "rollback_plan": "Revert bid multiplier to previous value. Set automated alert if ROAS drops below 3.0x within 48 hours.",
        "agent_trace": [
            {"agent": "Data Scout", "action": "Analyzed Google Shopping performance for TechEdge Pro", "ts": _ts(0, 6)},
            {"agent": "Pattern Miner", "action": "Found 8 benchmark cases in electronics vertical", "ts": _ts(0, 5.5)},
            {"agent": "Recommendation Engine", "action": "Generated recommendation: increase bids on top SKUs", "ts": _ts(0, 5.2)},
            {"agent": "Risk Grader", "action": "Classified as MEDIUM risk — spend increase, needs monitoring", "ts": _ts(0, 5)},
            {"agent": "Human Interface", "action": "Queued for human approval", "ts": _ts(0, 5)},
        ],
    },
    {
        "id": "rec-003",
        "title": "Refresh stale audience sync for Klaviyo segment",
        "client_id": "c-003",
        "client_name": "FreshFit Meals",
        "platform": "Meta",
        "type": "audience_sync",
        "expected_savings": 3100.0,
        "confidence": 0.95,
        "risk": "low",
        "status": "auto_approved",
        "decision_required": False,
        "created_at": _ts(1, 0),
        "summary": "Klaviyo 'Active_Subscribers_90d' segment hasn't synced to Meta in 12 days. 2,400 new subscribers missing from targeting.",
        "evidence": {
            "sql": "SELECT segment_name, last_sync_at, member_count FROM audience_segments WHERE client_id='c-003' AND last_sync_at < NOW() - INTERVAL '7 days';",
            "graph": "Stale audience syncs correlate with 18% higher CPA across 23 clients in the network.",
            "vector": "RAG matched playbook entry on 'audience sync freshness SLA' (similarity: 0.96).",
        },
        "risk_assessment": "Low risk — sync refresh is standard maintenance. No spend change.",
        "rollback_plan": "Revert to previous audience membership snapshot if needed.",
        "agent_trace": [
            {"agent": "Data Scout", "action": "Detected stale Klaviyo sync for FreshFit Meals", "ts": _ts(1, 1)},
            {"agent": "Risk Grader", "action": "Classified as LOW risk — auto-approve eligible", "ts": _ts(1, 0.5)},
            {"agent": "Action Executor", "action": "Auto-approved and triggered audience sync refresh", "ts": _ts(1, 0)},
        ],
    },
    {
        "id": "rec-004",
        "title": "Pause campaign with deteriorating ROAS trend",
        "client_id": "c-006",
        "client_name": "VeloCity Gear",
        "platform": "Meta",
        "type": "campaign_pause",
        "expected_savings": 22800.0,
        "confidence": 0.78,
        "risk": "high",
        "status": "pending",
        "decision_required": True,
        "created_at": _ts(0, 1),
        "summary": "Campaign 'Summer_Cycling_Prospecting' ROAS declined from 4.2x to 1.1x over 21 days. Current daily spend: $1,085. Immediate pause recommended.",
        "evidence": {
            "sql": "SELECT date, spend, revenue, roas FROM ad_performance_daily WHERE campaign_id='camp-312' ORDER BY date DESC LIMIT 21;",
            "graph": "6 sports/outdoor clients experienced similar ROAS decay patterns; 5 of 6 recovered after pause + creative refresh.",
            "vector": "RAG matched 4 entries on 'ROAS decay detection and campaign triage' (similarity: 0.93, 0.90, 0.88, 0.85).",
        },
        "risk_assessment": "High risk — campaign pause affects $1K+/day spend. Requires human approval per guardrail policy.",
        "rollback_plan": "Re-enable campaign. Consider creative refresh before relaunch. Set 72-hour monitoring window.",
        "agent_trace": [
            {"agent": "Data Scout", "action": "Detected ROAS decay trend for VeloCity Gear campaign", "ts": _ts(0, 2)},
            {"agent": "Pattern Miner", "action": "Matched 6 similar decay patterns in sports/outdoor vertical", "ts": _ts(0, 1.5)},
            {"agent": "Recommendation Engine", "action": "Generated recommendation: pause deteriorating campaign", "ts": _ts(0, 1.2)},
            {"agent": "Risk Grader", "action": "Classified as HIGH risk — spend exceeds $1K/day threshold", "ts": _ts(0, 1)},
            {"agent": "Human Interface", "action": "Escalated for mandatory human approval", "ts": _ts(0, 1)},
        ],
    },
    {
        "id": "rec-005",
        "title": "Reallocate budget from Search to Shopping",
        "client_id": "c-004",
        "client_name": "UrbanNest Living",
        "platform": "Google",
        "type": "budget_reallocation",
        "expected_savings": 15600.0,
        "confidence": 0.83,
        "risk": "medium",
        "status": "approved",
        "decision_required": False,
        "created_at": _ts(2, 0),
        "summary": "Google Shopping ROAS is 5.8x vs. Search ROAS of 2.1x. Recommend shifting 30% of Search budget ($4,680/month) to Shopping.",
        "evidence": {
            "sql": "SELECT channel, sum(spend), sum(revenue), sum(revenue)/sum(spend) as roas FROM ad_performance_daily WHERE client_id='c-004' GROUP BY channel;",
            "graph": "11 home & furniture clients with similar channel mix saw 41% overall ROAS improvement after Shopping reallocation.",
            "vector": "RAG matched 2 playbook entries on 'channel budget rebalancing methodology' (similarity: 0.92, 0.89).",
        },
        "risk_assessment": "Medium risk — budget reallocation changes channel mix. Requires 7-day observation window.",
        "rollback_plan": "Revert budget split to previous allocation. Preserve historical data for comparison.",
        "agent_trace": [
            {"agent": "Data Scout", "action": "Analyzed channel performance for UrbanNest Living", "ts": _ts(2, 2)},
            {"agent": "Recommendation Engine", "action": "Generated recommendation: reallocate Search → Shopping", "ts": _ts(2, 1)},
            {"agent": "Risk Grader", "action": "Classified as MEDIUM risk — budget change", "ts": _ts(2, 0.5)},
            {"agent": "Human Interface", "action": "Approved by account manager", "ts": _ts(2, 0)},
        ],
    },
    {
        "id": "rec-006",
        "title": "Expand TikTok retargeting audience window",
        "client_id": "c-005",
        "client_name": "PawPerfect",
        "platform": "TikTok",
        "type": "audience_optimization",
        "expected_savings": 4500.0,
        "confidence": 0.88,
        "risk": "low",
        "status": "pending",
        "decision_required": True,
        "created_at": _ts(0, 8),
        "summary": "Current 7-day retargeting window is too narrow; 60% of pet supply purchases happen within 14 days. Expanding to 14-day window projects 18% conversion lift.",
        "evidence": {
            "sql": "SELECT days_to_purchase, count(*) FROM shopify_orders WHERE client_id='c-005' GROUP BY days_to_purchase ORDER BY days_to_purchase;",
            "graph": "9 pet supply clients using 14-day retargeting windows averaged 22% higher ROAS than 7-day windows.",
            "vector": "RAG matched playbook entry on 'retargeting window optimization by vertical' (similarity: 0.93).",
        },
        "risk_assessment": "Low risk — audience window expansion is reversible and doesn't change budget.",
        "rollback_plan": "Revert retargeting window to 7 days in TikTok Ads Manager.",
        "agent_trace": [
            {"agent": "Data Scout", "action": "Analyzed purchase timing data for PawPerfect", "ts": _ts(0, 9)},
            {"agent": "Pattern Miner", "action": "Found 9 pet supply benchmarks for retargeting windows", "ts": _ts(0, 8.5)},
            {"agent": "Recommendation Engine", "action": "Generated recommendation: expand retargeting window", "ts": _ts(0, 8.2)},
            {"agent": "Risk Grader", "action": "Classified as LOW risk — no budget impact", "ts": _ts(0, 8)},
        ],
    },
]


# ---------------------------------------------------------------------------
# Agents
# ---------------------------------------------------------------------------

AGENTS = [
    {
        "id": "agent-data-scout",
        "name": "Data Scout",
        "role": "Continuously scans client data sources for anomalies, stale syncs, and performance shifts.",
        "status": "active",
        "last_run": _ts(0, 0),
        "tasks_completed": 1247,
        "icon": "Radar",
    },
    {
        "id": "agent-pattern-miner",
        "name": "Pattern Miner",
        "role": "Cross-references client performance against anonymized network benchmarks to find optimization opportunities.",
        "status": "active",
        "last_run": _ts(0, 0),
        "tasks_completed": 892,
        "icon": "GitBranch",
    },
    {
        "id": "agent-recommendation-engine",
        "name": "Recommendation Engine",
        "role": "Synthesizes evidence from Data Scout and Pattern Miner to generate actionable optimization recommendations.",
        "status": "active",
        "last_run": _ts(0, 1),
        "tasks_completed": 634,
        "icon": "Lightbulb",
    },
    {
        "id": "agent-risk-grader",
        "name": "Evidence & Risk Grader",
        "role": "Validates recommendation evidence quality and assigns risk scores. Implements Corrective RAG guardrails.",
        "status": "idle",
        "last_run": _ts(0, 1),
        "tasks_completed": 634,
        "icon": "ShieldCheck",
    },
    {
        "id": "agent-action-executor",
        "name": "Action Executor",
        "role": "Executes approved optimizations via ad platform APIs. Handles rollback if performance degrades.",
        "status": "waiting",
        "last_run": _ts(0, 2),
        "tasks_completed": 312,
        "icon": "Zap",
    },
    {
        "id": "agent-human-interface",
        "name": "Human Interface",
        "role": "Routes high-risk or high-impact recommendations for human review. Manages approval workflows.",
        "status": "active",
        "last_run": _ts(0, 0),
        "tasks_completed": 198,
        "icon": "UserCheck",
    },
]

AGENT_LOGS = [
    {"id": "log-001", "agent": "Data Scout", "message": "Scanned Meta campaign performance for Bloom & Blossom. Found 1 underperforming audience segment.", "level": "info", "ts": _ts(0, 0)},
    {"id": "log-002", "agent": "Data Scout", "message": "Detected stale Klaviyo sync for FreshFit Meals — last sync 12 days ago.", "level": "warning", "ts": _ts(0, 0)},
    {"id": "log-003", "agent": "Pattern Miner", "message": "Found 14 similar benchmark cases for beauty/skincare audience optimization.", "level": "info", "ts": _ts(0, 0)},
    {"id": "log-004", "agent": "Data Scout", "message": "Analyzed Google Shopping performance for TechEdge Pro. Top 5 SKUs hitting impression share cap.", "level": "info", "ts": _ts(0, 1)},
    {"id": "log-005", "agent": "Recommendation Engine", "message": "Generated recommendation: pause underperforming audience for Bloom & Blossom.", "level": "info", "ts": _ts(0, 1)},
    {"id": "log-006", "agent": "Risk Grader", "message": "Flagged MEDIUM risk for TechEdge Pro bid increase — spend impact exceeds monitoring threshold.", "level": "warning", "ts": _ts(0, 1)},
    {"id": "log-007", "agent": "Risk Grader", "message": "Classified VeloCity Gear campaign pause as HIGH risk — daily spend exceeds $1,000.", "level": "error", "ts": _ts(0, 1)},
    {"id": "log-008", "agent": "Action Executor", "message": "Auto-executed audience sync refresh for FreshFit Meals (low-risk, pre-approved action type).", "level": "success", "ts": _ts(0, 2)},
    {"id": "log-009", "agent": "Human Interface", "message": "Escalated campaign pause for VeloCity Gear to human review — mandatory approval required.", "level": "warning", "ts": _ts(0, 2)},
    {"id": "log-010", "agent": "Action Executor", "message": "Waiting for human approval on 3 pending recommendations.", "level": "info", "ts": _ts(0, 2)},
    {"id": "log-011", "agent": "Pattern Miner", "message": "Cross-client analysis complete: 47 active benchmarks updated across 8 verticals.", "level": "info", "ts": _ts(0, 3)},
    {"id": "log-012", "agent": "Data Scout", "message": "Ingested 14,200 new ad performance records across 8 clients.", "level": "info", "ts": _ts(0, 3)},
    {"id": "log-013", "agent": "Recommendation Engine", "message": "Generated 6 new recommendations in current scan cycle. 4 pending review, 1 auto-approved, 1 approved.", "level": "info", "ts": _ts(0, 3)},
    {"id": "log-014", "agent": "Data Scout", "message": "Schema validation passed for all 18 data tables. No drift detected.", "level": "info", "ts": _ts(0, 4)},
    {"id": "log-015", "agent": "Pattern Miner", "message": "Updated knowledge graph: 156 new edges added between client campaigns and benchmark patterns.", "level": "info", "ts": _ts(0, 4)},
]


# ---------------------------------------------------------------------------
# Cross-Client Patterns
# ---------------------------------------------------------------------------

PATTERNS = [
    {"id": "pat-001", "category": "Beauty & Skincare", "spend_band": "$5K–$15K/mo", "strategy": "Pause underperforming lookalike audiences", "avg_lift": 22.4, "sample_size": 14, "confidence": 0.91, "privacy_level": "anonymized"},
    {"id": "pat-002", "category": "Consumer Electronics", "spend_band": "$20K–$50K/mo", "strategy": "Increase Shopping bids on top-converting SKUs", "avg_lift": 28.1, "sample_size": 8, "confidence": 0.87, "privacy_level": "anonymized"},
    {"id": "pat-003", "category": "Health & Nutrition", "spend_band": "$3K–$10K/mo", "strategy": "Refresh stale audience syncs weekly", "avg_lift": 18.3, "sample_size": 23, "confidence": 0.94, "privacy_level": "anonymized"},
    {"id": "pat-004", "category": "Home & Furniture", "spend_band": "$15K–$40K/mo", "strategy": "Reallocate Search budget to Shopping", "avg_lift": 41.2, "sample_size": 11, "confidence": 0.85, "privacy_level": "anonymized"},
    {"id": "pat-005", "category": "Pet Supplies", "spend_band": "$5K–$20K/mo", "strategy": "Expand retargeting window to 14 days", "avg_lift": 22.0, "sample_size": 9, "confidence": 0.88, "privacy_level": "anonymized"},
    {"id": "pat-006", "category": "Sports & Outdoors", "spend_band": "$10K–$30K/mo", "strategy": "Pause campaigns with >60% ROAS decay over 21 days", "avg_lift": 35.7, "sample_size": 6, "confidence": 0.78, "privacy_level": "aggregated"},
    {"id": "pat-007", "category": "Fashion & Apparel", "spend_band": "$20K–$60K/mo", "strategy": "Seasonal creative refresh every 14 days", "avg_lift": 19.8, "sample_size": 17, "confidence": 0.90, "privacy_level": "anonymized"},
    {"id": "pat-008", "category": "Food & Beverage", "spend_band": "$2K–$8K/mo", "strategy": "Daypart budget optimization for meal-time targeting", "avg_lift": 26.5, "sample_size": 12, "confidence": 0.86, "privacy_level": "anonymized"},
]

KNOWLEDGE_GRAPH_EDGES = [
    {"source": "Bloom & Blossom", "target": "Beauty & Skincare Benchmark", "relation": "matches_pattern", "weight": 0.92},
    {"source": "TechEdge Pro", "target": "Electronics Bid Strategy", "relation": "matches_pattern", "weight": 0.87},
    {"source": "FreshFit Meals", "target": "Audience Sync SLA", "relation": "violates_sla", "weight": 0.95},
    {"source": "UrbanNest Living", "target": "Channel Rebalancing Pattern", "relation": "matches_pattern", "weight": 0.85},
    {"source": "PawPerfect", "target": "Retargeting Window Benchmark", "relation": "matches_pattern", "weight": 0.88},
    {"source": "VeloCity Gear", "target": "ROAS Decay Detection", "relation": "triggers_alert", "weight": 0.78},
    {"source": "LuxeThread Co.", "target": "Creative Refresh Cadence", "relation": "matches_pattern", "weight": 0.90},
    {"source": "BrewHaus Coffee", "target": "Daypart Optimization", "relation": "matches_pattern", "weight": 0.86},
    {"source": "Beauty & Skincare Benchmark", "target": "Lookalike Audience Playbook", "relation": "references", "weight": 0.94},
    {"source": "Electronics Bid Strategy", "target": "Shopping Bid Playbook", "relation": "references", "weight": 0.91},
    {"source": "ROAS Decay Detection", "target": "Campaign Triage Playbook", "relation": "references", "weight": 0.93},
    {"source": "Audience Sync SLA", "target": "Sync Freshness Playbook", "relation": "references", "weight": 0.96},
]


# ---------------------------------------------------------------------------
# Actions
# ---------------------------------------------------------------------------

ACTIONS = [
    {
        "id": "act-001",
        "recommendation_id": "rec-003",
        "title": "Refresh stale audience sync for Klaviyo segment",
        "client_name": "FreshFit Meals",
        "type": "audience_sync",
        "status": "executed",
        "executed_at": _ts(1, 0),
        "executed_by": "auto",
        "before_config": {"sync_status": "stale", "last_sync": "2026-05-28", "member_count": 4200},
        "after_config": {"sync_status": "active", "last_sync": "2026-06-08", "member_count": 6600},
        "rollback_status": "not_needed",
    },
    {
        "id": "act-002",
        "recommendation_id": "rec-005",
        "title": "Reallocate budget from Search to Shopping",
        "client_name": "UrbanNest Living",
        "type": "budget_reallocation",
        "status": "executed",
        "executed_at": _ts(2, 0),
        "executed_by": "account_manager",
        "before_config": {"search_budget": 15600, "shopping_budget": 10400},
        "after_config": {"search_budget": 10920, "shopping_budget": 15080},
        "rollback_status": "not_needed",
    },
    {
        "id": "act-003",
        "recommendation_id": "rec-007",
        "title": "Creative refresh for summer campaign",
        "client_name": "LuxeThread Co.",
        "type": "creative_refresh",
        "status": "rolled_back",
        "executed_at": _ts(5, 0),
        "executed_by": "auto",
        "before_config": {"creative_set": "summer_v1", "ctr": 2.1},
        "after_config": {"creative_set": "summer_v2", "ctr": 1.4},
        "rollback_status": "rolled_back",
        "rollback_reason": "CTR dropped 33% within 48 hours. Reverted to previous creative set.",
    },
    {
        "id": "act-004",
        "recommendation_id": "rec-008",
        "title": "Increase daily budget cap for Q2 push",
        "client_name": "BrewHaus Coffee",
        "type": "budget_increase",
        "status": "rejected",
        "executed_at": None,
        "executed_by": "account_manager",
        "before_config": {"daily_budget": 250},
        "after_config": None,
        "rollback_status": "not_applicable",
        "rejection_reason": "Client has not approved Q2 budget increase. Waiting for client sign-off.",
    },
    {
        "id": "act-005",
        "recommendation_id": "rec-009",
        "title": "Pause low-ROAS prospecting campaign",
        "client_name": "TechEdge Pro",
        "type": "campaign_pause",
        "status": "approved",
        "executed_at": None,
        "executed_by": "account_manager",
        "before_config": {"campaign_status": "active", "daily_spend": 890},
        "after_config": {"campaign_status": "paused"},
        "rollback_status": "pending",
    },
]


# ---------------------------------------------------------------------------
# Guardrails
# ---------------------------------------------------------------------------

GUARDRAILS = {
    "confidence_threshold": 0.75,
    "spend_threshold_for_approval": 1000,
    "client_data_sharing_level": "anonymized_benchmarks",
    "auto_execute_actions": [
        "audience_sync_refresh",
        "stale_data_fix",
        "low_risk_audience_adjustment",
    ],
    "restricted_actions": [
        "campaign_pause",
        "budget_reallocation",
        "bid_increase_above_20pct",
        "account_level_changes",
    ],
    "rules": [
        {"rule": "Human approval required for high-risk recommendations", "enabled": True},
        {"rule": "Human approval required for budget/campaign pause actions", "enabled": True},
        {"rule": "Auto-execute allowed for low-risk audience refreshes", "enabled": True},
        {"rule": "Auto-execute allowed for stale sync fixes", "enabled": True},
        {"rule": "Maximum auto-spend change: $500/day per client", "enabled": True},
        {"rule": "Rollback triggered if KPI drops >15% within 48 hours", "enabled": True},
    ],
}


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------

INGESTION_SETTINGS = {
    "frequency": "1_hour",
    "frequency_label": "1 Hour",
    "reason": "Hourly is the best MVP default because it is frequent enough to detect ad performance issues quickly, but avoids excessive API calls, noisy minute-by-minute decisions, and unstable ad-platform signals.",
    "options": [
        {"value": "realtime", "label": "Real-time"},
        {"value": "15_min", "label": "15 Minutes"},
        {"value": "1_hour", "label": "1 Hour"},
        {"value": "6_hours", "label": "6 Hours"},
        {"value": "daily", "label": "Daily"},
    ],
}


# ---------------------------------------------------------------------------
# Data Generation Presets
# ---------------------------------------------------------------------------

DATA_PRESETS = {
    "small": {"clients": 10, "customers_per_client": 200, "days": 30, "seed": 42, "label": "Small Demo"},
    "default": {"clients": 60, "customers_per_client": 800, "days": 90, "seed": 42, "label": "Default"},
    "large": {"clients": 100, "customers_per_client": 1500, "days": 180, "seed": 99, "label": "Large Dataset"},
}

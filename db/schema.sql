-- ============================================================
-- WasteNot Database Schema
-- Compatible with local PostgreSQL and Supabase
-- Optimized for high-reliability analytical ingestion
-- ============================================================

-- Enable pgcrypto for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- 1. SYNTHETIC SOURCE TABLES
-- ─────────────────────────────────────────────────────────────

-- 1. clients
CREATE TABLE IF NOT EXISTS clients (
    client_id TEXT PRIMARY KEY,
    brand_name TEXT NOT NULL,
    brand_category TEXT NOT NULL,
    monthly_ad_spend_band TEXT NOT NULL,
    avg_order_value NUMERIC NOT NULL,
    gross_margin_pct NUMERIC NOT NULL,
    shopify_store_domain TEXT,
    klaviyo_account_id TEXT,
    meta_account_id TEXT,
    google_ads_customer_id TEXT,
    snowflake_schema TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_consent_status TEXT
);

-- 2. products
CREATE TABLE IF NOT EXISTS products (
    product_id TEXT PRIMARY KEY,
    client_id TEXT,
    sku TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_category TEXT NOT NULL,
    price NUMERIC NOT NULL,
    margin_pct NUMERIC NOT NULL,
    active_flag BOOLEAN DEFAULT TRUE
);

-- 3. customers
CREATE TABLE IF NOT EXISTS customers (
    customer_id TEXT PRIMARY KEY,
    client_id TEXT,
    email_hash TEXT,
    first_seen_at TIMESTAMP WITH TIME ZONE,
    acquisition_source TEXT,
    country TEXT,
    state_region TEXT,
    lifetime_value NUMERIC NOT NULL,
    order_count INTEGER NOT NULL,
    last_order_at TIMESTAMP WITH TIME ZONE,
    consent_email BOOLEAN DEFAULT FALSE,
    consent_ads BOOLEAN DEFAULT FALSE,
    segment_hint TEXT
);

-- 4. shopify_orders
CREATE TABLE IF NOT EXISTS shopify_orders (
    order_id TEXT PRIMARY KEY,
    client_id TEXT,
    customer_id TEXT,
    email_hash TEXT,
    order_ts TIMESTAMP WITH TIME ZONE NOT NULL,
    order_value NUMERIC NOT NULL,
    discount_used BOOLEAN DEFAULT FALSE,
    discount_amount NUMERIC DEFAULT 0,
    payment_status TEXT,
    fulfillment_status TEXT,
    sales_channel TEXT
);

-- 5. shopify_order_items
CREATE TABLE IF NOT EXISTS shopify_order_items (
    order_id TEXT,
    client_id TEXT,
    product_id TEXT,
    sku TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    item_price NUMERIC NOT NULL,
    item_margin_pct NUMERIC NOT NULL,
    PRIMARY KEY (order_id, product_id, sku)
);

-- 6. klaviyo_events
CREATE TABLE IF NOT EXISTS klaviyo_events (
    event_id TEXT PRIMARY KEY,
    client_id TEXT,
    profile_id TEXT,
    customer_id TEXT,
    email_hash TEXT,
    event_type TEXT NOT NULL,
    event_ts TIMESTAMP WITH TIME ZONE NOT NULL,
    flow_or_campaign_name TEXT,
    message_channel TEXT,
    revenue_attributed NUMERIC DEFAULT 0,
    properties_json JSONB
);

-- 7. ad_campaign_settings
CREATE TABLE IF NOT EXISTS ad_campaign_settings (
    campaign_id TEXT PRIMARY KEY,
    client_id TEXT,
    platform TEXT NOT NULL, -- e.g., 'Meta', 'Google'
    campaign_name TEXT NOT NULL,
    objective TEXT,
    status TEXT NOT NULL,
    daily_budget NUMERIC NOT NULL,
    bid_strategy TEXT,
    attribution_window TEXT,
    created_at TIMESTAMP WITH TIME ZONE
);

-- 8. ad_adsets
CREATE TABLE IF NOT EXISTS ad_adsets (
    adset_id TEXT PRIMARY KEY,
    campaign_id TEXT,
    client_id TEXT,
    platform TEXT NOT NULL,
    adset_name TEXT NOT NULL,
    audience_type TEXT,
    status TEXT NOT NULL,
    daily_budget NUMERIC,
    optimization_goal TEXT,
    targeting_summary JSONB
);

-- 9. ad_performance_daily
CREATE TABLE IF NOT EXISTS ad_performance_daily (
    performance_id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    client_id TEXT,
    platform TEXT NOT NULL,
    campaign_id TEXT,
    adset_id TEXT,
    spend NUMERIC NOT NULL,
    impressions INTEGER NOT NULL,
    clicks INTEGER NOT NULL,
    add_to_cart INTEGER DEFAULT 0,
    purchases INTEGER DEFAULT 0,
    revenue NUMERIC DEFAULT 0,
    cpa NUMERIC,
    roas NUMERIC,
    frequency NUMERIC,
    ctr NUMERIC,
    cpc NUMERIC
);

-- 10. audience_segments
CREATE TABLE IF NOT EXISTS audience_segments (
    audience_id TEXT PRIMARY KEY,
    client_id TEXT,
    audience_name TEXT NOT NULL,
    source_system TEXT,
    rule_expression TEXT,
    segment_type TEXT,
    estimated_size INTEGER,
    destination_platforms TEXT,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    sync_status TEXT
);

-- 11. audience_memberships
CREATE TABLE IF NOT EXISTS audience_memberships (
    membership_id TEXT PRIMARY KEY,
    audience_id TEXT,
    client_id TEXT,
    customer_id TEXT,
    email_hash TEXT,
    membership_reason TEXT,
    added_at TIMESTAMP WITH TIME ZONE
);

-- 12. optimization_history
CREATE TABLE IF NOT EXISTS optimization_history (
    optimization_id TEXT PRIMARY KEY,
    client_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    agent_name TEXT NOT NULL,
    action_type TEXT NOT NULL,
    target_platform TEXT,
    target_campaign_id TEXT,
    reason TEXT,
    expected_impact_pct NUMERIC,
    confidence_score NUMERIC,
    risk_level TEXT,
    status TEXT NOT NULL,
    approved_by TEXT,
    actual_impact_pct NUMERIC,
    rollback_flag BOOLEAN DEFAULT FALSE,
    evidence_refs JSONB
);

-- 13. cross_client_benchmarks
CREATE TABLE IF NOT EXISTS cross_client_benchmarks (
    benchmark_id TEXT PRIMARY KEY,
    anonymized_cohort_id TEXT,
    brand_category TEXT NOT NULL,
    monthly_ad_spend_band TEXT NOT NULL,
    strategy TEXT NOT NULL,
    primary_metric TEXT,
    avg_lift_pct NUMERIC NOT NULL,
    median_lift_pct NUMERIC NOT NULL,
    sample_size INTEGER NOT NULL,
    confidence_score NUMERIC NOT NULL,
    privacy_level TEXT NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE
);

-- 14. recommendation_records
CREATE TABLE IF NOT EXISTS recommendation_records (
    recommendation_id TEXT PRIMARY KEY,
    client_id TEXT,
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    recommendation_type TEXT NOT NULL,
    title TEXT NOT NULL,
    target_platform TEXT,
    target_campaign_id TEXT,
    evidence_summary TEXT,
    supporting_benchmark_id TEXT,
    expected_weekly_savings NUMERIC,
    expected_roas_lift_pct NUMERIC,
    confidence_score NUMERIC,
    risk_level TEXT,
    decision_required TEXT DEFAULT 'human_approval',
    status TEXT NOT NULL
);

-- 15. knowledge_graph_edges
CREATE TABLE IF NOT EXISTS knowledge_graph_edges (
    edge_id TEXT PRIMARY KEY,
    source_node_type TEXT NOT NULL,
    source_node_id TEXT NOT NULL,
    relationship TEXT NOT NULL,
    target_node_type TEXT NOT NULL,
    target_node_id TEXT NOT NULL,
    weight NUMERIC NOT NULL,
    evidence_count INTEGER DEFAULT 1,
    last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 16. rag_documents
CREATE TABLE IF NOT EXISTS rag_documents (
    doc_id TEXT PRIMARY KEY,
    client_id TEXT,
    doc_type TEXT,
    source_table TEXT,
    source_record_id TEXT,
    chunk_id INTEGER,
    embedding_group TEXT,
    text TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
    -- Embeddings can be added later using pgvector once RAG retrieval is implemented.
    -- embedding vector(1536)
);

-- 17. schema_versions
CREATE TABLE IF NOT EXISTS schema_versions (
    schema_event_id TEXT PRIMARY KEY,
    source_system TEXT NOT NULL,
    table_name TEXT NOT NULL,
    schema_version TEXT NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    drift_type TEXT NOT NULL,
    added_columns JSONB,
    removed_columns JSONB,
    action_taken TEXT,
    status TEXT NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- 2. APP SUPPORT TABLES
-- ─────────────────────────────────────────────────────────────

-- 1. Ingestion Jobs Tracker
CREATE TABLE IF NOT EXISTS ingestion_jobs (
    job_id TEXT PRIMARY KEY,
    status TEXT NOT NULL, -- 'queued', 'running', 'completed', 'failed'
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    data_dir TEXT NOT NULL,
    row_counts JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Agent Operational Logs
CREATE TABLE IF NOT EXISTS agent_logs (
    log_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    job_id TEXT REFERENCES ingestion_jobs(job_id) ON DELETE SET NULL,
    agent TEXT NOT NULL,
    message TEXT NOT NULL,
    level TEXT NOT NULL, -- 'info', 'warning', 'error', 'success'
    related_entity_type TEXT,
    related_entity_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_runs (
    run_id TEXT PRIMARY KEY,
    run_type TEXT,
    status TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    triggered_by TEXT,
    summary TEXT,
    error_message TEXT
);

CREATE TABLE IF NOT EXISTS agent_run_steps (
    step_id TEXT PRIMARY KEY,
    run_id TEXT REFERENCES agent_runs(run_id) ON DELETE CASCADE,
    step_order INTEGER,
    agent_name TEXT,
    status TEXT,
    tool_used TEXT,
    public_summary TEXT,
    related_entity_type TEXT,
    related_entity_id TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 3. Guardrails Config Settings
CREATE TABLE IF NOT EXISTS guardrail_settings (
    id SERIAL PRIMARY KEY,
    confidence_threshold NUMERIC NOT NULL DEFAULT 0.75,
    high_risk_requires_approval BOOLEAN NOT NULL DEFAULT TRUE,
    budget_changes_require_approval BOOLEAN NOT NULL DEFAULT TRUE,
    campaign_pause_requires_approval BOOLEAN NOT NULL DEFAULT TRUE,
    auto_execute_low_risk_audience_refresh BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Ingestion Global Settings
CREATE TABLE IF NOT EXISTS ingestion_settings (
    id SERIAL PRIMARY KEY,
    frequency_label TEXT NOT NULL DEFAULT '1 hour',
    frequency_minutes INTEGER NOT NULL DEFAULT 60,
    reason TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────
-- 3. INDEXES
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_clients_consent ON clients(data_consent_status);

CREATE INDEX IF NOT EXISTS idx_products_client ON products(client_id);

CREATE INDEX IF NOT EXISTS idx_customers_client ON customers(client_id);
CREATE INDEX IF NOT EXISTS idx_customers_created ON customers(first_seen_at);

CREATE INDEX IF NOT EXISTS idx_orders_client ON shopify_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON shopify_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON shopify_orders(order_ts);

CREATE INDEX IF NOT EXISTS idx_order_items_product ON shopify_order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_klaviyo_client ON klaviyo_events(client_id);
CREATE INDEX IF NOT EXISTS idx_klaviyo_customer ON klaviyo_events(customer_id);
CREATE INDEX IF NOT EXISTS idx_klaviyo_ts ON klaviyo_events(event_ts);

CREATE INDEX IF NOT EXISTS idx_campaigns_client ON ad_campaign_settings(client_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_created ON ad_campaign_settings(created_at);

CREATE INDEX IF NOT EXISTS idx_adsets_campaign ON ad_adsets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_adsets_client ON ad_adsets(client_id);

CREATE INDEX IF NOT EXISTS idx_ad_perf_daily_client ON ad_performance_daily(client_id);
CREATE INDEX IF NOT EXISTS idx_ad_perf_daily_campaign ON ad_performance_daily(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_perf_daily_adset ON ad_performance_daily(adset_id);
CREATE INDEX IF NOT EXISTS idx_ad_perf_daily_date ON ad_performance_daily(date);

CREATE INDEX IF NOT EXISTS idx_audience_seg_client ON audience_segments(client_id);

CREATE INDEX IF NOT EXISTS idx_audience_mem_audience ON audience_memberships(audience_id);
CREATE INDEX IF NOT EXISTS idx_audience_mem_customer ON audience_memberships(customer_id);

CREATE INDEX IF NOT EXISTS idx_opt_hist_client ON optimization_history(client_id);
CREATE INDEX IF NOT EXISTS idx_opt_hist_campaign ON optimization_history(target_campaign_id);
CREATE INDEX IF NOT EXISTS idx_opt_hist_created ON optimization_history(created_at);
CREATE INDEX IF NOT EXISTS idx_opt_hist_risk_level ON optimization_history(risk_level);
CREATE INDEX IF NOT EXISTS idx_opt_hist_status ON optimization_history(status);

CREATE INDEX IF NOT EXISTS idx_benchmarks_benchmark_id ON cross_client_benchmarks(benchmark_id);

CREATE INDEX IF NOT EXISTS idx_recs_recommendation_id ON recommendation_records(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_recs_client ON recommendation_records(client_id);
CREATE INDEX IF NOT EXISTS idx_recs_campaign ON recommendation_records(target_campaign_id);
CREATE INDEX IF NOT EXISTS idx_recs_benchmark ON recommendation_records(supporting_benchmark_id);
CREATE INDEX IF NOT EXISTS idx_recs_detected ON recommendation_records(detected_at);
CREATE INDEX IF NOT EXISTS idx_recs_risk_level ON recommendation_records(risk_level);
CREATE INDEX IF NOT EXISTS idx_recs_status ON recommendation_records(status);

CREATE INDEX IF NOT EXISTS idx_kg_source ON knowledge_graph_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_kg_target ON knowledge_graph_edges(target_node_id);

CREATE INDEX IF NOT EXISTS idx_rag_client ON rag_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_rag_doc_type ON rag_documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_rag_embedding_group ON rag_documents(embedding_group);

CREATE INDEX IF NOT EXISTS idx_schema_vers_detected ON schema_versions(detected_at);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON ingestion_jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created ON ingestion_jobs(created_at);

CREATE INDEX IF NOT EXISTS idx_logs_created ON agent_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_logs_agent ON agent_logs(agent);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_started ON agent_runs(started_at);
CREATE INDEX IF NOT EXISTS idx_agent_run_steps_run ON agent_run_steps(run_id);
CREATE INDEX IF NOT EXISTS idx_agent_run_steps_agent ON agent_run_steps(agent_name);

-- ─────────────────────────────────────────────────────────────
-- 4. DEFAULT SEED INSERTS
-- ─────────────────────────────────────────────────────────────

-- Seed settings
INSERT INTO ingestion_settings (frequency_label, frequency_minutes, reason)
VALUES (
    '1 hour',
    60,
    'Hourly is the best MVP default because it is frequent enough to detect ad performance issues quickly, but avoids excessive API calls, noisy minute-by-minute decisions, and unstable ad-platform signals.'
) ON CONFLICT DO NOTHING;

-- Seed guardrails
INSERT INTO guardrail_settings (
    confidence_threshold,
    high_risk_requires_approval,
    budget_changes_require_approval,
    campaign_pause_requires_approval,
    auto_execute_low_risk_audience_refresh
)
VALUES (
    0.75,
    TRUE,
    TRUE,
    TRUE,
    TRUE
) ON CONFLICT DO NOTHING;

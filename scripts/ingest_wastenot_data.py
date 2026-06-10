#!/usr/bin/env python3
"""
WasteNot Synthetic Data Ingestion Pipeline
Loads synthetic eCommerce & ad optimization datasets into PostgreSQL/Supabase database.
"""

import os
import sys
import argparse
import subprocess
import zipfile
import tempfile
import csv
import json
import logging
from datetime import datetime

try:
    import psycopg
except ImportError:  # pragma: no cover - dependency guard for clean CLI errors.
    psycopg = None

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("ingest")

# Dependency-safe loading & truncation order
TABLES_ORDER = [
    "clients",
    "products",
    "customers",
    "shopify_orders",
    "shopify_order_items",
    "klaviyo_events",
    "ad_campaign_settings",
    "ad_adsets",
    "ad_performance_daily",
    "audience_segments",
    "audience_memberships",
    "optimization_history",
    "cross_client_benchmarks",
    "recommendation_records",
    "knowledge_graph_edges",
    "rag_documents",
    "schema_versions",
]

# Field type mappings for safe conversions
TABLE_SCHEMAS = {
    "clients": {
        "client_id": "text", "brand_name": "text", "brand_category": "text",
        "monthly_ad_spend_band": "text", "avg_order_value": "numeric", "gross_margin_pct": "numeric",
        "shopify_store_domain": "text", "klaviyo_account_id": "text", "meta_account_id": "text",
        "google_ads_customer_id": "text", "snowflake_schema": "text", "created_at": "timestamp",
        "data_consent_status": "text"
    },
    "products": {
        "product_id": "text", "client_id": "text", "sku": "text", "product_name": "text",
        "product_category": "text", "price": "numeric", "margin_pct": "numeric", "active_flag": "boolean"
    },
    "customers": {
        "customer_id": "text", "client_id": "text", "email_hash": "text", "first_seen_at": "timestamp",
        "acquisition_source": "text", "country": "text", "state_region": "text", "lifetime_value": "numeric",
        "order_count": "integer", "last_order_at": "timestamp", "consent_email": "boolean",
        "consent_ads": "boolean", "segment_hint": "text"
    },
    "shopify_orders": {
        "order_id": "text", "client_id": "text", "customer_id": "text", "email_hash": "text",
        "order_ts": "timestamp", "order_value": "numeric", "discount_used": "boolean",
        "discount_amount": "numeric", "payment_status": "text", "fulfillment_status": "text",
        "sales_channel": "text"
    },
    "shopify_order_items": {
        "order_id": "text", "client_id": "text", "product_id": "text", "sku": "text",
        "quantity": "integer", "item_price": "numeric", "item_margin_pct": "numeric"
    },
    "klaviyo_events": {
        "event_id": "text", "client_id": "text", "profile_id": "text", "customer_id": "text",
        "email_hash": "text", "event_type": "text", "event_ts": "timestamp", "flow_or_campaign_name": "text",
        "message_channel": "text", "revenue_attributed": "numeric", "properties_json": "jsonb"
    },
    "ad_campaign_settings": {
        "campaign_id": "text", "client_id": "text", "platform": "text", "campaign_name": "text",
        "objective": "text", "status": "text", "daily_budget": "numeric", "bid_strategy": "text",
        "attribution_window": "text", "created_at": "timestamp"
    },
    "ad_adsets": {
        "adset_id": "text", "campaign_id": "text", "client_id": "text", "platform": "text",
        "adset_name": "text", "audience_type": "text", "status": "text", "daily_budget": "numeric",
        "optimization_goal": "text", "targeting_summary": "jsonb"
    },
    "ad_performance_daily": {
        "performance_id": "text", "date": "date", "client_id": "text", "platform": "text",
        "campaign_id": "text", "adset_id": "text", "spend": "numeric", "impressions": "integer",
        "clicks": "integer", "add_to_cart": "integer", "purchases": "integer", "revenue": "numeric",
        "cpa": "numeric", "roas": "numeric", "frequency": "numeric", "ctr": "numeric", "cpc": "numeric"
    },
    "audience_segments": {
        "audience_id": "text", "client_id": "text", "audience_name": "text", "source_system": "text",
        "rule_expression": "text", "segment_type": "text", "estimated_size": "integer",
        "destination_platforms": "text", "last_synced_at": "timestamp", "sync_status": "text"
    },
    "audience_memberships": {
        "membership_id": "text", "audience_id": "text", "client_id": "text", "customer_id": "text",
        "email_hash": "text", "membership_reason": "text", "added_at": "timestamp"
    },
    "optimization_history": {
        "optimization_id": "text", "client_id": "text", "created_at": "timestamp", "agent_name": "text",
        "action_type": "text", "target_platform": "text", "target_campaign_id": "text", "reason": "text",
        "expected_impact_pct": "numeric", "confidence_score": "numeric", "risk_level": "text",
        "status": "text", "approved_by": "text", "actual_impact_pct": "numeric", "rollback_flag": "boolean",
        "evidence_refs": "jsonb"
    },
    "cross_client_benchmarks": {
        "benchmark_id": "text", "anonymized_cohort_id": "text", "brand_category": "text",
        "monthly_ad_spend_band": "text", "strategy": "text", "primary_metric": "text",
        "avg_lift_pct": "numeric", "median_lift_pct": "numeric", "sample_size": "integer",
        "confidence_score": "numeric", "privacy_level": "text", "generated_at": "timestamp"
    },
    "recommendation_records": {
        "recommendation_id": "text", "client_id": "text", "detected_at": "timestamp",
        "recommendation_type": "text", "title": "text", "target_platform": "text",
        "target_campaign_id": "text", "evidence_summary": "text", "supporting_benchmark_id": "text",
        "expected_weekly_savings": "numeric", "expected_roas_lift_pct": "numeric",
        "confidence_score": "numeric", "risk_level": "text", "decision_required": "boolean", "status": "text"
    },
    "knowledge_graph_edges": {
        "edge_id": "text", "source_node_type": "text", "source_node_id": "text", "relationship": "text",
        "target_node_type": "text", "target_node_id": "text", "weight": "numeric",
        "evidence_count": "integer", "last_updated_at": "timestamp"
    },
    "rag_documents": {
        "doc_id": "text", "client_id": "text", "doc_type": "text", "source_table": "text",
        "source_record_id": "text", "chunk_id": "integer", "embedding_group": "text", "text": "text",
        "updated_at": "timestamp"
    },
    "schema_versions": {
        "schema_event_id": "text", "source_system": "text", "table_name": "text", "schema_version": "text",
        "detected_at": "timestamp", "drift_type": "text", "added_columns": "jsonb",
        "removed_columns": "jsonb", "action_taken": "text", "status": "text"
    }
}

def clean_value(val: str, expected_type: str):
    """Converts a raw string representation to appropriate Python / SQL type."""
    if val is None or val.strip() == "" or val.upper() == "NULL" or val.upper() == "NAN":
        return None
    
    val_strip = val.strip()

    if expected_type == "boolean":
        return val_strip.lower() in ("true", "t", "1", "yes", "y")
    elif expected_type == "integer":
        try:
            return int(float(val_strip))
        except ValueError:
            return None
    elif expected_type == "numeric":
        try:
            return float(val_strip)
        except ValueError:
            return None
    elif expected_type == "jsonb":
        try:
            # Check if it looks like a JSON array or object
            return json.dumps(json.loads(val_strip))
        except Exception:
            # Fallback wrapper if it is just a string but marked JSON
            return json.dumps({"value": val_strip})
    elif expected_type == "date":
        # Expecting YYYY-MM-DD
        return val_strip
    elif expected_type == "timestamp":
        # Handle ISO timestamp formats
        return val_strip
    
    return val_strip

def find_csv_files(directory: str) -> dict:
    """Walks the directory and finds matching CSV files for tables."""
    csv_map = {}
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".csv"):
                name_without_ext = os.path.splitext(file)[0]
                if name_without_ext in TABLE_SCHEMAS:
                    csv_map[name_without_ext] = os.path.join(root, file)
    return csv_map

def run_generator(data_dir: str, clients: int, customers: int, days: int, seed: int):
    """Executes the synthetic data generator."""
    logger.info("Executing synthetic data generator script...")
    generator_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "generate_wastenot_synthetic_data.py")
    )
    if not os.path.exists(generator_path):
        # Fallback to look inside data dictionary if not found in scripts/
        generator_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "scripts", "generate_wastenot_synthetic_data.py")
        )
        if not os.path.exists(generator_path):
            raise FileNotFoundError("generate_wastenot_synthetic_data.py not found in scripts or root.")

    os.makedirs(data_dir, exist_ok=True)
    cmd = [
        sys.executable,
        generator_path,
        "--output-dir", data_dir,
        "--clients", str(clients),
        "--customers-per-client", str(customers),
        "--days", str(days),
        "--seed", str(seed)
    ]
    logger.info(f"Command: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        logger.error(f"Generation failed: {result.stderr}")
        raise RuntimeError(f"Data generation script failed: {result.stderr}")
    logger.info("Synthetic data generated successfully.")

def extract_if_zip(path: str) -> str:
    """If path is a zip, extracts to a temporary folder and returns the path."""
    if os.path.isfile(path) and zipfile.is_zipfile(path):
        temp_dir = tempfile.mkdtemp(prefix="wastenot_extracted_")
        logger.info(f"Extracting zip package {path} to {temp_dir}...")
        with zipfile.ZipFile(path, 'r') as zip_ref:
            zip_ref.extractall(temp_dir)
        return temp_dir
    return path

def truncate_tables(conn, order: list):
    """Truncates tables in safe database order."""
    logger.info("Truncating existing data tables...")
    with conn.cursor() as cur:
        # Disable triggers to speed up and prevent FK restrictions during manual reset
        cur.execute("SET session_replication_role = 'replica';")
        for table in reversed(order):
            cur.execute(f"TRUNCATE TABLE {table} CASCADE;")
        cur.execute("SET session_replication_role = 'origin';")
    logger.info("Truncation completed successfully.")

def ingest_csv_to_table(conn, table_name: str, csv_path: str) -> int:
    """Parses a CSV file and loads it into a matching database table using batch inserts."""
    schema = TABLE_SCHEMAS[table_name]
    
    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames
        if not headers:
            logger.warning(f"Empty CSV file: {csv_path}")
            return 0
        
        # Verify columns from headers match schema
        valid_cols = [h for h in headers if h in schema]
        if not valid_cols:
            logger.warning(f"No columns in CSV {csv_path} match schema for table {table_name}")
            return 0
            
        columns_str = ", ".join(valid_cols)
        placeholders = ", ".join(["%s"] * len(valid_cols))
        
        insert_query = f"INSERT INTO {table_name} ({columns_str}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"
        
        rows_to_insert = []
        count = 0
        batch_size = 1000
        
        with conn.cursor() as cur:
            for row in reader:
                vals = []
                for col in valid_cols:
                    raw_val = row.get(col)
                    expected_type = schema[col]
                    vals.append(clean_value(raw_val, expected_type))
                rows_to_insert.append(vals)
                
                if len(rows_to_insert) >= batch_size:
                    cur.executemany(insert_query, rows_to_insert)
                    count += len(rows_to_insert)
                    rows_to_insert = []
            
            if rows_to_insert:
                cur.executemany(insert_query, rows_to_insert)
                count += len(rows_to_insert)
                
    return count

def record_job(conn, job_id: str, status: str, data_dir: str, started_at: datetime, completed_at: datetime = None, row_counts: dict = None, error_message: str = None):
    """Upserts job status tracking row."""
    query = """
        INSERT INTO ingestion_jobs (job_id, status, started_at, completed_at, data_dir, row_counts, error_message)
        VALUES (%s, %s, %s, %s, %s, %s::jsonb, %s)
        ON CONFLICT (job_id) DO UPDATE SET
            status = EXCLUDED.status,
            completed_at = EXCLUDED.completed_at,
            row_counts = EXCLUDED.row_counts,
            error_message = EXCLUDED.error_message
    """
    row_counts_json = json.dumps(row_counts) if row_counts else None
    with conn.cursor() as cur:
        cur.execute(query, (job_id, status, started_at, completed_at, data_dir, row_counts_json, error_message))

def main():
    parser = argparse.ArgumentParser(description="Ingest WasteNot Synthetic Data")
    parser.add_argument("--data-dir", required=True, help="Directory containing synthetic CSV files or a zip file package")
    parser.add_argument("--database-url", default=os.getenv("DATABASE_URL"), help="PostgreSQL connection string")
    parser.add_argument("--reset", action="store_true", help="Truncate all tables prior to ingestion")
    parser.add_argument("--generate", action="store_true", help="Trigger synthetic data generator first")
    parser.add_argument("--clients", type=int, default=60, help="Generator: number of clients")
    parser.add_argument("--customers-per-client", type=int, default=800, help="Generator: customers per client")
    parser.add_argument("--days", type=int, default=90, help="Generator: days of history")
    parser.add_argument("--seed", type=int, default=42, help="Generator: random seed")
    
    args = parser.parse_args()

    if psycopg is None:
        logger.error("psycopg is not installed. Run: pip install -r apps/api/requirements.txt")
        sys.exit(1)
    
    if not args.database_url:
        logger.error("Database connection URL not supplied. Set DATABASE_URL or pass --database-url.")
        sys.exit(1)
        
    job_id = f"job_{int(datetime.now().timestamp())}"
    started_at = datetime.now()
    row_counts = {}
    
    # 1. Generate if requested
    if args.generate:
        try:
            run_generator(args.data_dir, args.clients, args.customers_per_client, args.days, args.seed)
        except Exception as e:
            logger.error(f"Generation aborted: {e}")
            sys.exit(1)

    # 2. Extract Zip package if present
    work_dir = args.data_dir
    is_temp = False
    try:
        extracted = extract_if_zip(args.data_dir)
        if extracted != args.data_dir:
            work_dir = extracted
            is_temp = True
    except Exception as e:
        logger.error(f"Extraction failed: {e}")
        sys.exit(1)
        
    csv_files = find_csv_files(work_dir)
    if not csv_files:
        logger.error(f"No compatible CSV datasets found inside: {work_dir}")
        sys.exit(1)
        
    logger.info(f"Discovered {len(csv_files)} datasets. Establishing Postgres connection...")
    
    conn = None
    try:
        conn = psycopg.connect(args.database_url)
        record_job(conn, job_id, "running", args.data_dir, started_at)
        
        # 3. Truncate tables if --reset
        if args.reset:
            truncate_tables(conn, TABLES_ORDER)
            
        # 4. Ingest each CSV matching table DDL
        for table in TABLES_ORDER:
            if table in csv_files:
                csv_path = csv_files[table]
                logger.info(f"Ingesting {table} from {os.path.basename(csv_path)}...")
                count = ingest_csv_to_table(conn, table, csv_path)
                row_counts[table] = count
                logger.info(f"Ingested {count} rows into {table}.")
            else:
                logger.warning(f"No CSV file located for table: {table}")
                row_counts[table] = 0
                
        # Commit Ingestion Job completion
        completed_at = datetime.now()
        record_job(conn, job_id, "completed", args.data_dir, started_at, completed_at, row_counts)
        conn.commit()
        
        # 5. Print Final Summary
        print("\n=======================================================")
        print("                INGESTION PIPELINE SUMMARY             ")
        print("=======================================================")
        for table, cnt in row_counts.items():
            status = "SUCCESS" if cnt > 0 or table in csv_files else "SKIPPED"
            print(f"{table:<30} | Rows: {cnt:<10} | Status: {status}")
        print("=======================================================")
        logger.info("Ingestion pipeline execution completed successfully.")
        
    except Exception as e:
        logger.error(f"Ingestion pipeline failed: {e}")
        if conn:
            try:
                completed_at = datetime.now()
                record_job(conn, job_id, "failed", args.data_dir, started_at, completed_at, error_message=str(e))
                conn.commit()
            except Exception as inner_e:
                logger.error(f"Failed to write error state to database: {inner_e}")
        sys.exit(1)
    finally:
        if conn:
            conn.close()
        if is_temp:
            # Cleanup temp directory
            import shutil
            shutil.rmtree(work_dir, ignore_errors=True)

if __name__ == "__main__":
    main()

"""Background generation and ingestion orchestration for FastAPI routes."""

from __future__ import annotations

import json
import os
import subprocess
import sys
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from app.db import fetch_all, fetch_one, get_database_url, get_db_connection, is_db_configured
from app.services.agent_log_service import (
    create_generation_logs,
    create_ingestion_failure_log,
    create_ingestion_logs,
)

DEFAULT_TABLES_ORDER = [
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


def find_project_root() -> Path:
    env_root = os.getenv("PROJECT_ROOT")
    if env_root:
        return Path(env_root).expanduser().resolve()

    current = Path(__file__).resolve()
    for parent in [current.parent, *current.parents]:
        if (parent / "scripts").exists() or (parent / "db").exists():
            return parent

    for parent in [current.parent, *current.parents]:
        if (parent / "app").exists() and (parent / "requirements.txt").exists():
            return parent

    return Path.cwd().resolve()


ROOT = find_project_root()
DATA_DIR = ROOT / "data"
GENERATOR_SCRIPT = ROOT / "scripts" / "generate_wastenot_synthetic_data.py"
INGEST_SCRIPT = ROOT / "scripts" / "ingest_wastenot_data.py"

try:
    sys.path.insert(0, str(ROOT))
    from scripts.ingest_wastenot_data import TABLES_ORDER
except Exception:  # pragma: no cover - service still works for generation fallback.
    TABLES_ORDER = DEFAULT_TABLES_ORDER

_jobs: Dict[str, Dict[str, Any]] = {}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def generated_dir_for(preset: str) -> Path:
    return DATA_DIR / f"generated_{preset or 'default'}"


def resolve_data_dir(path: str) -> Path:
    candidate = Path(path).expanduser()
    return candidate if candidate.is_absolute() else (ROOT / candidate).resolve()


def set_job(job_id: str, **values: Any) -> Dict[str, Any]:
    job = _jobs.setdefault(
        job_id,
        {
            "job_id": job_id,
            "id": job_id,
            "status": "queued",
            "started_at": utc_now(),
            "completed_at": None,
            "data_dir": None,
            "row_counts": {},
            "error_message": None,
        },
    )
    job.update(values)
    return job


def manifest_row_counts(manifest: dict[str, Any]) -> dict[str, int]:
    if isinstance(manifest.get("row_counts"), dict):
        return {
            str(key).replace(".csv", ""): int(value)
            for key, value in manifest["row_counts"].items()
        }
    if isinstance(manifest.get("files"), list):
        return {
            str(item.get("name", "")).replace(".csv", ""): int(item.get("rows", 0))
            for item in manifest["files"]
            if item.get("name")
        }
    return {}


def read_manifest(data_dir: Path) -> Optional[dict[str, Any]]:
    manifest_path = data_dir / "manifest.json"
    if not manifest_path.exists():
        return None
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["row_counts"] = manifest_row_counts(manifest)
    return manifest


def create_db_job(job_id: str, status: str, data_dir: Path) -> None:
    if not is_db_configured():
        return
    try:
        with get_db_connection() as conn:
            conn.execute(
                """
                INSERT INTO ingestion_jobs (job_id, status, started_at, data_dir, row_counts)
                VALUES (%s, %s, now(), %s, '{}'::jsonb)
                ON CONFLICT (job_id) DO UPDATE SET
                    status = EXCLUDED.status,
                    data_dir = EXCLUDED.data_dir
                """,
                (job_id, status, str(data_dir)),
            )
    except Exception:
        return


def update_db_job(
    job_id: str,
    status: str,
    row_counts: Optional[dict[str, int]] = None,
    error_message: Optional[str] = None,
) -> None:
    if not is_db_configured():
        return
    try:
        with get_db_connection() as conn:
            conn.execute(
                """
                UPDATE ingestion_jobs
                SET status = %s,
                    completed_at = CASE WHEN %s IN ('completed', 'failed') THEN now() ELSE completed_at END,
                    row_counts = %s::jsonb,
                    error_message = %s
                WHERE job_id = %s
                """,
                (status, status, json.dumps(row_counts or {}), error_message, job_id),
            )
    except Exception:
        return


def get_job_status(job_id: str) -> Optional[Dict[str, Any]]:
    if job_id in _jobs:
        return _jobs[job_id]

    if is_db_configured():
        try:
            row = fetch_one(
                """
                SELECT job_id, status, started_at, completed_at, data_dir, row_counts, error_message
                FROM ingestion_jobs
                WHERE job_id = %s
                """,
                (job_id,),
            )
            if row:
                return dict(row)
        except Exception:
            return None
    return None


def run_generation(job_id: str, data_dir: Path, clients: int, customers: int, days: int, seed: int) -> None:
    set_job(job_id, status="running", data_dir=str(data_dir), message="Generating synthetic CSV data.")
    create_db_job(job_id, "running", data_dir)
    try:
        if not GENERATOR_SCRIPT.exists():
            raise FileNotFoundError(
                "Synthetic data generator is not available in this backend runtime. "
                "Generate demo data locally or include the scripts directory in the deployment image."
            )
        data_dir.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            [
                sys.executable,
                str(GENERATOR_SCRIPT),
                "--output-dir",
                str(data_dir),
                "--clients",
                str(clients),
                "--customers-per-client",
                str(customers),
                "--days",
                str(days),
                "--seed",
                str(seed),
            ],
            cwd=str(ROOT),
            check=True,
            capture_output=True,
            text=True,
        )
        manifest = read_manifest(data_dir) or {}
        row_counts = manifest_row_counts(manifest)
        set_job(
            job_id,
            status="completed",
            completed_at=utc_now(),
            row_counts=row_counts,
            message="Synthetic data generation completed.",
        )
        update_db_job(job_id, "completed", row_counts)
        create_generation_logs(job_id)
    except Exception as exc:
        set_job(job_id, status="failed", completed_at=utc_now(), error_message=str(exc))
        update_db_job(job_id, "failed", error_message=str(exc))


def run_ingestion(job_id: str, data_dir: Path, reset: bool) -> None:
    set_job(job_id, status="running", data_dir=str(data_dir), message="Loading CSV data into Postgres.")
    create_db_job(job_id, "running", data_dir)
    try:
        if not INGEST_SCRIPT.exists():
            raise FileNotFoundError(
                "CSV ingestion script is not available in this backend runtime. "
                "Run ingestion locally or include the scripts directory in the deployment image."
            )
        command = [
            sys.executable,
            str(INGEST_SCRIPT),
            "--data-dir",
            str(data_dir),
        ]
        if get_database_url():
            command.extend(["--database-url", get_database_url()])
        if reset:
            command.append("--reset")

        subprocess.run(command, cwd=str(ROOT), check=True, capture_output=True, text=True)
        row_counts = table_row_counts() if is_db_configured() else {}
        set_job(
            job_id,
            status="completed",
            completed_at=utc_now(),
            row_counts=row_counts,
            message="CSV ingestion completed.",
        )
        update_db_job(job_id, "completed", row_counts)
        create_ingestion_logs(row_counts, job_id)
    except Exception as exc:
        stderr = getattr(exc, "stderr", "")
        error = f"{exc}\n{stderr}".strip()
        set_job(job_id, status="failed", completed_at=utc_now(), error_message=error)
        update_db_job(job_id, "failed", error_message=error)
        create_ingestion_failure_log(
            "Data Scout could not load CSV data because the database is unavailable or the ingestion script failed.",
            job_id,
        )


def trigger_generate_job(
    preset: str = "default",
    clients: int = 60,
    customers: int = 800,
    days: int = 90,
    seed: int = 42,
) -> str:
    job_id = f"gen_{uuid.uuid4().hex[:10]}"
    data_dir = generated_dir_for(preset)
    set_job(job_id, status="queued", data_dir=str(data_dir), row_counts={})
    threading.Thread(
        target=run_generation,
        args=(job_id, data_dir, clients, customers, days, seed),
        daemon=True,
    ).start()
    return job_id


def trigger_ingest_job(data_dir: str, reset: bool = True) -> str:
    job_id = f"ing_{uuid.uuid4().hex[:10]}"
    resolved = resolve_data_dir(data_dir)
    set_job(job_id, status="queued", data_dir=str(resolved), row_counts={})
    threading.Thread(target=run_ingestion, args=(job_id, resolved, reset), daemon=True).start()
    return job_id


def table_row_counts() -> dict[str, int]:
    counts: dict[str, int] = {}
    with get_db_connection() as conn:
        for table in TABLES_ORDER:
            value = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
            counts[table] = int(value)
    return counts


def latest_ingestion_job_counts() -> Optional[dict[str, Any]]:
    if not is_db_configured():
        return None
    try:
        row = fetch_one(
            """
            SELECT job_id, status, started_at, completed_at, data_dir, row_counts, error_message
            FROM ingestion_jobs
            ORDER BY started_at DESC
            LIMIT 1
            """
        )
        return dict(row) if row else None
    except Exception:
        return None


def get_latest_manifest(preset_dir_name: str = "generated_default") -> Optional[Dict[str, Any]]:
    candidates = [
        DATA_DIR / preset_dir_name,
        DATA_DIR / "generated_default",
        DATA_DIR / "wastenot_synthetic_sample_data",
    ]
    for candidate in candidates:
        manifest = read_manifest(candidate)
        if manifest:
            return manifest

    latest = latest_ingestion_job_counts()
    if latest:
        return latest
    return None

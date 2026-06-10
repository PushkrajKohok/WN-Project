"""Health and readiness checks for local and hosted deployments."""

from __future__ import annotations

from fastapi import APIRouter

from app.core.config import get_settings
from app.db import fetch_one, is_db_available, is_db_configured

router = APIRouter(prefix="/health", tags=["health"])

KEY_TABLES = [
    "clients",
    "recommendation_records",
    "rag_documents",
    "cross_client_benchmarks",
]


@router.get("")
def health():
    settings = get_settings()
    return {
        "status": "ok",
        "service": settings.service_name,
        "environment": settings.environment,
        "version": settings.version,
    }


@router.get("/db")
def database_health():
    if is_db_available():
        return {"status": "ok", "database": "connected"}
    return {
        "status": "degraded",
        "database": "unavailable",
        "message": "Database connection failed. Mock fallback may be used by frontend.",
    }


@router.get("/readiness")
def readiness():
    settings = get_settings()
    checks = {
        "app_running": True,
        "environment_loaded": bool(settings.environment and settings.log_level),
        "database_configured": is_db_configured(),
        "database_reachable": is_db_available(),
        "schema_tables": [],
    }

    if checks["database_reachable"]:
        checks["schema_tables"] = _schema_table_checks()

    schema_ready = bool(checks["schema_tables"]) and all(
        table["exists"] for table in checks["schema_tables"]
    )
    ready = bool(
        checks["app_running"]
        and checks["environment_loaded"]
        and (not checks["database_configured"] or checks["database_reachable"])
        and (not checks["database_reachable"] or schema_ready)
    )

    return {
        "status": "ok" if ready else "degraded",
        "service": settings.service_name,
        "environment": settings.environment,
        "checks": checks,
    }


def _schema_table_checks() -> list[dict]:
    tables: list[dict] = []
    for table_name in KEY_TABLES:
        try:
            row = fetch_one(
                """
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = %s
                ) AS exists
                """,
                (table_name,),
            )
            tables.append({"table": table_name, "exists": bool(row and row["exists"])})
        except Exception as exc:
            tables.append({"table": table_name, "exists": False, "message": str(exc)})
    return tables

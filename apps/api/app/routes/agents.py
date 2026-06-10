"""Agent status, public logs, scan runs, and deterministic run-scan routes."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.services import agent_service

router = APIRouter()


class RunScanRequest(BaseModel):
    client_id: Optional[str] = None
    platform: str = "All"
    scan_depth: str = "standard"


@router.get("/agents/status")
def get_agents_status():
    return agent_service.list_statuses()


@router.get("/agents/logs")
def list_agent_logs(
    agent_name: Optional[str] = None,
    severity: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
):
    return agent_service.list_logs(
        agent_name=agent_name,
        severity=severity,
        search=search,
        limit=limit,
        offset=offset,
    )


@router.get("/agents/runs")
def list_agent_runs(limit: int = 20):
    return agent_service.list_runs(limit=limit)


@router.get("/agents/runs/{run_id}")
def get_agent_run(run_id: str):
    return agent_service.get_run_detail(run_id)


@router.post("/agents/run-scan")
def run_agent_scan(req: RunScanRequest):
    return agent_service.run_scan(req.model_dump())


@router.get("/agents/current-investigation")
def get_current_investigation():
    return agent_service.current_investigation()

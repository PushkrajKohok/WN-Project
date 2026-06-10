"""Optimization action log, audit events, and simulated rollback routes."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.services import action_service

router = APIRouter()


class SimulateExecutionRequest(BaseModel):
    executed_by: str = "human_ops"
    note: str = "Simulated execution for demo."


class SimulateRollbackRequest(BaseModel):
    rolled_back_by: str = "human_ops"
    reason: str = "Performance guardrail breached."


@router.get("/actions/summary")
def action_summary():
    return action_service.get_summary()


@router.get("/actions/facets")
def action_facets():
    return action_service.get_facets()


@router.get("/actions/audit-events")
def action_audit_events(
    action_id: Optional[str] = None,
    recommendation_id: Optional[str] = None,
    client_id: Optional[str] = None,
    limit: int = 100,
):
    return action_service.get_audit_events(locals())


@router.get("/actions/{optimization_id}/rollback-plan")
def action_rollback_plan(optimization_id: str):
    return action_service.rollback_plan(optimization_id)


@router.get("/actions/{optimization_id}")
def action_detail(optimization_id: str):
    return action_service.get_action_detail(optimization_id)


@router.post("/actions/{optimization_id}/simulate-execution")
def simulate_execution(optimization_id: str, payload: SimulateExecutionRequest):
    return action_service.simulate_execution(optimization_id, payload.model_dump())


@router.post("/actions/{optimization_id}/simulate-rollback")
def simulate_rollback(optimization_id: str, payload: SimulateRollbackRequest):
    return action_service.simulate_rollback(optimization_id, payload.model_dump())


@router.get("/actions")
def actions(
    client_id: Optional[str] = None,
    platform: Optional[str] = None,
    risk_level: Optional[str] = None,
    status: Optional[str] = None,
    agent_name: Optional[str] = None,
    rollback_flag: Optional[bool] = None,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    sort_dir: str = "desc",
    limit: int = 50,
    offset: int = 0,
):
    return action_service.list_actions(locals())

"""Guardrail settings routes."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.services import guardrail_service

router = APIRouter()


class GuardrailUpdate(BaseModel):
    confidence_threshold: Optional[float] = None
    auto_execute_confidence_threshold: Optional[float] = None
    max_auto_execute_weekly_savings: Optional[float] = None
    high_risk_requires_approval: Optional[bool] = None
    medium_risk_requires_approval: Optional[bool] = None
    budget_changes_require_approval: Optional[bool] = None
    campaign_pause_requires_approval: Optional[bool] = None
    rollback_required_for_execution: Optional[bool] = None
    fresh_data_required: Optional[bool] = None
    max_data_staleness_hours: Optional[int] = None
    auto_execute_low_risk_audience_refresh: Optional[bool] = None
    auto_execute_tracking_fix: Optional[bool] = None
    auto_execute_budget_shift: Optional[bool] = None
    auto_execute_campaign_pause: Optional[bool] = None
    cross_client_privacy_mode: Optional[str] = None
    require_benchmark_support: Optional[bool] = None
    min_benchmark_sample_size: Optional[int] = None
    min_benchmark_confidence: Optional[float] = None


@router.get("/guardrails")
def get_guardrails():
    return guardrail_service.get_guardrails()


@router.patch("/guardrails")
def update_guardrails(payload: GuardrailUpdate):
    return guardrail_service.update_guardrails(payload.model_dump(exclude_unset=True))


@router.get("/guardrails/impact-preview")
def impact_preview():
    return guardrail_service.get_guardrail_impact_preview()


@router.get("/guardrails/audit-log")
def audit_log(limit: int = 50):
    return guardrail_service.get_guardrail_audit_log(limit=limit)


@router.post("/guardrails/reset-defaults")
def reset_defaults():
    return guardrail_service.reset_guardrails()

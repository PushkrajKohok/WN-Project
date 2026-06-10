"""Dashboard endpoints for the Intelligence Command Center."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter

from app.services import dashboard_service

router = APIRouter()


@router.get("/dashboard/summary")
def dashboard_summary(
    client_id: Optional[str] = None,
    days: int = 30,
    platform: Optional[str] = None,
):
    return dashboard_service.get_summary(client_id=client_id, days=days, platform=platform)


@router.get("/dashboard/performance-trend")
def dashboard_performance_trend(
    client_id: Optional[str] = None,
    days: int = 30,
    platform: Optional[str] = None,
):
    return dashboard_service.get_performance_trend(client_id=client_id, days=days, platform=platform)


@router.get("/dashboard/risk-distribution")
def dashboard_risk_distribution(
    client_id: Optional[str] = None,
    platform: Optional[str] = None,
):
    return dashboard_service.get_risk_distribution(client_id=client_id, platform=platform)


@router.get("/dashboard/priority-recommendations")
def dashboard_priority_recommendations(
    limit: int = 5,
    client_id: Optional[str] = None,
    platform: Optional[str] = None,
):
    return dashboard_service.get_priority_recommendations(
        limit=limit,
        client_id=client_id,
        platform=platform,
    )


@router.get("/dashboard/agent-activity")
def dashboard_agent_activity(limit: int = 8):
    return dashboard_service.get_agent_activity(limit=limit)


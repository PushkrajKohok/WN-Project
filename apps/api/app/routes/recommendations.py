"""Recommendation queue and decision workflow routes."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.services import recommendation_service

router = APIRouter()


class ApprovalRequest(BaseModel):
    approved_by: str = "human_ops"
    note: Optional[str] = None


class RejectRequest(BaseModel):
    rejected_by: str = "human_ops"
    reason: str = "Evidence was not strong enough."


class MoreEvidenceRequest(BaseModel):
    requested_by: str = "human_ops"
    note: Optional[str] = None


@router.get("/recommendations")
def list_recommendations(
    client_id: Optional[str] = None,
    platform: Optional[str] = None,
    risk_level: Optional[str] = None,
    status: Optional[str] = None,
    decision_required: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "detected_at",
    sort_dir: str = "desc",
    limit: int = 50,
    offset: int = 0,
):
    return recommendation_service.list_recommendations(
        {
            "client_id": client_id,
            "platform": platform,
            "risk_level": risk_level,
            "status": status,
            "decision_required": decision_required,
            "search": search,
            "sort_by": sort_by,
            "sort_dir": sort_dir,
            "limit": limit,
            "offset": offset,
        }
    )


@router.get("/recommendations/facets")
def recommendation_facets():
    return recommendation_service.get_recommendation_facets()


@router.get("/recommendations/summary")
def recommendation_summary():
    return recommendation_service.get_recommendation_summary()


@router.get("/recommendations/{recommendation_id}")
def get_recommendation(recommendation_id: str):
    return recommendation_service.get_recommendation_detail(recommendation_id)


@router.get("/recommendations/{recommendation_id}/evidence")
def get_recommendation_evidence(recommendation_id: str):
    return recommendation_service.get_recommendation_evidence(recommendation_id)


@router.get("/recommendations/{recommendation_id}/agent-trace")
def get_recommendation_agent_trace(recommendation_id: str):
    return recommendation_service.get_recommendation_agent_trace(recommendation_id)


@router.get("/recommendations/{recommendation_id}/risk-validation")
def get_recommendation_risk_validation(recommendation_id: str):
    return recommendation_service.get_recommendation_risk_validation(recommendation_id)


@router.get("/recommendations/{recommendation_id}/rollback-plan")
def get_recommendation_rollback_plan(recommendation_id: str):
    return recommendation_service.get_recommendation_rollback_plan(recommendation_id)


@router.post("/recommendations/{recommendation_id}/approve")
def approve_recommendation(recommendation_id: str, req: ApprovalRequest):
    return recommendation_service.approve_recommendation(recommendation_id, req.approved_by, req.note)


@router.post("/recommendations/{recommendation_id}/reject")
def reject_recommendation(recommendation_id: str, req: RejectRequest):
    return recommendation_service.reject_recommendation(recommendation_id, req.rejected_by, req.reason)


@router.post("/recommendations/{recommendation_id}/needs-more-evidence")
def request_more_evidence(recommendation_id: str, req: MoreEvidenceRequest):
    return recommendation_service.mark_needs_more_evidence(recommendation_id, req.requested_by, req.note)

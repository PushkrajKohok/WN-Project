"""Recursive learning loop routes."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.services import learning_service

router = APIRouter()


class RunLearningCycleRequest(BaseModel):
    window_days: int = 30
    client_id: Optional[str] = None
    mode: str = "standard"


class PromoteRequest(BaseModel):
    strategy_key: str


@router.get("/learning/summary")
def learning_summary():
    return learning_service.summary()


@router.post("/learning/run-cycle")
def run_cycle(payload: RunLearningCycleRequest):
    return learning_service.run_cycle(payload.model_dump())


@router.get("/learning/events")
def events(client_id: Optional[str] = None, strategy: Optional[str] = None, outcome_type: Optional[str] = None, limit: int = 50, offset: int = 0):
    return learning_service.events(locals())


@router.get("/learning/outcomes")
def outcomes(client_id: Optional[str] = None, platform: Optional[str] = None, outcome_label: Optional[str] = None, limit: int = 50, offset: int = 0):
    return learning_service.outcomes(locals())


@router.get("/learning/strategy-scores")
def strategy_scores(brand_category: Optional[str] = None, spend_band: Optional[str] = None, platform: Optional[str] = None, sort_by: str = "learning_score", sort_dir: str = "desc", limit: int = 50):
    return learning_service.strategy_scores(locals())


@router.get("/learning/memory-updates")
def memory_updates():
    return learning_service.memory_updates()


@router.post("/learning/promote-to-benchmark")
def promote_to_benchmark(payload: PromoteRequest):
    return learning_service.promote_to_benchmark(payload.model_dump())

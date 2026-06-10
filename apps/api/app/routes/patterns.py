"""Cross-client benchmark and GraphRAG pattern routes."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter

from app.services import pattern_service

router = APIRouter()


@router.get("/patterns/summary")
def pattern_summary(
    brand_category: Optional[str] = None,
    spend_band: Optional[str] = None,
    strategy: Optional[str] = None,
    metric: Optional[str] = None,
):
    return pattern_service.get_summary(locals())


@router.get("/patterns/benchmarks")
def benchmarks(
    brand_category: Optional[str] = None,
    spend_band: Optional[str] = None,
    metric: Optional[str] = None,
    privacy_level: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "confidence_score",
    sort_dir: str = "desc",
    limit: int = 50,
    offset: int = 0,
):
    return pattern_service.list_benchmarks(locals())


@router.get("/patterns/facets")
def facets():
    return pattern_service.get_facets()


@router.get("/patterns/strategy-lift")
def strategy_lift(
    brand_category: Optional[str] = None,
    spend_band: Optional[str] = None,
    metric: Optional[str] = None,
    limit: int = 10,
):
    return pattern_service.strategy_lift(locals())


@router.get("/patterns/graph")
def graph(
    client_id: Optional[str] = None,
    relationship: Optional[str] = None,
    limit: int = 100,
):
    return pattern_service.graph(locals())


@router.get("/patterns/{benchmark_id}")
def benchmark_detail(benchmark_id: str):
    return pattern_service.benchmark_detail(benchmark_id)

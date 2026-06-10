"""Hybrid RAG retrieval and evidence scoring routes."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.services import rag_service

router = APIRouter()


class RagSearchRequest(BaseModel):
    query: str
    client_id: Optional[str] = None
    recommendation_id: Optional[str] = None
    top_k: int = 8
    include_sql: bool = True
    include_graph: bool = True
    include_rag_docs: bool = True


class EvidenceScoreRequest(BaseModel):
    recommendation_id: str


@router.post("/rag/search")
def search(payload: RagSearchRequest):
    return rag_service.search_rag(payload.model_dump())


@router.get("/rag/recommendation/{recommendation_id}")
def recommendation_context(recommendation_id: str):
    return rag_service.get_rag_for_recommendation(recommendation_id)


@router.post("/rag/score-evidence")
def score_evidence(payload: EvidenceScoreRequest):
    return rag_service.score_evidence_for_recommendation(payload.recommendation_id)


@router.get("/rag/documents")
def documents(
    client_id: Optional[str] = None,
    doc_type: Optional[str] = None,
    embedding_group: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
):
    return rag_service.list_documents(locals())


@router.get("/rag/facets")
def facets():
    return rag_service.get_facets()


@router.post("/rag/rebuild-index")
def rebuild_index():
    return rag_service.rebuild_index()

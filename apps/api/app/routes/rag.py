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


class VectorSearchRequest(BaseModel):
    query: str
    limit: int = 10
    client_id: Optional[str] = None
    embedding_group: Optional[str] = None


class HybridSearchRequest(BaseModel):
    query: str
    recommendation_id: Optional[str] = None
    client_id: Optional[str] = None
    campaign_id: Optional[str] = None
    limit: int = 10


@router.post("/rag/search")
def search(payload: RagSearchRequest):
    return rag_service.search_rag(payload.model_dump())


@router.post("/rag/vector-search")
def vector_search(payload: VectorSearchRequest):
    from app.services import embedding_service

    try:
        return {
            "mode": "vector_rag",
            "query": payload.query,
            "results": embedding_service.vector_search_rag_documents(
                payload.query,
                limit=payload.limit,
                filters={"client_id": payload.client_id, "embedding_group": payload.embedding_group},
            ),
        }
    except RuntimeError as exc:
        return {"mode": "fallback_keyword", "query": payload.query, "results": [], "error_message": str(exc)}


@router.post("/rag/hybrid-search")
def hybrid_search(payload: HybridSearchRequest):
    from app.services import rag_hybrid_service

    return rag_hybrid_service.hybrid_search(**payload.model_dump())


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

"""LLM capability status routes."""

from __future__ import annotations

from fastapi import APIRouter

from app.services.embedding_service import get_vector_rag_status

router = APIRouter()


@router.get("/llm/status")
def llm_status():
    return get_vector_rag_status()

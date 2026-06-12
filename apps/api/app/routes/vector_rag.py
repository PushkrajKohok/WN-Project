"""Admin-controlled vector RAG routes."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from app.core.config import get_settings
from app.services import embedding_service

router = APIRouter()


class RebuildEmbeddingsRequest(BaseModel):
    limit: int = 500
    force: bool = False


def require_admin_token(x_admin_token: Optional[str]) -> None:
    expected = get_settings().admin_api_token
    if expected and x_admin_token != expected:
        raise HTTPException(status_code=401, detail="Valid X-Admin-Token header required.")


@router.post("/admin/embeddings/rebuild")
def rebuild_embeddings(payload: RebuildEmbeddingsRequest, x_admin_token: Optional[str] = Header(default=None)):
    require_admin_token(x_admin_token)
    try:
        return embedding_service.rebuild_rag_embeddings(limit=payload.limit, force=payload.force)
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

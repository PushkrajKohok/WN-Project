"""pgvector-backed embeddings for rag_documents."""

from __future__ import annotations

import hashlib
import uuid
from datetime import datetime
from typing import Any, Optional

from app.core.config import get_settings
from app.db import fetch_all, fetch_one, get_db_connection, is_db_configured
from app.services import openai_service


def text_hash(text: str) -> str:
    return hashlib.sha256((text or "").encode("utf-8")).hexdigest()


def vector_literal(values: list[float]) -> str:
    return "[" + ",".join(f"{value:.8f}" for value in values) + "]"


def doc_text(row: dict[str, Any]) -> str:
    return " ".join(
        str(part)
        for part in [
            row.get("doc_type"),
            row.get("embedding_group"),
            row.get("source_table"),
            row.get("text"),
        ]
        if part
    )


def get_vector_rag_status() -> dict[str, Any]:
    settings = get_settings()
    status = {
        "llm_features_enabled": settings.llm_features_enabled,
        "vector_rag_enabled": settings.vector_rag_enabled,
        "openai_key_configured": openai_service.is_openai_key_configured(),
        "model": settings.openai_model,
        "embedding_model": settings.openai_embedding_model,
        "embedding_dimensions": settings.openai_embedding_dimensions,
        "openai_sdk_available": openai_service.OpenAI is not None,
        "database_configured": is_db_configured(),
        "embedded_docs_count": 0,
        "total_rag_docs_count": 0,
        "last_embedding_update": None,
        "mode": "llm_disabled",
    }
    if settings.vector_rag_enabled and status["openai_key_configured"] and status["database_configured"]:
        status["mode"] = "vector_rag_ready"
    elif status["database_configured"]:
        status["mode"] = "keyword_fallback"

    if not is_db_configured():
        return status
    try:
        total = fetch_one("SELECT COUNT(*) AS total FROM rag_documents") or {}
        embedded = fetch_one(
            """
            SELECT COUNT(*) AS total, MAX(updated_at) AS last_update
            FROM rag_document_embeddings
            WHERE embedding_model = %s
            """,
            (settings.openai_embedding_model,),
        ) or {}
        status["total_rag_docs_count"] = int(total.get("total") or 0)
        status["embedded_docs_count"] = int(embedded.get("total") or 0)
        last_update = embedded.get("last_update")
        status["last_embedding_update"] = last_update.isoformat() if hasattr(last_update, "isoformat") else last_update
    except Exception as exc:
        status["mode"] = "keyword_fallback"
        status["error_message"] = "Vector tables are not ready. Apply the pgvector migration."
        status["debug_reason"] = str(exc)[:160]
    return status


def select_docs_for_embedding(limit: int, force: bool) -> list[dict[str, Any]]:
    settings = get_settings()
    if force:
        return fetch_all(
            """
            SELECT doc_id, client_id, doc_type, source_table, source_record_id, chunk_id,
                   embedding_group, text, updated_at
            FROM rag_documents
            ORDER BY updated_at DESC NULLS LAST
            LIMIT %s
            """,
            (limit,),
        )
    rows = fetch_all(
        """
        SELECT d.doc_id, d.client_id, d.doc_type, d.source_table, d.source_record_id,
               d.chunk_id, d.embedding_group, d.text, d.updated_at,
               e.text_hash AS existing_text_hash
        FROM rag_documents d
        LEFT JOIN rag_document_embeddings e
          ON e.doc_id = d.doc_id
         AND e.embedding_model = %s
         AND e.embedding_dimensions = %s
        ORDER BY d.updated_at DESC NULLS LAST
        LIMIT %s
        """,
        (settings.openai_embedding_model, settings.openai_embedding_dimensions, limit * 2),
    )
    missing = []
    for row in rows:
        if row.get("existing_text_hash") != text_hash(doc_text(row)):
            missing.append(row)
        if len(missing) >= limit:
            break
    return missing


def rebuild_rag_embeddings(limit: int = 500, force: bool = False) -> dict[str, Any]:
    settings = get_settings()
    limit = max(1, min(int(limit or 500), 500))
    if not is_db_configured():
        raise RuntimeError("DATABASE_URL is not configured.")
    if not openai_service.is_vector_available():
        raise RuntimeError("Vector RAG is disabled or OPENAI_API_KEY is not configured.")

    docs = select_docs_for_embedding(limit, force)
    if not docs:
        return {"status": "completed", "embedded": 0, "skipped": 0, "limit": limit, "force": force}

    embedded = 0
    batch_size = 25
    for start in range(0, len(docs), batch_size):
        batch = docs[start : start + batch_size]
        texts = [doc_text(row) for row in batch]
        vectors = openai_service.get_embeddings_batch(texts)
        with get_db_connection() as conn:
            for row, vector in zip(batch, vectors):
                content = doc_text(row)
                conn.execute(
                    """
                    INSERT INTO rag_document_embeddings (
                        embedding_id, doc_id, embedding_model, embedding_dimensions,
                        text_hash, embedding, token_estimate, created_at, updated_at
                    )
                    VALUES (%s, %s, %s, %s, %s, %s::vector, %s, now(), now())
                    ON CONFLICT (embedding_id) DO UPDATE SET
                        text_hash = EXCLUDED.text_hash,
                        embedding = EXCLUDED.embedding,
                        token_estimate = EXCLUDED.token_estimate,
                        updated_at = now()
                    """,
                    (
                        f"emb_{uuid.uuid5(uuid.NAMESPACE_URL, row['doc_id'] + settings.openai_embedding_model).hex}",
                        row["doc_id"],
                        settings.openai_embedding_model,
                        settings.openai_embedding_dimensions,
                        text_hash(content),
                        vector_literal(vector),
                        openai_service.estimate_tokens_safe(content, settings.openai_embedding_model),
                    ),
                )
                embedded += 1
    return {"status": "completed", "embedded": embedded, "skipped": max(0, limit - embedded), "limit": limit, "force": force}


def embed_missing_rag_documents(limit: int = 500) -> dict[str, Any]:
    return rebuild_rag_embeddings(limit=limit, force=False)


def vector_search_rag_documents(
    query: str,
    limit: int = 10,
    filters: Optional[dict[str, Any]] = None,
) -> list[dict[str, Any]]:
    settings = get_settings()
    if not is_db_configured():
        raise RuntimeError("DATABASE_URL is not configured.")
    if not openai_service.is_vector_available():
        raise RuntimeError("Vector RAG is disabled or OPENAI_API_KEY is not configured.")
    query_vector = openai_service.get_embeddings_batch([query])[0]
    clauses = ["e.embedding_model = %s", "e.embedding_dimensions = %s"]
    params: list[Any] = [settings.openai_embedding_model, settings.openai_embedding_dimensions]
    filters = filters or {}
    if filters.get("client_id"):
        clauses.append("d.client_id = %s")
        params.append(filters["client_id"])
    if filters.get("embedding_group"):
        clauses.append("d.embedding_group = %s")
        params.append(filters["embedding_group"])
    where = " AND ".join(clauses)
    rows = fetch_all(
        f"""
        SELECT d.doc_id, d.client_id, d.doc_type, d.source_table, d.source_record_id,
               d.chunk_id, d.embedding_group, d.text, d.updated_at,
               (e.embedding <=> %s::vector) AS distance
        FROM rag_document_embeddings e
        INNER JOIN rag_documents d ON d.doc_id = e.doc_id
        WHERE {where}
        ORDER BY e.embedding <=> %s::vector
        LIMIT %s
        """,
        tuple([vector_literal(query_vector), *params, vector_literal(query_vector), max(1, min(int(limit or 10), 25))]),
    )
    results = []
    for row in rows:
        distance = float(row.get("distance") or 0)
        text = row.get("text") or ""
        updated_at = row.get("updated_at")
        results.append(
            {
                "doc_id": row.get("doc_id"),
                "client_id": row.get("client_id"),
                "doc_type": row.get("doc_type"),
                "source_table": row.get("source_table"),
                "source_record_id": row.get("source_record_id"),
                "chunk_id": row.get("chunk_id"),
                "embedding_group": row.get("embedding_group"),
                "text": text,
                "snippet": text[:280],
                "updated_at": updated_at.isoformat() if hasattr(updated_at, "isoformat") else updated_at,
                "distance": round(distance, 5),
                "similarity_score": round(max(0.0, 1.0 - distance), 5),
                "relevance_score": round(max(0.0, 1.0 - distance), 5),
            }
        )
    return results

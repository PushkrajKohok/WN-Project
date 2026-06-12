"""Safe OpenAI integration helpers for public summaries and embeddings."""

from __future__ import annotations

import json
import logging
import uuid
from typing import Any, Optional

from app.core.config import get_settings
from app.db import get_db_connection, is_db_configured

try:
    from openai import OpenAI
except ImportError:  # pragma: no cover - dependency may be absent until deployed.
    OpenAI = None

try:
    import tiktoken
except ImportError:  # pragma: no cover - optional cost helper.
    tiktoken = None

logger = logging.getLogger("wastenot.openai")


def is_openai_key_configured() -> bool:
    return bool(get_settings().openai_api_key)


def is_llm_available() -> bool:
    settings = get_settings()
    return bool(settings.llm_features_enabled and settings.openai_api_key and OpenAI is not None)


def is_vector_available() -> bool:
    settings = get_settings()
    return bool(settings.vector_rag_enabled and settings.openai_api_key and OpenAI is not None)


def get_client() -> OpenAI:
    settings = get_settings()
    if OpenAI is None:
        raise RuntimeError("OpenAI SDK is not installed. Add openai to requirements and redeploy.")
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured.")
    return OpenAI(api_key=settings.openai_api_key, timeout=settings.llm_timeout_seconds)


def estimate_tokens_safe(text: str, model: Optional[str] = None) -> int:
    if not text:
        return 0
    if tiktoken is None:
        return max(1, len(text) // 4)
    try:
        encoding = tiktoken.encoding_for_model(model or get_settings().openai_model)
    except Exception:
        encoding = tiktoken.get_encoding("cl100k_base")
    return len(encoding.encode(text))


def log_llm_invocation(
    feature_name: str,
    *,
    model: Optional[str] = None,
    embedding_model: Optional[str] = None,
    prompt_tokens: Optional[int] = None,
    completion_tokens: Optional[int] = None,
    total_tokens: Optional[int] = None,
    status: str = "completed",
    error_message: Optional[str] = None,
) -> None:
    if not is_db_configured():
        return
    try:
        with get_db_connection() as conn:
            conn.execute(
                """
                INSERT INTO llm_invocation_logs (
                    invocation_id, feature_name, model, embedding_model,
                    prompt_tokens, completion_tokens, total_tokens, status, error_message
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    f"llm_{uuid.uuid4().hex}",
                    feature_name,
                    model,
                    embedding_model,
                    prompt_tokens,
                    completion_tokens,
                    total_tokens,
                    status,
                    (error_message or "")[:500] or None,
                ),
            )
    except Exception as exc:
        logger.info("LLM invocation logging skipped: %s", exc)


def get_embeddings_batch(texts: list[str]) -> list[list[float]]:
    settings = get_settings()
    if not is_vector_available():
        raise RuntimeError("Vector RAG is disabled or OPENAI_API_KEY is not configured.")
    if not texts:
        return []

    client = get_client()
    try:
        response = client.embeddings.create(
            model=settings.openai_embedding_model,
            input=texts,
            dimensions=settings.openai_embedding_dimensions,
        )
    except TypeError:
        response = client.embeddings.create(model=settings.openai_embedding_model, input=texts)
    token_estimate = sum(estimate_tokens_safe(text, settings.openai_embedding_model) for text in texts)
    log_llm_invocation(
        "rag_embeddings",
        embedding_model=settings.openai_embedding_model,
        prompt_tokens=token_estimate,
        total_tokens=token_estimate,
    )
    return [item.embedding for item in response.data]


def get_chat_completion_json_or_text(
    feature_name: str,
    *,
    system_prompt: str,
    user_payload: dict[str, Any],
    response_json: bool = True,
) -> dict[str, Any]:
    settings = get_settings()
    if not is_llm_available():
        raise RuntimeError("LLM features are disabled or OPENAI_API_KEY is not configured.")

    client = get_client()
    user_text = json.dumps(user_payload, default=str)[:18000]
    prompt_tokens = estimate_tokens_safe(system_prompt + user_text, settings.openai_model)
    try:
        kwargs: dict[str, Any] = {
            "model": settings.openai_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_text},
            ],
            "temperature": settings.llm_temperature,
            "max_tokens": settings.llm_max_output_tokens,
        }
        if response_json:
            kwargs["response_format"] = {"type": "json_object"}
        try:
            response = client.chat.completions.create(**kwargs)
        except TypeError:
            kwargs.pop("response_format", None)
            response = client.chat.completions.create(**kwargs)
        content = response.choices[0].message.content or "{}"
        usage = getattr(response, "usage", None)
        usage_prompt = getattr(usage, "prompt_tokens", None) if usage else prompt_tokens
        usage_completion = getattr(usage, "completion_tokens", None) if usage else None
        usage_total = getattr(usage, "total_tokens", None) if usage else None
        log_llm_invocation(
            feature_name,
            model=settings.openai_model,
            prompt_tokens=usage_prompt,
            completion_tokens=usage_completion,
            total_tokens=usage_total,
        )
        if response_json:
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                return {"summary": content, "parse_warning": "Model returned text instead of JSON."}
        return {"summary": content}
    except Exception as exc:
        log_llm_invocation(
            feature_name,
            model=settings.openai_model,
            prompt_tokens=prompt_tokens,
            status="failed",
            error_message=str(exc),
        )
        raise RuntimeError(
            "OpenAI request failed. Check that OPENAI_MODEL is available for this account and retry."
        ) from exc

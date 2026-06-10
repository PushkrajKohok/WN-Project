"""Database helpers with clean fallback behavior when Postgres is unavailable."""

from __future__ import annotations

import contextlib
import logging
import os
from typing import Iterator, Optional

from dotenv import load_dotenv

try:
    import psycopg
    from psycopg.rows import dict_row
except ImportError:  # pragma: no cover - dependency may be absent in mock-only mode.
    psycopg = None
    dict_row = None

load_dotenv()

logger = logging.getLogger("wastenot.db")


def get_database_url() -> Optional[str]:
    return os.getenv("DATABASE_URL")


def is_db_configured() -> bool:
    return bool(get_database_url() and psycopg is not None)


def is_db_available() -> bool:
    if not is_db_configured():
        return False
    try:
        with psycopg.connect(get_database_url(), connect_timeout=2):
            return True
    except Exception as exc:
        logger.warning("Database availability check failed: %s", exc)
        return False


@contextlib.contextmanager
def get_db_connection(row_factory=None) -> Iterator:
    """Yield a psycopg connection or raise a clear configuration error."""
    if psycopg is None:
        raise ConnectionError(
            "psycopg is not installed. Run `pip install -r apps/api/requirements.txt`."
        )
    if not get_database_url():
        raise ConnectionError("DATABASE_URL environment variable is not set.")

    conn = None
    try:
        conn = psycopg.connect(get_database_url(), row_factory=row_factory)
        yield conn
        conn.commit()
    except Exception:
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            conn.close()


def fetch_one(query: str, params: tuple = ()) -> Optional[dict]:
    with get_db_connection(row_factory=dict_row) as conn:
        return conn.execute(query, params).fetchone()


def fetch_all(query: str, params: tuple = ()) -> list[dict]:
    with get_db_connection(row_factory=dict_row) as conn:
        return list(conn.execute(query, params).fetchall())

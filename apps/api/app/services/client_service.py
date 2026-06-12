"""Client lookup helpers used by API filters."""

from __future__ import annotations

from typing import Any

from app.db import fetch_all, is_db_configured
from mock_data import CLIENTS


def mock_clients() -> list[dict[str, Any]]:
    return [
        {
            "client_id": client["id"],
            "brand_name": client["name"],
            "brand_category": client["vertical"],
            "monthly_ad_spend_band": "Demo",
            "source": "mock",
        }
        for client in CLIENTS
    ]


def get_clients() -> list[dict[str, Any]]:
    if not is_db_configured():
        return mock_clients()
    try:
        rows = fetch_all(
            """
            SELECT client_id, brand_name, brand_category, monthly_ad_spend_band
            FROM clients
            ORDER BY brand_name
            """
        )
        return [dict(row) for row in rows]
    except Exception:
        return mock_clients()

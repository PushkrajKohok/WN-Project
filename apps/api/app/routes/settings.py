"""Settings routes for ingestion cadence."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.db import fetch_one, get_db_connection, is_db_configured

router = APIRouter()

INGESTION_OPTIONS = [
    {"value": "realtime", "label": "Real-time", "minutes": 1},
    {"value": "15_min", "label": "15 Minutes", "minutes": 15},
    {"value": "1_hour", "label": "1 Hour", "minutes": 60},
    {"value": "6_hours", "label": "6 Hours", "minutes": 360},
    {"value": "daily", "label": "Daily", "minutes": 1440},
]

DEFAULT_REASON = (
    "Hourly is the best MVP default because it is frequent enough to detect ad performance issues quickly, "
    "but avoids excessive API calls, noisy minute-by-minute decisions, and unstable ad-platform signals."
)

_mock_ingestion_settings = {
    "frequency": "1_hour",
    "frequency_label": "1 Hour",
    "frequency_minutes": 60,
    "reason": DEFAULT_REASON,
    "options": INGESTION_OPTIONS,
}


class IngestionFrequencyPatch(BaseModel):
    frequency: Optional[str] = None
    frequency_label: Optional[str] = None
    frequency_minutes: Optional[int] = None
    reason: Optional[str] = None


def frequency_value(minutes: int) -> str:
    for option in INGESTION_OPTIONS:
        if option["minutes"] == minutes:
            return option["value"]
    return f"{minutes}_minutes"


def option_for_frequency(value: Optional[str]) -> Optional[dict]:
    if not value:
        return None
    return next((option for option in INGESTION_OPTIONS if option["value"] == value), None)


@router.get("/settings/ingestion-frequency")
def get_ingestion_frequency():
    if is_db_configured():
        try:
            row = fetch_one(
                """
                SELECT frequency_label, frequency_minutes, reason
                FROM ingestion_settings
                ORDER BY updated_at DESC
                LIMIT 1
                """
            )
            if row:
                minutes = int(row["frequency_minutes"])
                return {
                    "frequency": frequency_value(minutes),
                    "frequency_label": row["frequency_label"],
                    "frequency_minutes": minutes,
                    "reason": row["reason"],
                    "options": INGESTION_OPTIONS,
                }
        except Exception:
            pass
    return _mock_ingestion_settings


@router.patch("/settings/ingestion-frequency")
def update_ingestion_frequency(patch: IngestionFrequencyPatch):
    option = option_for_frequency(patch.frequency)
    label = patch.frequency_label or (option["label"] if option else _mock_ingestion_settings["frequency_label"])
    minutes = patch.frequency_minutes or (option["minutes"] if option else _mock_ingestion_settings["frequency_minutes"])
    reason = patch.reason or _mock_ingestion_settings["reason"]

    if is_db_configured():
        try:
            with get_db_connection() as conn:
                conn.execute(
                    """
                    INSERT INTO ingestion_settings (frequency_label, frequency_minutes, reason, updated_at)
                    VALUES (%s, %s, %s, now())
                    """,
                    (label, minutes, reason),
                )
            return {
                "frequency": frequency_value(minutes),
                "frequency_label": label,
                "frequency_minutes": minutes,
                "reason": reason,
                "options": INGESTION_OPTIONS,
            }
        except Exception:
            pass

    _mock_ingestion_settings.update(
        {
            "frequency": frequency_value(minutes),
            "frequency_label": label,
            "frequency_minutes": minutes,
            "reason": reason,
        }
    )
    return _mock_ingestion_settings


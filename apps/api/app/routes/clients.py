"""Client lookup routes used by dashboard filters."""

from __future__ import annotations

from fastapi import APIRouter

from app.services.dashboard_service import get_clients

router = APIRouter()


@router.get("/clients")
def list_clients():
    return {"clients": get_clients()}


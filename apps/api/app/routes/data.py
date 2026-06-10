"""Data generation, ingestion, and manifest routes."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services import ingestion_service
router = APIRouter()


class DataGenerateRequest(BaseModel):
    preset: Optional[str] = "default"
    clients: Optional[int] = 60
    customers_per_client: Optional[int] = 800
    days: Optional[int] = 90
    seed: Optional[int] = 42


class DataIngestRequest(BaseModel):
    data_dir: Optional[str] = "./data/generated_default"
    reset: Optional[bool] = True


@router.post("/data/generate")
def generate_data(req: DataGenerateRequest):
    job_id = ingestion_service.trigger_generate_job(
        preset=req.preset or "default",
        clients=req.clients or 60,
        customers=req.customers_per_client or 800,
        days=req.days or 90,
        seed=req.seed or 42,
    )
    return ingestion_service.get_job_status(job_id)


@router.post("/data/ingest")
def ingest_data(req: DataIngestRequest):
    job_id = ingestion_service.trigger_ingest_job(
        data_dir=req.data_dir or "./data/generated_default",
        reset=bool(req.reset),
    )
    return ingestion_service.get_job_status(job_id)


@router.get("/data/jobs/{job_id}")
def get_job_status(job_id: str):
    job = ingestion_service.get_job_status(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Ingestion job '{job_id}' not found.")
    return job


@router.get("/data/manifest")
def get_manifest(preset: Optional[str] = "default"):
    manifest = ingestion_service.get_latest_manifest(f"generated_{preset or 'default'}")
    if not manifest:
        raise HTTPException(status_code=404, detail="Manifest or database row counts could not be resolved.")
    return manifest

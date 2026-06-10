"use client";

import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import type { IngestionJob } from "@/types/data";

type Props = {
  job: IngestionJob | null;
};

export function IngestionJobStatus({ job }: Props) {
  if (!job) {
    return null;
  }

  const isRunning = job.status === "queued" || job.status === "running";
  const isFailed = job.status === "failed";

  return (
    <div
      className="text-xs rounded-lg border p-3"
      style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
    >
      <div className="font-semibold text-white flex items-center gap-2">
        {isRunning ? (
          <RefreshCw size={14} className="animate-spin" style={{ color: "var(--color-accent)" }} />
        ) : isFailed ? (
          <AlertCircle size={14} style={{ color: "var(--color-danger)" }} />
        ) : (
          <CheckCircle size={14} style={{ color: "var(--color-success)" }} />
        )}
        Latest job: {job.job_id}
      </div>
      <div className="mt-1">Status: {job.status}</div>
      {job.message ? <div>{job.message}</div> : null}
      {job.data_dir ? <div>Data dir: {job.data_dir}</div> : null}
      {job.error_message ? (
        <div style={{ color: "var(--color-danger)" }}>{job.error_message}</div>
      ) : null}
    </div>
  );
}


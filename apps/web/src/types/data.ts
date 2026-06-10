export type IngestionJobStatus = "queued" | "running" | "completed" | "failed";

export interface IngestionFrequencyOption {
  value: string;
  label: string;
  minutes?: number;
}

export interface IngestionFrequencySetting {
  frequency: string;
  frequency_label: string;
  frequency_minutes?: number;
  reason: string;
  options: IngestionFrequencyOption[];
}

export interface DataGenerationPreset {
  key: string;
  label: string;
  clients: number;
  customers_per_client: number;
  days: number;
  seed: number;
}

export interface DataGenerationRequest {
  preset: string;
  clients: number;
  customers_per_client: number;
  days: number;
  seed: number;
}

export interface IngestionRequest {
  data_dir: string;
  reset: boolean;
}

export interface IngestionJob {
  job_id: string;
  id?: string;
  status: IngestionJobStatus | string;
  started_at?: string;
  completed_at?: string | null;
  data_dir?: string | null;
  row_counts?: Record<string, number>;
  error_message?: string | null;
  message?: string;
}

export interface ManifestRowCount {
  table: string;
  label: string;
  rows: number;
  purpose: string;
}

export interface DataManifestResponse {
  data_dir?: string;
  status?: string;
  row_counts?: Record<string, number>;
  rows?: Record<string, number>;
  files?: Array<{ name: string; rows: number }>;
}

export type PipelineStepStatus = "pending" | "running" | "completed" | "ready" | "failed";

export interface PipelineStep {
  id: string;
  name: string;
  description: string;
  status: PipelineStepStatus;
}


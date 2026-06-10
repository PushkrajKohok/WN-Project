"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Settings,
  Database,
  Play,
  Upload,
  CheckCircle,
  FileSpreadsheet,
  Layers,
  HelpCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { apiGet, apiSend } from "@/lib/api";
import { mockDataPresets, mockIngestionSettings } from "@/lib/mock-data";
import { formatNumber } from "@/lib/utils";

const DATA_DIR_SAMPLE = "./data/wastenot_synthetic_sample_data";

const ingestionSteps = [
  { step: 1, name: "CSV generated/uploaded", desc: "Compile raw ad/eCommerce CSV package" },
  { step: 2, name: "Schema validation", desc: "Enforce strict types and reference integrity" },
  { step: 3, name: "Load to Postgres", desc: "Insert clean rows into the transactional database" },
  { step: 4, name: "Prepare RAG documents", desc: "Stage textual chunks for future vector embeddings" },
  { step: 5, name: "Build knowledge graph edges", desc: "Load cross-client relationships and benchmark links" },
  { step: 6, name: "Start agent scan", desc: "Trigger public agent activity summaries from ingested records" },
];

type JobStatus = {
  job_id: string;
  status: "queued" | "running" | "completed" | "failed" | string;
  started_at?: string;
  completed_at?: string | null;
  data_dir?: string;
  row_counts?: Record<string, number>;
  error_message?: string | null;
  message?: string;
};

type Manifest = {
  row_counts?: Record<string, number>;
  rows?: Record<string, number>;
  data_dir?: string;
  status?: string;
};

type IngestionSettings = typeof mockIngestionSettings & {
  frequency_minutes?: number;
};

const presetEntries = Object.entries({
  ...mockDataPresets,
  small: { ...mockDataPresets.small, seed: 7 },
});

const frequencyMinutes: Record<string, number> = {
  realtime: 1,
  real_time: 1,
  "15_min": 15,
  "1_hour": 60,
  "6_hours": 360,
  daily: 1440,
};

function rowCountsFrom(manifest: Manifest, job: JobStatus | null): Record<string, number> {
  return job?.row_counts || manifest.row_counts || manifest.rows || {};
}

function stepState(step: number, activeStep: number, isRunning: boolean) {
  const complete = step < activeStep || (!isRunning && activeStep === ingestionSteps.length);
  const current = step === activeStep && isRunning;
  return { complete, current };
}

export default function DataIngestionPage() {
  const [settings, setSettings] = useState<IngestionSettings>(mockIngestionSettings);
  const [ingestionFreq, setIngestionFreq] = useState("1_hour");
  const [selectedPreset, setSelectedPreset] = useState("default");

  const [clients, setClients] = useState(mockDataPresets.default.clients);
  const [customers, setCustomers] = useState(mockDataPresets.default.customers_per_client);
  const [days, setDays] = useState(mockDataPresets.default.days);
  const [seed, setSeed] = useState(mockDataPresets.default.seed);
  const [dataDir, setDataDir] = useState(DATA_DIR_SAMPLE);

  const [job, setJob] = useState<JobStatus | null>(null);
  const [manifest, setManifest] = useState<Manifest>({});
  const [isSavingFrequency, setIsSavingFrequency] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isGenerating = job?.status === "running" && job.job_id?.startsWith("gen_");
  const isIngesting = job?.status === "running" && job.job_id?.startsWith("ing_");
  const isQueued = job?.status === "queued";
  const rows = useMemo(() => rowCountsFrom(manifest, job), [manifest, job]);
  const totalRows = Object.values(rows).reduce((sum, value) => sum + Number(value || 0), 0);
  const activeStep = job?.status === "completed" ? ingestionSteps.length : isGenerating ? 1 : isIngesting || isQueued ? 3 : 0;

  useEffect(() => {
    apiGet<IngestionSettings>("/settings/ingestion-frequency", mockIngestionSettings).then((next) => {
      setSettings(next);
      const option = next.options.find((item) => item.label === next.frequency_label);
      setIngestionFreq(option?.value || next.frequency || "1_hour");
    });
    apiGet<Manifest>("/data/manifest", {}).then(setManifest);
  }, []);

  useEffect(() => {
    if (!job || !["queued", "running"].includes(job.status)) return;

    const timer = window.setInterval(async () => {
      const next = await apiGet<JobStatus>(`/data/jobs/${job.job_id}`, job);
      setJob(next);
      if (next.status === "completed" && next.data_dir) {
        setDataDir(next.data_dir);
        apiGet<Manifest>("/data/manifest", {}).then(setManifest);
      }
    }, 1200);

    return () => window.clearInterval(timer);
  }, [job]);

  const handlePresetChange = (presetName: string) => {
    setSelectedPreset(presetName);
    const preset = presetEntries.find(([key]) => key === presetName)?.[1];
    if (preset) {
      setClients(preset.clients);
      setCustomers(preset.customers_per_client);
      setDays(preset.days);
      setSeed(preset.seed);
    }
  };

  const saveFrequency = async () => {
    const option = settings.options.find((item) => item.value === ingestionFreq);
    if (!option) return;
    setIsSavingFrequency(true);
    setError(null);
    try {
      const next = await apiSend<IngestionSettings>("/settings/ingestion-frequency", "PATCH", {
        frequency: option.value,
        frequency_label: option.label,
        frequency_minutes: frequencyMinutes[option.value] || 60,
        reason: settings.reason,
      });
      setSettings(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save ingestion frequency.");
    } finally {
      setIsSavingFrequency(false);
    }
  };

  const handleGenerate = async () => {
    setError(null);
    try {
      const next = await apiSend<JobStatus>("/data/generate", "POST", {
        preset: selectedPreset,
        clients,
        customers_per_client: customers,
        days,
        seed,
      });
      setJob(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation request failed.");
    }
  };

  const handleIngest = async () => {
    setError(null);
    try {
      const next = await apiSend<JobStatus>("/data/ingest", "POST", {
        data_dir: dataDir,
        reset: true,
      });
      setJob(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ingestion request failed.");
    }
  };

  const handleRunScan = async () => {
    setIsScanning(true);
    setError(null);
    try {
      await apiSend("/agents/run-scan", "POST", {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Agent scan request failed.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold gradient-text">Data & Ingestion Control</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
          Generate synthetic data, load it into Postgres/Supabase, and monitor ingestion health.
        </p>
      </div>

      {error && (
        <div className="glass-card p-4 flex items-start gap-3" style={{ borderColor: "var(--color-danger)" }}>
          <AlertCircle size={18} className="shrink-0 mt-0.5" style={{ color: "var(--color-danger)" }} />
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{error}</p>
        </div>
      )}

      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Settings size={18} style={{ color: "var(--color-accent)" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Ingestion Frequency
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="flex flex-wrap gap-1.5 lg:col-span-1">
            {settings.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setIngestionFreq(opt.value)}
                className="px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all"
                style={{
                  background: ingestionFreq === opt.value ? "var(--color-accent)" : "var(--color-bg-tertiary)",
                  color: ingestionFreq === opt.value ? "white" : "var(--color-text-secondary)",
                  border: `1px solid ${ingestionFreq === opt.value ? "var(--color-accent)" : "var(--color-border)"}`,
                }}
              >
                {opt.label}
              </button>
            ))}
            <button
              onClick={saveFrequency}
              disabled={isSavingFrequency}
              className="btn btn-secondary btn-sm"
            >
              {isSavingFrequency ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle size={13} />}
              Save
            </button>
          </div>

          <div
            className="lg:col-span-2 flex items-start gap-3 p-3 rounded-lg text-xs leading-relaxed"
            style={{
              background: "var(--color-accent-subtle)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              color: "var(--color-text-secondary)",
            }}
          >
            <HelpCircle size={16} className="shrink-0 mt-0.5" style={{ color: "var(--color-accent)" }} />
            <div>
              <span className="font-semibold text-white">Why {settings.frequency_label}? </span>
              {settings.reason}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Database size={18} style={{ color: "var(--color-accent)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Synthetic Data Generator
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {presetEntries.map(([key, preset]) => (
              <button
                key={key}
                onClick={() => handlePresetChange(key)}
                className="px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-all"
                style={{
                  background: selectedPreset === key ? "var(--color-accent-subtle)" : "transparent",
                  color: selectedPreset === key ? "var(--color-accent)" : "var(--color-text-secondary)",
                  border: `1px solid ${selectedPreset === key ? "var(--color-accent)" : "var(--color-border)"}`,
                }}
              >
                {preset.label} Preset
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              ["Active Clients", clients, setClients],
              ["Customers per Client", customers, setCustomers],
              ["Days of History", days, setDays],
              ["Seed", seed, setSeed],
            ].map(([label, value, setter]) => (
              <div key={label as string}>
                <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1" style={{ color: "var(--color-text-muted)" }}>
                  {label as string}
                </label>
                <input
                  type="number"
                  value={value as number}
                  onChange={(event) => {
                    setSelectedPreset("custom");
                    (setter as (next: number) => void)(Number(event.target.value));
                  }}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-primary border"
                  style={{
                    background: "var(--color-bg-tertiary)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1" style={{ color: "var(--color-text-muted)" }}>
              Data Directory
            </label>
            <input
              type="text"
              value={dataDir}
              onChange={(event) => setDataDir(event.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm bg-primary border"
              style={{
                background: "var(--color-bg-tertiary)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-primary)",
              }}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || isIngesting || isQueued}
            className="w-full btn btn-primary flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw size={16} className="animate-spin" /> Generating Datasets...
              </>
            ) : (
              <>
                <Play size={16} /> Generate Synthetic Data
              </>
            )}
          </button>

          <div className="p-4 rounded-lg space-y-3 animate-fade-in border" style={{ background: "var(--color-bg-tertiary)", borderColor: "var(--color-border)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1">
                <CheckCircle size={14} className="text-success" /> Data Package
              </span>
              <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                Total rows: {formatNumber(totalRows)}
              </span>
            </div>

            <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
              {Object.entries(rows).slice(0, 10).map(([name, count]) => (
                <div key={name} className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-1.5" style={{ color: "var(--color-text-secondary)" }}>
                    <FileSpreadsheet size={13} style={{ color: "var(--color-text-muted)" }} />
                    {name.endsWith(".csv") ? name : `${name}.csv`}
                  </span>
                  <span className="font-semibold" style={{ color: "var(--color-text-muted)" }}>
                    {formatNumber(count)} rows
                  </span>
                </div>
              ))}
              {Object.keys(rows).length === 0 && (
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Row counts will appear after generation, ingestion, or sample manifest discovery.
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleIngest}
                disabled={isGenerating || isIngesting || isQueued}
                className="flex-1 btn btn-secondary text-xs flex items-center justify-center gap-1"
              >
                {isIngesting ? <RefreshCw size={12} className="animate-spin" /> : <Upload size={12} />}
                Upload/Load to Database
              </button>
              <button
                onClick={handleRunScan}
                disabled={isScanning}
                className="flex-1 btn btn-primary text-xs flex items-center justify-center gap-1"
              >
                {isScanning ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
                Run Ingestion Scan
              </button>
            </div>
          </div>

          {job && (
            <div className="text-xs rounded-lg border p-3" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
              <div className="font-semibold text-white">Latest job: {job.job_id}</div>
              <div>Status: {job.status}</div>
              {job.message && <div>{job.message}</div>}
              {job.error_message && <div style={{ color: "var(--color-danger)" }}>{job.error_message}</div>}
            </div>
          )}
        </div>

        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Layers size={18} style={{ color: "var(--color-accent)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Ingestion Pipeline Status
            </h2>
          </div>

          <div className="space-y-3">
            {ingestionSteps.map((step) => {
              const state = stepState(step.step, activeStep, Boolean(isGenerating || isIngesting || isQueued));
              const borderColor = state.complete
                ? "var(--color-success)"
                : state.current
                ? "var(--color-accent)"
                : "var(--color-border-subtle)";

              return (
                <div
                  key={step.step}
                  className="flex items-start gap-4 p-3 rounded-lg border transition-all"
                  style={{
                    background: state.current ? "var(--color-bg-tertiary)" : "transparent",
                    borderColor,
                  }}
                >
                  <div
                    className="flex items-center justify-center w-6 h-6 rounded-full border text-xs font-bold shrink-0 mt-0.5"
                    style={{
                      borderColor,
                      color: state.complete || state.current ? "white" : "var(--color-text-muted)",
                      background: state.complete ? "var(--color-success)" : state.current ? "var(--color-accent)" : "transparent",
                    }}
                  >
                    {state.complete ? "✓" : step.step}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{step.name}</span>
                      {state.current && (
                        <span className="text-[10px] uppercase tracking-wider font-bold animate-pulse" style={{ color: "var(--color-accent)" }}>
                          Running...
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

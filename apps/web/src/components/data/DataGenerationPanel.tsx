"use client";

import { Database, Play, RefreshCw, Upload } from "lucide-react";
import { DataManifestTable } from "@/components/data/DataManifestTable";
import { IngestionJobStatus } from "@/components/data/IngestionJobStatus";
import type { DataGenerationPreset, IngestionJob, ManifestRowCount } from "@/types/data";

type Props = {
  customers: number;
  dataDir: string;
  days: number;
  isGenerating: boolean;
  isIngesting: boolean;
  isQueued: boolean;
  isScanning: boolean;
  job: IngestionJob | null;
  manifestRows: ManifestRowCount[];
  presets: DataGenerationPreset[];
  seed: number;
  selectedPreset: string;
  totalRows: number;
  onCustomersChange: (value: number) => void;
  onDataDirChange: (value: string) => void;
  onDaysChange: (value: number) => void;
  onGenerate: () => void;
  onIngest: () => void;
  onPresetChange: (value: string) => void;
  onRunScan: () => void;
  onSeedChange: (value: number) => void;
  onClientsChange: (value: number) => void;
  clients: number;
};

export function DataGenerationPanel({
  clients,
  customers,
  dataDir,
  days,
  isGenerating,
  isIngesting,
  isQueued,
  isScanning,
  job,
  manifestRows,
  presets,
  seed,
  selectedPreset,
  totalRows,
  onClientsChange,
  onCustomersChange,
  onDataDirChange,
  onDaysChange,
  onGenerate,
  onIngest,
  onPresetChange,
  onRunScan,
  onSeedChange,
}: Props) {
  const canLoadToDatabase =
    Boolean(job?.data_dir || totalRows > 0) && !isGenerating && !isQueued;
  const numericFields = [
    { label: "Active Clients", value: clients, setter: onClientsChange },
    { label: "Customers per Client", value: customers, setter: onCustomersChange },
    { label: "Days of History", value: days, setter: onDaysChange },
    { label: "Seed", value: seed, setter: onSeedChange },
  ];

  return (
    <section className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Database size={18} style={{ color: "var(--color-accent)" }} />
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Synthetic Data Generator
        </h2>
      </div>

      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
        Generate synthetic Shopify, Klaviyo, ad platform, benchmark, recommendation, and RAG-ready records, then load the package into the backend ingestion pipeline.
      </p>

      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.key}
            onClick={() => onPresetChange(preset.key)}
            className="px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-all"
            style={{
              background:
                selectedPreset === preset.key
                  ? "var(--color-accent-subtle)"
                  : "transparent",
              color:
                selectedPreset === preset.key
                  ? "var(--color-accent)"
                  : "var(--color-text-secondary)",
              border: `1px solid ${
                selectedPreset === preset.key
                  ? "var(--color-accent)"
                  : "var(--color-border)"
              }`,
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {numericFields.map((field) => (
          <div key={field.label}>
            <label
              className="text-[11px] font-semibold uppercase tracking-wider block mb-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              {field.label}
            </label>
            <input
              type="number"
              value={field.value}
              onChange={(event) => field.setter(Number(event.target.value))}
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
        <label
          className="text-[11px] font-semibold uppercase tracking-wider block mb-1"
          style={{ color: "var(--color-text-muted)" }}
        >
          Data Directory
        </label>
        <input
          type="text"
          value={dataDir}
          onChange={(event) => onDataDirChange(event.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm bg-primary border"
          style={{
            background: "var(--color-bg-tertiary)",
            borderColor: "var(--color-border)",
            color: "var(--color-text-primary)",
          }}
        />
      </div>

      <button
        onClick={onGenerate}
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

      <DataManifestTable rows={manifestRows} totalRows={totalRows} />

      <div className="flex gap-2 pt-2">
        <button
          onClick={onIngest}
          disabled={!canLoadToDatabase || isIngesting}
          className="flex-1 btn btn-secondary text-xs flex items-center justify-center gap-1"
        >
          {isIngesting ? (
            <RefreshCw size={12} className="animate-spin" />
          ) : (
            <Upload size={12} />
          )}
          Load to Database
        </button>
        <button
          onClick={onRunScan}
          disabled={isScanning}
          className="flex-1 btn btn-primary text-xs flex items-center justify-center gap-1"
        >
          {isScanning ? (
            <RefreshCw size={12} className="animate-spin" />
          ) : (
            <Play size={12} />
          )}
          Run Ingestion Scan
        </button>
      </div>

      <IngestionJobStatus job={job} />
    </section>
  );
}

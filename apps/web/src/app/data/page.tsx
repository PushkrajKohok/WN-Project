"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { DataGenerationPanel } from "@/components/data/DataGenerationPanel";
import { IngestionFrequencyBar } from "@/components/data/IngestionFrequencyBar";
import { IngestionPipelineSteps } from "@/components/data/IngestionPipelineSteps";
import {
  generateSyntheticData,
  getDataJob,
  getDataManifest,
  ingestData,
  updateIngestionFrequency,
  getIngestionFrequency,
  apiSend,
} from "@/lib/api";
import { mockDataPresets, mockIngestionSettings } from "@/lib/mock-data";
import type {
  DataGenerationPreset,
  DataManifestResponse,
  IngestionFrequencySetting,
  IngestionJob,
  ManifestRowCount,
  PipelineStep,
} from "@/types/data";

const DEFAULT_DATA_DIR = "./data/wastenot_synthetic_sample_data";

const PRESETS: DataGenerationPreset[] = [
  { key: "small", label: "Small Demo", clients: 10, customers_per_client: 200, days: 30, seed: 7 },
  { key: "default", label: "Default", clients: 60, customers_per_client: 800, days: 90, seed: 42 },
  { key: "large", label: "Large", clients: 100, customers_per_client: 1500, days: 180, seed: 99 },
];

const TABLE_PURPOSES: Record<string, string> = {
  clients: "Client account metadata and consent flags.",
  products: "Product catalog and margin context.",
  customers: "Customer attributes and lifetime value signals.",
  shopify_orders: "Order-level Shopify revenue history.",
  shopify_order_items: "Line items tied to each Shopify order.",
  klaviyo_events: "Email, flow, and campaign engagement events.",
  ad_campaign_settings: "Campaign-level configuration from ad platforms.",
  ad_adsets: "Ad set targeting and budget configuration.",
  ad_performance_daily: "Daily advertising performance facts.",
  audience_segments: "Reusable audience definitions and sync metadata.",
  audience_memberships: "Customer membership inside each audience segment.",
  optimization_history: "Executed or rolled-back optimization actions.",
  cross_client_benchmarks: "Anonymized benchmark strategies across clients.",
  recommendation_records: "Generated recommendations ready for review.",
  knowledge_graph_edges: "Cross-client GraphRAG relationship edges.",
  rag_documents: "Text chunks prepared for future retrieval.",
  schema_versions: "Schema drift and validation history.",
};

const TABLE_LABELS: Record<string, string> = {
  clients: "clients",
  products: "products",
  customers: "customers",
  shopify_orders: "shopify_orders",
  shopify_order_items: "shopify_order_items",
  klaviyo_events: "klaviyo_events",
  ad_campaign_settings: "ad_campaign_settings",
  ad_adsets: "ad_adsets",
  ad_performance_daily: "ad_performance_daily",
  audience_segments: "audience_segments",
  audience_memberships: "audience_memberships",
  optimization_history: "optimization_history",
  cross_client_benchmarks: "cross_client_benchmarks",
  recommendation_records: "recommendation_records",
  knowledge_graph_edges: "knowledge_graph_edges",
  rag_documents: "rag_documents",
  schema_versions: "schema_versions",
};

function manifestCounts(
  manifest: DataManifestResponse,
  job: IngestionJob | null,
): Record<string, number> {
  if (job?.row_counts && Object.keys(job.row_counts).length > 0) {
    return job.row_counts;
  }
  if (manifest.row_counts) {
    return Object.fromEntries(
      Object.entries(manifest.row_counts).map(([key, value]) => [key.replace(".csv", ""), value]),
    );
  }
  if (manifest.rows) {
    return Object.fromEntries(
      Object.entries(manifest.rows).map(([key, value]) => [key.replace(".csv", ""), value]),
    );
  }
  if (manifest.files) {
    return Object.fromEntries(
      manifest.files.map((file) => [file.name.replace(".csv", ""), file.rows]),
    );
  }
  return {};
}

function buildManifestRows(counts: Record<string, number>): ManifestRowCount[] {
  return Object.keys(TABLE_PURPOSES).map((table) => ({
    table,
    label: TABLE_LABELS[table] || table,
    rows: counts[table] || 0,
    purpose: TABLE_PURPOSES[table],
  }));
}

function pipelineFor(job: IngestionJob | null, counts: Record<string, number>): PipelineStep[] {
  const hasRows = Object.keys(counts).length > 0;
  const isGenerationJob = job?.job_id.startsWith("gen_");
  const isIngestionJob = job?.job_id.startsWith("ing_");
  const failed = job?.status === "failed";

  const runningIndex = failed
    ? isGenerationJob
      ? 1
      : isIngestionJob
      ? 3
      : 0
    : job?.status === "running" || job?.status === "queued"
    ? isGenerationJob
      ? 1
      : isIngestionJob
      ? 3
      : 0
    : 0;

  const completeThrough = job?.status === "completed" ? (isGenerationJob ? 2 : 6) : 0;

  return [
    {
      id: "csv",
      name: "CSV generated/uploaded",
      description: "Compile raw ad and commerce CSV packages.",
      status: completeThrough >= 1 ? "completed" : runningIndex === 1 ? "running" : hasRows ? "ready" : "pending",
    },
    {
      id: "schema",
      name: "Schema validation",
      description: "Enforce types, references, and file-level integrity.",
      status: completeThrough >= 2 ? "completed" : runningIndex === 1 ? "running" : hasRows ? "ready" : "pending",
    },
    {
      id: "postgres",
      name: "Load to Postgres",
      description: "Insert clean rows into the transactional database.",
      status: completeThrough >= 3 ? "completed" : failed && isIngestionJob ? "failed" : runningIndex === 3 ? "running" : hasRows ? "ready" : "pending",
    },
    {
      id: "rag",
      name: "Prepare RAG documents",
      description: "Stage textual records for future embeddings.",
      status: completeThrough >= 4 ? "completed" : runningIndex === 3 ? "running" : hasRows ? "ready" : "pending",
    },
    {
      id: "graph",
      name: "Build knowledge graph edges",
      description: "Load benchmark links and relationship edges.",
      status: completeThrough >= 5 ? "completed" : runningIndex === 3 ? "running" : hasRows ? "ready" : "pending",
    },
    {
      id: "scan",
      name: "Start agent scan",
      description: "Trigger public agent activity summaries from ingested records.",
      status: completeThrough >= 6 ? "completed" : runningIndex === 3 ? "running" : hasRows ? "ready" : "pending",
    },
  ];
}

export default function DataIngestionPage() {
  const defaultPreset = mockDataPresets.default;
  const [settings, setSettings] = useState<IngestionFrequencySetting>(mockIngestionSettings);
  const [selectedFrequency, setSelectedFrequency] = useState("1_hour");
  const [saveState, setSaveState] = useState<"idle" | "success" | "error">("idle");
  const [selectedPreset, setSelectedPreset] = useState("default");
  const [clients, setClients] = useState(defaultPreset.clients);
  const [customers, setCustomers] = useState(defaultPreset.customers_per_client);
  const [days, setDays] = useState(defaultPreset.days);
  const [seed, setSeed] = useState(defaultPreset.seed);
  const [dataDir, setDataDir] = useState(DEFAULT_DATA_DIR);
  const [job, setJob] = useState<IngestionJob | null>(null);
  const [manifest, setManifest] = useState<DataManifestResponse>({});
  const [isSavingFrequency, setIsSavingFrequency] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isGenerating = job?.status === "running" && job.job_id.startsWith("gen_");
  const isIngesting = job?.status === "running" && job.job_id.startsWith("ing_");
  const isQueued = job?.status === "queued";

  const counts = useMemo(() => manifestCounts(manifest, job), [manifest, job]);
  const manifestRows = useMemo(() => buildManifestRows(counts), [counts]);
  const pipelineSteps = useMemo(() => pipelineFor(job, counts), [job, counts]);
  const totalRows = manifestRows.reduce((sum, row) => sum + row.rows, 0);

  useEffect(() => {
    getIngestionFrequency().then((next) => {
      setSettings(next);
      setSelectedFrequency(next.frequency || "1_hour");
    });
    getDataManifest().then((next) => {
      setManifest(next);
      if (next.data_dir) {
        setDataDir(next.data_dir);
      }
    });
  }, []);

  useEffect(() => {
    if (!job || !["queued", "running"].includes(job.status)) {
      return;
    }

    const timer = window.setInterval(async () => {
      const next = await getDataJob(job.job_id, job);
      setJob(next);
      if (next.status === "completed") {
        const latestManifest = await getDataManifest();
        setManifest(latestManifest);
        if (next.data_dir) {
          setDataDir(next.data_dir);
        }
      }
    }, 2000);

    return () => window.clearInterval(timer);
  }, [job]);

  const applyPreset = (presetKey: string) => {
    setSelectedPreset(presetKey);
    const preset = PRESETS.find((entry) => entry.key === presetKey);
    if (!preset) {
      return;
    }
    setClients(preset.clients);
    setCustomers(preset.customers_per_client);
    setDays(preset.days);
    setSeed(preset.seed);
  };

  const markCustom = () => {
    setSelectedPreset("custom");
  };

  const saveFrequency = async () => {
    const option = settings.options.find((item) => item.value === selectedFrequency);
    if (!option) {
      return;
    }

    setIsSavingFrequency(true);
    setSaveState("idle");
    setError(null);
    try {
      const next = await updateIngestionFrequency({
        frequency: option.value,
        frequency_label: option.label,
        frequency_minutes: option.minutes,
        reason: settings.reason,
      });
      setSettings(next);
      setSelectedFrequency(next.frequency);
      setSaveState("success");
    } catch (err) {
      setSaveState("error");
      setError(err instanceof Error ? err.message : "Could not save ingestion frequency.");
    } finally {
      setIsSavingFrequency(false);
    }
  };

  const handleGenerate = async () => {
    setError(null);
    try {
      const next = await generateSyntheticData({
        preset: selectedPreset,
        clients,
        customers_per_client: customers,
        days,
        seed,
      });
      setJob(next);
      if (next.data_dir) {
        setDataDir(next.data_dir);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation request failed.");
    }
  };

  const handleIngest = async () => {
    setError(null);
    try {
      const next = await ingestData({ data_dir: dataDir, reset: true });
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
          Generate synthetic data, load it into Postgres, and monitor ingestion health end to end.
        </p>
      </div>

      {error ? (
        <div className="glass-card p-4 flex items-start gap-3" style={{ borderColor: "var(--color-danger)" }}>
          <AlertCircle
            size={18}
            className="shrink-0 mt-0.5"
            style={{ color: "var(--color-danger)" }}
          />
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {error}
          </p>
        </div>
      ) : null}

      <IngestionFrequencyBar
        isSaving={isSavingFrequency}
        selectedFrequency={selectedFrequency}
        settings={settings}
        onChange={setSelectedFrequency}
        onSave={saveFrequency}
        saveState={saveState}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataGenerationPanel
          clients={clients}
          customers={customers}
          dataDir={dataDir}
          days={days}
          isGenerating={Boolean(isGenerating)}
          isIngesting={Boolean(isIngesting)}
          isQueued={Boolean(isQueued)}
          isScanning={isScanning}
          job={job}
          manifestRows={manifestRows}
          presets={[
            ...PRESETS,
            { key: "custom", label: "Custom", clients, customers_per_client: customers, days, seed },
          ]}
          seed={seed}
          selectedPreset={selectedPreset}
          totalRows={totalRows}
          onClientsChange={(value) => {
            markCustom();
            setClients(value);
          }}
          onCustomersChange={(value) => {
            markCustom();
            setCustomers(value);
          }}
          onDataDirChange={setDataDir}
          onDaysChange={(value) => {
            markCustom();
            setDays(value);
          }}
          onGenerate={handleGenerate}
          onIngest={handleIngest}
          onPresetChange={applyPreset}
          onRunScan={handleRunScan}
          onSeedChange={(value) => {
            markCustom();
            setSeed(value);
          }}
        />
        <IngestionPipelineSteps steps={pipelineSteps} />
      </div>
    </div>
  );
}

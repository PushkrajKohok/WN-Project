"use client";

import {
  Activity,
  Bell,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Cloud,
  Database,
  FileText,
  Gauge,
  GitBranch,
  KeyRound,
  LineChart,
  Lock,
  PlugZap,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud,
  Users,
  type LucideIcon,
} from "lucide-react";

type DiagramItem = [title: string, subtitle: string, Icon: LucideIcon];
type DiagramColumn = {
  title: string;
  tone: "accent" | "info" | "success" | "warning";
  items: DiagramItem[];
};

const columns: DiagramColumn[] = [
  {
    title: "Data Sources",
    tone: "info",
    items: [
      ["Meta Ads", "planned connector", LineChart],
      ["Google Ads", "planned connector", Target],
      ["Shopify", "orders and customers", UploadCloud],
      ["Klaviyo", "events and cohorts", Activity],
      ["Warehouse Data", "Snowflake/Postgres", Database],
    ],
  },
  {
    title: "Ingestion",
    tone: "success",
    items: [
      ["API Connectors", "read-only imports", PlugZap],
      ["Validation", "schema and freshness", ShieldCheck],
      ["Enrichment", "dedupe and normalize", RefreshCw],
      ["Scheduling", "hourly by default", Activity],
      ["Recovery", "logs and retries", CheckCircle2],
    ],
  },
  {
    title: "Data + Intelligence",
    tone: "accent",
    items: [
      ["Supabase Postgres", "system of record", Database],
      ["Core Tables", "clients, ads, actions", FileText],
      ["RAG Documents", "summaries and evidence", FileText],
      ["Vector Store", "pgvector embeddings", Sparkles],
      ["Knowledge Graph", "benchmarks and edges", GitBranch],
    ],
  },
  {
    title: "Intelligence Engine",
    tone: "warning",
    items: [
      ["Hybrid RAG", "SQL + vector + graph", BrainCircuit],
      ["LLM Reasoning", "public explanations", Bot],
      ["Recommendation Engine", "scoring and priority", Target],
      ["Agent Workbench", "scan summaries", Users],
      ["Guardrails", "approval boundary", ShieldCheck],
    ],
  },
  {
    title: "Outputs",
    tone: "info",
    items: [
      ["Dashboard", "KPIs and insights", Gauge],
      ["Recommendations", "review queue", Sparkles],
      ["Agent Insights", "operator context", Bot],
      ["Execution Actions", "guarded/planned", CheckCircle2],
      ["Alerts", "email and in-app", Bell],
    ],
  },
];

const foundations: DiagramItem[] = [
  ["Security + Privacy", "No raw data shared with LLMs, client isolation, encrypted secrets.", Lock],
  ["Observability", "LLM invocation logs, token visibility, audit trails, performance monitoring.", Activity],
  ["Deployment", "Vercel frontend, Render FastAPI backend, Supabase Postgres.", Cloud],
];

const principles: DiagramItem[] = [
  ["Privacy-first", "Aggregated learning only", ShieldCheck],
  ["Multi-tenant", "Strict client isolation", Users],
  ["Explainable", "Evidence-backed decisions", FileText],
  ["Human-in-loop", "Approvals for high risk", KeyRound],
  ["Cost-aware", "Small models and limits", Gauge],
  ["Scalable", "Workers and cron ready", Cloud],
];

const toneStyles: Record<string, { border: string; bg: string; text: string }> = {
  accent: { border: "rgba(99, 102, 241, 0.45)", bg: "rgba(99, 102, 241, 0.10)", text: "var(--color-accent)" },
  info: { border: "rgba(59, 130, 246, 0.45)", bg: "rgba(59, 130, 246, 0.10)", text: "var(--color-info)" },
  success: { border: "rgba(34, 197, 94, 0.45)", bg: "rgba(34, 197, 94, 0.10)", text: "var(--color-success)" },
  warning: { border: "rgba(245, 158, 11, 0.45)", bg: "rgba(245, 158, 11, 0.10)", text: "var(--color-warning)" },
};

export function ArchitectureDiagram() {
  return (
    <section id="architecture-diagram" className="glass-card overflow-hidden p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">WasteNot Intelligence Layer Architecture</h2>
          <p className="mt-2 max-w-3xl text-sm" style={{ color: "var(--color-text-secondary)" }}>
            AI-powered ad optimization with multi-client learning, privacy-safe evidence retrieval, and human-controlled execution.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="badge badge-info">Data flow</span>
          <span className="badge badge-accent">Intelligence flow</span>
          <span className="badge badge-medium">Action boundary</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-5">
        {columns.map((column, columnIndex) => {
          const tone = toneStyles[column.tone];
          return (
            <div key={column.title} className="relative">
              {columnIndex > 0 && (
                <div className="absolute -left-4 top-1/2 hidden h-px w-4 xl:block" style={{ background: columnIndex < 3 ? "var(--color-success)" : columnIndex === 3 ? "var(--color-accent)" : "var(--color-warning)" }} />
              )}
              <div className="h-full rounded-xl border p-3" style={{ borderColor: tone.border, background: tone.bg }}>
                <div className="mb-3 rounded-lg px-3 py-2 text-center text-xs font-bold uppercase" style={{ color: tone.text, background: "rgba(10, 11, 15, 0.42)" }}>
                  {column.title}
                </div>
                <div className="space-y-2">
                  {column.items.map(([title, subtitle, Icon]) => (
                    <div key={title as string} className="flex min-h-[72px] items-center gap-3 rounded-lg border p-3" style={{ borderColor: "var(--color-border)", background: "rgba(20, 21, 31, 0.82)" }}>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ color: tone.text, background: "rgba(255, 255, 255, 0.04)" }}>
                        <Icon size={21} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold leading-snug">{title}</div>
                        <div className="mt-1 text-xs leading-snug" style={{ color: "var(--color-text-secondary)" }}>{subtitle}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
        {foundations.map(([title, text, Icon]) => (
          <div key={title as string} className="rounded-xl border p-4" style={{ borderColor: "rgba(20, 184, 166, 0.35)", background: "rgba(20, 184, 166, 0.08)" }}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ color: "#14b8a6", background: "rgba(20, 184, 166, 0.12)" }}>
                <Icon size={21} />
              </div>
              <div>
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl border p-3" style={{ borderColor: "var(--color-border)", background: "rgba(255, 255, 255, 0.025)" }}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-6">
          {principles.map(([title, text, Icon]) => (
            <div key={title as string} className="flex items-start gap-2 rounded-lg px-3 py-2">
              <Icon className="mt-0.5 shrink-0" size={17} style={{ color: "var(--color-info)" }} />
              <div>
                <div className="text-xs font-semibold">{title}</div>
                <div className="mt-0.5 text-[11px] leading-snug" style={{ color: "var(--color-text-secondary)" }}>{text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

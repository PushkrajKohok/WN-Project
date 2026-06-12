"use client";

import { CalendarDays, CheckCircle2, Flag, ShieldCheck } from "lucide-react";

const phases = [
  {
    days: "0-15",
    title: "Production Foundation",
    summary: "Make the system reliable before making it autonomous.",
    items: [
      "Finalize canonical schema for clients, campaigns, performance, audiences, recommendations, logs, and benchmarks.",
      "Set up Supabase/Postgres migrations, environment variables, health checks, and deployment baselines.",
      "Add tenant-safe client boundaries, ingestion job tracking, schema drift logging, and freshness checks.",
    ],
    success: [
      "Health checks pass.",
      "Dashboard loads from production database.",
      "No secrets in code.",
      "Data is clearly fresh, stale, or incomplete.",
    ],
  },
  {
    days: "16-30",
    title: "Read-Only Intelligence MVP",
    summary: "Create value without touching ad accounts.",
    items: [
      "Connect one real read-only source first, preferably Shopify or Meta Ads.",
      "Keep synthetic fallback data available for demos.",
      "Add hourly ad-performance ingestion and daily historical order/customer sync.",
      "Generate recommendations for recent purchaser exclusion, high-frequency low-ROAS ad sets, audience overlap, and stale syncs.",
    ],
    success: [
      "One connector works end to end.",
      "Recommendations use real ingested data.",
      "Every recommendation has SQL evidence, impact, confidence, risk, and approval requirement.",
      "No automated execution yet.",
    ],
  },
  {
    days: "31-45",
    title: "RAG + Evidence Quality",
    summary: "Prove why each recommendation is reasonable.",
    items: [
      "Enable pgvector in Supabase and embed campaign summaries, history, benchmarks, and playbooks.",
      "Combine SQL metrics, vector search, keyword fallback, graph relationships, and benchmark evidence.",
      "Add cost-conscious LLM public explanations with hallucination controls.",
    ],
    success: [
      "Relevant historical and benchmark context is retrieved.",
      "Detail page shows SQL, vector, graph, and risk evidence.",
      "LLM explains only; deterministic guardrails decide.",
      "Low-evidence items route to review.",
    ],
  },
  {
    days: "46-60",
    title: "Human-in-the-Loop Workflow",
    summary: "Turn recommendations into an operator workflow.",
    items: [
      "Add approval queue, Human Interface summaries, risk thresholds, and audit trail.",
      "Support approve, reject, and request-more-evidence decisions.",
      "Attach action simulation and rollback plans before any execution.",
    ],
    success: [
      "Every decision is logged.",
      "Every executable action has a rollback plan.",
      "High-risk recommendations cannot bypass approval.",
    ],
  },
  {
    days: "61-75",
    title: "Limited Guarded Execution",
    summary: "Act only in narrow, low-risk paths after approval.",
    items: [
      "Connect one ad-platform execution path, preferably Meta audience upload or exclusion refresh.",
      "Start with refresh exclusion audience, upload hashed audience, or pause stale audience sync.",
      "Add execution snapshots, idempotency keys, retries, rollback tracking, and status monitoring.",
    ],
    success: [
      "One low-risk action executes safely after approval.",
      "Before/after state is stored.",
      "Failed writes retry safely.",
      "Budget changes remain human-approved only.",
    ],
  },
  {
    days: "76-90",
    title: "Recursive Learning + Network Effects",
    summary: "Learn from outcomes and improve benchmark confidence.",
    items: [
      "Measure expected vs actual impact and update optimization history.",
      "Create learning events from approved, rejected, executed, and rolled-back recommendations.",
      "Update cross-client benchmarks using aggregated, privacy-safe outcomes by category, spend band, platform, and action type.",
    ],
    success: [
      "Working strategies improve confidence for similar clients.",
      "Failed or rolled-back strategies reduce confidence.",
      "Contribution-margin lift net of rollbacks is tracked.",
    ],
  },
];

const day90Outcomes = [
  "One or two real read-only connectors.",
  "One guarded execution path for low-risk audience actions.",
  "Hybrid SQL + vector + graph evidence retrieval.",
  "LLM-generated public explanations.",
  "Human approval, audit logging, rollback planning, and outcome measurement.",
  "Privacy-safe cross-client benchmark learning.",
];

export function RoadmapSection() {
  return (
    <section id="roadmap" className="glass-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Realistic 90-Day Build Plan</h2>
          <p className="mt-2 max-w-3xl text-sm" style={{ color: "var(--color-text-secondary)" }}>
            The practical Day-90 goal is not fully autonomous media buying. It is a trusted intelligence layer that finds waste, explains recommendations, supports human decisions, safely executes narrow low-risk actions, and learns from every outcome.
          </p>
        </div>
        <span className="badge badge-accent">Production path</span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {phases.map((phase) => (
          <div key={phase.title} className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
            <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: "var(--color-accent)" }}>
              <CalendarDays size={14} />
              Days {phase.days}
            </div>
            <h3 className="mt-2 text-sm font-semibold">{phase.title}</h3>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{phase.summary}</p>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                  <Flag size={13} />
                  Milestones
                </div>
                <ul className="mt-2 space-y-2 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {phase.items.map((item) => <li key={item}>- {item}</li>)}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                  <CheckCircle2 size={13} />
                  Success Criteria
                </div>
                <ul className="mt-2 space-y-2 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {phase.success.map((item) => <li key={item}>- {item}</li>)}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-lg border p-4" style={{ borderColor: "rgba(34, 197, 94, 0.35)", background: "var(--color-success-subtle)" }}>
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 shrink-0" size={20} style={{ color: "var(--color-success)" }} />
          <div>
            <h3 className="text-sm font-semibold">What Should Be Working By Day 90</h3>
            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
              {day90Outcomes.map((item) => (
                <div key={item} className="rounded-md border px-3 py-2 text-xs" style={{ borderColor: "rgba(34, 197, 94, 0.25)", background: "rgba(10, 11, 15, 0.24)" }}>
                  {item}
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              Budget changes, bid changes, and broad campaign restructuring should remain human-approved until the system has enough outcome history to prove safety.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

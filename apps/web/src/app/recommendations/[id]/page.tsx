"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  X,
  Database,
  Network,
  FileSearch,
  ShieldCheck,
  RotateCcw,
  Clock,
} from "lucide-react";
import { mockRecommendations } from "@/lib/mock-data";
import type { Recommendation } from "@/lib/mock-data";
import { apiGet, apiSend } from "@/lib/api";
import { formatCurrency, timeAgo } from "@/lib/utils";

export default function RecommendationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const fallback = mockRecommendations.find((r) => r.id === id);
  const [rec, setRec] = useState<Recommendation | undefined>(fallback);

  useEffect(() => {
    apiGet<Recommendation | undefined>(`/recommendations/${id}`, fallback).then(setRec);
  }, [fallback, id]);

  const handleDecision = async (decision: "approve" | "reject") => {
    await apiSend(`/recommendations/${id}/${decision}`, "POST", {});
    setRec((current) =>
      current
        ? { ...current, status: decision === "approve" ? "approved" : "rejected", decision_required: false }
        : current,
    );
  };

  if (!rec) {
    return (
      <div className="glass-card p-12 text-center">
        <p style={{ color: "var(--color-text-muted)" }}>Recommendation not found.</p>
        <Link href="/recommendations" className="btn btn-secondary mt-4 inline-flex">
          <ArrowLeft size={14} /> Back to Recommendations
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/recommendations"
          className="flex items-center gap-1 text-xs font-medium mb-3 hover:underline"
          style={{ color: "var(--color-accent)" }}
        >
          <ArrowLeft size={14} /> Back to Recommendations
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
              {rec.title}
            </h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`badge badge-${rec.risk}`}>
                {rec.risk.charAt(0).toUpperCase() + rec.risk.slice(1)} Risk
              </span>
              <span className="badge badge-info">{rec.platform}</span>
              <span className="badge badge-accent">{rec.type.replace(/_/g, " ")}</span>
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {rec.client_name} · {timeAgo(rec.created_at)}
              </span>
            </div>
          </div>
          {rec.decision_required && (
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => handleDecision("approve")} className="btn btn-success">
                <Check size={16} /> Approve
              </button>
              <button onClick={() => handleDecision("reject")} className="btn btn-danger">
                <X size={16} /> Reject
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary & Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-5">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
            Summary
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            {rec.summary}
          </p>
        </div>
        <div className="glass-card p-5 space-y-4">
          <div>
            <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-muted)" }}>
              Expected Savings
            </div>
            <div className="text-2xl font-bold" style={{ color: "var(--color-success)" }}>
              {formatCurrency(rec.expected_savings)}
              <span className="text-xs font-normal ml-1" style={{ color: "var(--color-text-muted)" }}>/month</span>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-muted)" }}>
              Confidence Score
            </div>
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold" style={{ color: "var(--color-accent)" }}>
                {(rec.confidence * 100).toFixed(0)}%
              </div>
              <div
                className="flex-1 h-2 rounded-full overflow-hidden"
                style={{ background: "var(--color-bg-tertiary)" }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${rec.confidence * 100}%`,
                    background: "linear-gradient(90deg, #6366f1, #a855f7)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* SQL Evidence */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Database size={16} style={{ color: "var(--color-info)" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              SQL Evidence
            </h3>
          </div>
          <pre
            className="text-xs p-3 rounded-lg overflow-x-auto leading-relaxed"
            style={{
              background: "var(--color-bg-primary)",
              border: "1px solid var(--color-border)",
              color: "var(--color-accent-hover)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {rec.evidence.sql}
          </pre>
        </div>

        {/* Graph Evidence */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Network size={16} style={{ color: "var(--color-accent)" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Cross-Client / Graph Evidence
            </h3>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            {rec.evidence.graph}
          </p>
        </div>

        {/* Vector/RAG Evidence */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileSearch size={16} style={{ color: "#a855f7" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Vector / RAG Evidence
            </h3>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            {rec.evidence.vector}
          </p>
        </div>
      </div>

      {/* Risk Assessment & Rollback */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={16} style={{ color: "var(--color-warning)" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Risk Assessment
            </h3>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            {rec.risk_assessment}
          </p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <RotateCcw size={16} style={{ color: "var(--color-info)" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Rollback Plan
            </h3>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            {rec.rollback_plan}
          </p>
        </div>
      </div>

      {/* Agent Trace */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} style={{ color: "var(--color-text-muted)" }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Agent Trace
          </h3>
        </div>
        <div className="space-y-0">
          {rec.agent_trace.map((trace, idx) => (
            <div key={idx} className="flex items-start gap-4 relative">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div
                  className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 z-10"
                  style={{
                    background:
                      trace.agent === "Data Scout"
                        ? "#3b82f6"
                        : trace.agent === "Pattern Miner"
                        ? "#a855f7"
                        : trace.agent === "Recommendation Engine"
                        ? "#6366f1"
                        : trace.agent === "Risk Grader"
                        ? "#f59e0b"
                        : trace.agent === "Action Executor"
                        ? "#22c55e"
                        : "#ef4444",
                  }}
                />
                {idx < rec.agent_trace.length - 1 && (
                  <div className="w-px flex-1 min-h-[32px]" style={{ background: "var(--color-border)" }} />
                )}
              </div>
              <div className="pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>
                    {trace.agent}
                  </span>
                  <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                    {timeAgo(trace.ts)}
                  </span>
                </div>
                <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                  {trace.action}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

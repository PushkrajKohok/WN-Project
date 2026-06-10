"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import type { ActionDetail } from "@/types/actions";
import { ActionStatusBadge } from "./ActionStatusBadge";
import { RollbackTimeline } from "./RollbackTimeline";

export function ActionDetailDrawer({ detail, onClose }: { detail?: ActionDetail; onClose: () => void }) {
  if (!detail) return null;
  const { action } = detail;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
      <aside className="h-full w-full max-w-3xl overflow-y-auto border-l p-6" style={{ background: "var(--color-bg-primary)", borderColor: "var(--color-border)" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">{action.action_type}</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{action.brand_name} / {action.target_platform} / {action.campaign_name || action.target_campaign_id}</p>
          </div>
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm" aria-label="Close action detail"><X size={14} /></button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <ActionStatusBadge status={action.status} />
          <span className="badge badge-info">{action.risk_level} risk</span>
          <span className="badge badge-accent">{(action.confidence_score * 100).toFixed(0)}% confidence</span>
        </div>

        <Section title="Reason">
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{action.reason}</p>
        </Section>

        <Section title="Impact and Approval">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="Expected impact" value={`${(action.expected_impact_pct * 100).toFixed(1)}%`} />
            <Metric label="Actual impact" value={action.actual_impact_pct == null ? "-" : `${(action.actual_impact_pct * 100).toFixed(1)}%`} />
            <Metric label="Approved by" value={action.approved_by || "-"} />
            <Metric label="Agent" value={action.agent_name} />
          </div>
        </Section>

        <Section title="Evidence References">
          <div className="flex flex-wrap gap-2">
            {action.evidence_refs.map((ref) => <span key={ref} className="badge badge-info">{ref}</span>)}
            {action.evidence_refs.length === 0 && <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>No evidence references attached.</span>}
          </div>
        </Section>

        <Section title="Rollback Timeline">
          <RollbackTimeline action={action} events={detail.audit_events} />
        </Section>

        <Section title="Rollback Plan">
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{detail.rollback_plan.summary}</p>
          <ol className="mt-3 space-y-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {detail.rollback_plan.steps.map((step, index) => <li key={step}>{index + 1}. {step}</li>)}
          </ol>
          {detail.rollback_plan.blocking_reason && <p className="mt-3 text-xs" style={{ color: "var(--color-warning)" }}>{detail.rollback_plan.blocking_reason}</p>}
        </Section>

        <Section title="Safety Checks">
          <div className="space-y-2">
            {detail.safety_checks.map((check) => (
              <div key={check.label} className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex items-center justify-between gap-3 text-sm font-semibold">
                  <span>{check.label}</span>
                  <span className="badge badge-info">{check.status}</span>
                </div>
                <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>{check.message}</p>
              </div>
            ))}
          </div>
        </Section>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6 rounded-lg border p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm font-semibold">{value}</div>
      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</div>
    </div>
  );
}

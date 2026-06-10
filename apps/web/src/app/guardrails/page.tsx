"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bot, RefreshCw, RotateCcw, Save } from "lucide-react";
import { ApprovalRulesCard } from "@/components/guardrails/ApprovalRulesCard";
import { AutoExecutionRulesCard } from "@/components/guardrails/AutoExecutionRulesCard";
import { BenchmarkEvidenceRulesCard } from "@/components/guardrails/BenchmarkEvidenceRulesCard";
import { ConfidenceSettingsCard } from "@/components/guardrails/ConfidenceSettingsCard";
import { CrossClientPrivacyCard } from "@/components/guardrails/CrossClientPrivacyCard";
import { DataFreshnessRulesCard } from "@/components/guardrails/DataFreshnessRulesCard";
import { GuardrailAuditLog } from "@/components/guardrails/GuardrailAuditLog";
import { GuardrailImpactPreview } from "@/components/guardrails/GuardrailImpactPreview";
import { GuardrailSummaryCards } from "@/components/guardrails/GuardrailSummaryCards";
import {
  fallbackGuardrailSettings,
  getGuardrailAuditLog,
  getGuardrailImpactPreview,
  getGuardrails,
  resetGuardrails,
  updateGuardrails,
} from "@/lib/api";
import type { GuardrailAuditLogItem, GuardrailImpactPreview as Impact, GuardrailSettings } from "@/types/guardrails";

export default function GuardrailsPage() {
  const [settings, setSettings] = useState<GuardrailSettings>(fallbackGuardrailSettings);
  const [draft, setDraft] = useState<GuardrailSettings>(fallbackGuardrailSettings);
  const [impact, setImpact] = useState<Impact>({
    total_recommendations: 0,
    auto_execute_eligible: 0,
    human_approval_required: 0,
    needs_more_evidence: 0,
    blocked_by_guardrails: 0,
    high_risk_blocked_or_review: 0,
    budget_or_pause_review: 0,
    low_confidence_review: 0,
    missing_benchmark_review: 0,
  });
  const [auditLogs, setAuditLogs] = useState<GuardrailAuditLogItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshSupportingData = useCallback(() => {
    Promise.all([getGuardrailImpactPreview(), getGuardrailAuditLog()]).then(([nextImpact, logs]) => {
      setImpact(nextImpact);
      setAuditLogs(logs.items);
    });
  }, []);

  const load = useCallback(() => {
    setError(null);
    Promise.all([getGuardrails(), getGuardrailImpactPreview(), getGuardrailAuditLog()]).then(([nextSettings, nextImpact, logs]) => {
      setSettings(nextSettings);
      setDraft(nextSettings);
      setImpact(nextImpact);
      setAuditLogs(logs.items);
    });
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const patchDraft = (patch: Partial<GuardrailSettings>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const save = () => {
    setIsSaving(true);
    setError(null);
    updateGuardrails(draft)
      .then((nextSettings) => {
        setSettings(nextSettings);
        setDraft(nextSettings);
        setNotice("Guardrail settings saved.");
        refreshSupportingData();
      })
      .catch((err) => setError(err.message || "Unable to save guardrails."))
      .finally(() => setIsSaving(false));
  };

  const reset = () => {
    const confirmed = window.confirm("Reset guardrail settings to defaults?");
    if (!confirmed) return;
    setIsSaving(true);
    resetGuardrails()
      .then((nextSettings) => {
        setSettings(nextSettings);
        setDraft(nextSettings);
        setNotice("Guardrail settings reset to defaults.");
        refreshSupportingData();
      })
      .catch((err) => setError(err.message || "Unable to reset guardrails."))
      .finally(() => setIsSaving(false));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold gradient-text">Guardrails & Approval Settings</h1>
            {settings.source === "mock" && <span className="badge badge-info">Demo fallback mode</span>}
          </div>
          <p className="mt-1 max-w-3xl text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Control when the intelligence layer can auto-execute, when it must ask for approval, and when recommendations need stronger evidence.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={save} disabled={isSaving} className="btn btn-primary"><Save size={15} /> Save Changes</button>
          <button type="button" onClick={reset} disabled={isSaving} className="btn btn-secondary"><RotateCcw size={15} /> Reset Defaults</button>
          <button type="button" onClick={refreshSupportingData} className="btn btn-secondary"><RefreshCw size={15} /> Refresh Impact</button>
          <Link href="/agents" className="btn btn-secondary"><Bot size={15} /> Agent Workbench</Link>
        </div>
      </div>

      {(notice || error) && (
        <div className="rounded-lg border px-4 py-3 text-sm" style={{ borderColor: error ? "var(--color-danger)" : "var(--color-border)", background: "var(--color-bg-tertiary)", color: error ? "var(--color-danger)" : "var(--color-text-primary)" }}>
          {error || notice}
        </div>
      )}

      <GuardrailSummaryCards settings={draft} />
      <GuardrailImpactPreview impact={impact} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ConfidenceSettingsCard settings={draft} onChange={patchDraft} />
        <ApprovalRulesCard settings={draft} onChange={patchDraft} />
        <AutoExecutionRulesCard settings={draft} onChange={patchDraft} />
        <DataFreshnessRulesCard settings={draft} onChange={patchDraft} />
        <BenchmarkEvidenceRulesCard settings={draft} onChange={patchDraft} />
        <CrossClientPrivacyCard settings={draft} onChange={patchDraft} />
      </div>

      <GuardrailAuditLog items={auditLogs} />
    </div>
  );
}

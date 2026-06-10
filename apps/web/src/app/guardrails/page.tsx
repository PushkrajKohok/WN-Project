"use client";

import { useState } from "react";
import {
  ShieldAlert,
  Percent,
  DollarSign,
  Share2,
  Lock,
  Plus,
  Trash2,
  CheckCircle,
} from "lucide-react";
import { mockGuardrails } from "@/lib/mock-data";

export default function GuardrailsPage() {
  const [confidence, setConfidence] = useState(mockGuardrails.confidence_threshold);
  const [spendLimit, setSpendLimit] = useState(mockGuardrails.spend_threshold_for_approval);
  const [dataSharing, setDataSharing] = useState(mockGuardrails.client_data_sharing_level);

  const [autoActions, setAutoActions] = useState(mockGuardrails.auto_execute_actions);
  const [newAutoAction, setNewAutoAction] = useState("");

  const [restrictedActions, setRestrictedActions] = useState(mockGuardrails.restricted_actions);
  const [newRestrictedAction, setNewRestrictedAction] = useState("");

  const [rules, setRules] = useState(mockGuardrails.rules);

  const addAutoAction = () => {
    if (newAutoAction.trim()) {
      setAutoActions((prev) => [...prev, newAutoAction.trim()]);
      setNewAutoAction("");
    }
  };

  const removeAutoAction = (item: string) => {
    setAutoActions((prev) => prev.filter((a) => a !== item));
  };

  const addRestrictedAction = () => {
    if (newRestrictedAction.trim()) {
      setRestrictedActions((prev) => [...prev, newRestrictedAction.trim()]);
      setNewRestrictedAction("");
    }
  };

  const removeRestrictedAction = (item: string) => {
    setRestrictedActions((prev) => prev.filter((a) => a !== item));
  };

  const toggleRule = (idx: number) => {
    setRules((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, enabled: !r.enabled } : r))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold gradient-text">Guardrails & Approval Settings</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
          Configure safety parameters, data sharing rules, and automated execution thresholds
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Parameters */}
        <div className="lg:col-span-2 space-y-6">
          {/* Threshold Sliders */}
          <div className="glass-card p-5 space-y-6">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldAlert size={18} style={{ color: "var(--color-accent)" }} />
              Execution Thresholds
            </h2>

            {/* Confidence Threshold */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-white flex items-center gap-1">
                  <Percent size={14} style={{ color: "var(--color-text-muted)" }} />
                  Confidence Threshold
                </span>
                <span className="font-bold" style={{ color: "var(--color-accent)" }}>
                  {(confidence * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                Minimum confidence score required for an agent recommendation to be surfaced.
              </p>
              <input
                type="range"
                min="0.5"
                max="0.99"
                step="0.01"
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                style={{ background: "var(--color-bg-tertiary)" }}
              />
            </div>

            {/* Spend Threshold */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-white flex items-center gap-1">
                  <DollarSign size={14} style={{ color: "var(--color-text-muted)" }} />
                  Spend Threshold for Human Approval
                </span>
                <span className="font-bold text-white">${spendLimit} / day</span>
              </div>
              <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                Recommendations affecting budgets above this threshold require manual verification.
              </p>
              <input
                type="range"
                min="100"
                max="5000"
                step="100"
                value={spendLimit}
                onChange={(e) => setSpendLimit(Number(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                style={{ background: "var(--color-bg-tertiary)" }}
              />
            </div>

            {/* Data Sharing Level */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-white flex items-center gap-1">
                  <Share2 size={14} style={{ color: "var(--color-text-muted)" }} />
                  Client Data Sharing Level
                </span>
                <span className="font-bold text-white uppercase">{dataSharing.replace(/_/g, " ")}</span>
              </div>
              <p className="text-[11px] mb-3" style={{ color: "var(--color-text-muted)" }}>
                Enforce privacy levels across vertical client networks.
              </p>
              <select
                value={dataSharing}
                onChange={(e) => setDataSharing(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-primary border outline-none cursor-pointer"
                style={{
                  background: "var(--color-bg-tertiary)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              >
                <option value="fully_private">Fully Private (No Sharing)</option>
                <option value="anonymized_benchmarks">Anonymized Benchmarks (Vertical aggregates only)</option>
                <option value="aggregated_graph">Aggregated Graph (Outliers excluded)</option>
              </select>
            </div>
          </div>

          {/* Verification Rules Checklist */}
          <div className="glass-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <CheckCircle size={18} style={{ color: "var(--color-accent)" }} />
              Corrective RAG Guardrails Validation Rules
            </h2>

            <div className="space-y-3">
              {rules.map((rule, idx) => (
                <div
                  key={idx}
                  onClick={() => toggleRule(idx)}
                  className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent-subtle"
                  style={{
                    background: rule.enabled ? "var(--color-bg-tertiary)" : "transparent",
                    borderColor: rule.enabled ? "var(--color-accent)" : "var(--color-border-subtle)",
                  }}
                >
                  <div
                    className="w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold text-white"
                    style={{
                      borderColor: rule.enabled ? "var(--color-accent)" : "var(--color-text-muted)",
                      background: rule.enabled ? "var(--color-accent)" : "transparent",
                    }}
                  >
                    {rule.enabled && "✓"}
                  </div>
                  <span className="text-xs text-white flex-1">{rule.rule}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Action Lists */}
        <div className="space-y-6">
          {/* Auto-execute allowed actions */}
          <div className="glass-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <CheckCircle size={18} style={{ color: "var(--color-success)" }} />
              Auto-Execute Allowed
            </h2>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add allowed action..."
                value={newAutoAction}
                onChange={(e) => setNewAutoAction(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-primary border"
                style={{
                  background: "var(--color-bg-tertiary)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              />
              <button onClick={addAutoAction} className="btn btn-primary btn-sm">
                <Plus size={14} />
              </button>
            </div>

            <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
              {autoActions.map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between p-2 rounded-lg border text-xs"
                  style={{ background: "var(--color-bg-tertiary)", borderColor: "var(--color-border-subtle)" }}
                >
                  <span style={{ color: "var(--color-text-secondary)" }}>{item.replace(/_/g, " ")}</span>
                  <button onClick={() => removeAutoAction(item)} className="cursor-pointer" style={{ color: "var(--color-danger)" }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Restricted Actions */}
          <div className="glass-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Lock size={18} style={{ color: "var(--color-danger)" }} />
              Restricted / Blocked Actions
            </h2>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add restricted action..."
                value={newRestrictedAction}
                onChange={(e) => setNewRestrictedAction(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-primary border"
                style={{
                  background: "var(--color-bg-tertiary)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              />
              <button onClick={addRestrictedAction} className="btn btn-primary btn-sm">
                <Plus size={14} />
              </button>
            </div>

            <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
              {restrictedActions.map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between p-2 rounded-lg border text-xs"
                  style={{ background: "var(--color-bg-tertiary)", borderColor: "var(--color-border-subtle)" }}
                >
                  <span style={{ color: "var(--color-text-secondary)" }}>{item.replace(/_/g, " ")}</span>
                  <button onClick={() => removeRestrictedAction(item)} className="cursor-pointer" style={{ color: "var(--color-danger)" }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

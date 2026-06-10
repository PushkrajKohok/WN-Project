"use client";

import { CheckCircle, HelpCircle, RefreshCw, Settings } from "lucide-react";
import type { IngestionFrequencySetting } from "@/types/data";

type Props = {
  isSaving: boolean;
  selectedFrequency: string;
  settings: IngestionFrequencySetting;
  onChange: (value: string) => void;
  onSave: () => void;
  saveState: "idle" | "success" | "error";
};

export function IngestionFrequencyBar({
  isSaving,
  selectedFrequency,
  settings,
  onChange,
  onSave,
  saveState,
}: Props) {
  return (
    <section className="glass-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Settings size={18} style={{ color: "var(--color-accent)" }} />
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Ingestion Frequency
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        <div className="flex flex-wrap gap-1.5 lg:col-span-1">
          {settings.options.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className="px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all"
              style={{
                background:
                  selectedFrequency === option.value
                    ? "var(--color-accent)"
                    : "var(--color-bg-tertiary)",
                color:
                  selectedFrequency === option.value
                    ? "white"
                    : "var(--color-text-secondary)",
                border: `1px solid ${
                  selectedFrequency === option.value
                    ? "var(--color-accent)"
                    : "var(--color-border)"
                }`,
              }}
            >
              {option.label}
            </button>
          ))}
          <button onClick={onSave} disabled={isSaving} className="btn btn-secondary btn-sm">
            {isSaving ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : (
              <CheckCircle size={13} />
            )}
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
            <span className="font-semibold text-white">
              Why {settings.frequency_label}?
            </span>{" "}
            {settings.reason}
            {saveState === "success" ? (
              <span className="block mt-2" style={{ color: "var(--color-success)" }}>
                Saved successfully.
              </span>
            ) : null}
            {saveState === "error" ? (
              <span className="block mt-2" style={{ color: "var(--color-danger)" }}>
                Save failed. The page kept the last available setting.
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}


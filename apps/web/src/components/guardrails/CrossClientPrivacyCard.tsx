"use client";

import { Lock } from "lucide-react";
import type { GuardrailSettings, PrivacyMode } from "@/types/guardrails";

const explanations: Record<PrivacyMode, string> = {
  aggregated_only: "Safest mode. Only cohort-level benchmark patterns can be used.",
  k_anonymized: "Allows cohorts only when enough clients support the pattern.",
  internal_firewalled: "Internal teams can see more detail, while raw customer data remains isolated.",
};

const shared = ["benchmark lift", "confidence", "sample size", "category/spend-band pattern"];
const firewalled = ["raw customer records", "exact customer lists", "credentials", "raw campaign data", "client-specific private playbooks"];

export function CrossClientPrivacyCard({ settings, onChange }: { settings: GuardrailSettings; onChange: (patch: Partial<GuardrailSettings>) => void }) {
  return (
    <section className="glass-card p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold"><Lock size={18} style={{ color: "var(--color-accent)" }} /> Cross-Client Privacy</h2>
      <select value={settings.cross_client_privacy_mode} onChange={(event) => onChange({ cross_client_privacy_mode: event.target.value as PrivacyMode })} className="mt-4 w-full rounded-lg border px-3 py-2 text-sm" style={fieldStyle}>
        <option value="aggregated_only">Aggregated only</option>
        <option value="k_anonymized">K-anonymized</option>
        <option value="internal_firewalled">Internal firewalled</option>
      </select>
      <p className="mt-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>{explanations[settings.cross_client_privacy_mode]}</p>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <List title="Shared" items={shared} />
        <List title="Firewalled" items={firewalled} />
      </div>
    </section>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
      <div className="text-sm font-semibold">{title}</div>
      <ul className="mt-2 space-y-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
        {items.map((item) => <li key={item}>- {item}</li>)}
      </ul>
    </div>
  );
}

const fieldStyle = { background: "var(--color-bg-tertiary)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" };

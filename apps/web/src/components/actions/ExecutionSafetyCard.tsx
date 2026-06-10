"use client";

import { ShieldAlert } from "lucide-react";

const principles = [
  "No external API calls in demo",
  "Human approval before high-risk actions",
  "Every action logged",
  "Rollback path required for execution",
  "Risk guardrails block unsafe actions",
];

export function ExecutionSafetyCard() {
  return (
    <section className="glass-card p-5">
      <div className="flex items-center gap-2">
        <ShieldAlert size={18} style={{ color: "var(--color-accent)" }} />
        <h2 className="text-sm font-semibold">Execution Safety</h2>
      </div>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
        This demo does not call Meta or Google Ads APIs. Action Executor simulates execution and rollback while preserving the production control design: approval, audit log, rollback plan, and agent trace.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-5">
        {principles.map((item) => (
          <div key={item} className="rounded-lg border p-3 text-xs font-semibold" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}

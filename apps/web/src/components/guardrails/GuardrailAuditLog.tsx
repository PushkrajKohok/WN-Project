"use client";

import { timeAgo } from "@/lib/utils";
import type { GuardrailAuditLogItem } from "@/types/guardrails";

export function GuardrailAuditLog({ items }: { items: GuardrailAuditLogItem[] }) {
  return (
    <section className="glass-card p-5">
      <h2 className="text-sm font-semibold">Guardrail Audit Log</h2>
      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <div key={item.log_id} className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold">{item.agent_name}</span>
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{item.created_at ? timeAgo(item.created_at) : "recent"}</span>
            </div>
            <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>{item.message}</p>
          </div>
        ))}
        {items.length === 0 && <div className="text-sm" style={{ color: "var(--color-text-secondary)" }}>No guardrail audit logs yet.</div>}
      </div>
    </section>
  );
}

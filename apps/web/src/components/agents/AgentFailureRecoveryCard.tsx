"use client";

const items = [
  "Retry failed source syncs before creating recommendations.",
  "Block recommendations when data freshness or schema drift checks fail.",
  "Escalate high-risk or low-confidence recommendations to Human Interface.",
  "Keep rollback snapshots before execution.",
  "Log every action, decision, and recovery event as public operational activity.",
];

export function AgentFailureRecoveryCard() {
  return (
    <section className="glass-card p-5">
      <h2 className="text-sm font-semibold">Failure Recovery</h2>
      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <div key={item} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}

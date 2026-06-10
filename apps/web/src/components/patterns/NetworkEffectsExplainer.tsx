"use client";

export function NetworkEffectsExplainer() {
  return (
    <section className="glass-card p-5">
      <h2 className="text-sm font-semibold">Network Effects</h2>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
        Every new client improves the system by adding anonymized outcomes to the benchmark layer. WasteNot can learn that a strategy worked for Beauty brands at $50k-$100k spend without exposing raw customer lists, revenue records, or client-specific playbooks.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Info title="Shared" text="Anonymized benchmark outcomes, strategy lift, confidence, sample size." />
        <Info title="Firewalled" text="Customer-level records, raw order data, campaign credentials, exact client lists." />
        <Info title="Used for recommendations" text="Similar-brand matching, benchmark support, confidence calibration." />
      </div>
    </section>
  );
}

function Info({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
      <div className="text-sm font-semibold">{title}</div>
      <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>{text}</p>
    </div>
  );
}

"use client";

const shared = ["Aggregated benchmark lift", "Anonymized cohort IDs", "Strategy performance ranges", "Confidence and sample size", "Category/spend-band patterns"];
const firewalled = ["Customer PII", "Raw order records", "Raw campaign credentials", "Exact customer lists", "Client-specific private playbooks", "Non-aggregated revenue records"];

export function PrivacyBoundaryCard() {
  return (
    <section className="glass-card p-5">
      <h2 className="text-sm font-semibold">Privacy Boundary</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <List title="Allowed cross-client sharing" items={shared} tone="success" />
        <List title="Must remain firewalled" items={firewalled} tone="danger" />
      </div>
    </section>
  );
}

function List({ title, items, tone }: { title: string; items: string[]; tone: "success" | "danger" }) {
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: tone === "success" ? "var(--color-success)" : "var(--color-danger)" }}>
      <div className="text-sm font-semibold" style={{ color: tone === "success" ? "var(--color-success)" : "var(--color-danger)" }}>{title}</div>
      <ul className="mt-3 space-y-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
        {items.map((item) => <li key={item}>- {item}</li>)}
      </ul>
    </div>
  );
}

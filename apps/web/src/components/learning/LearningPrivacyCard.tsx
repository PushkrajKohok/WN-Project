"use client";

const shared = ["aggregated strategy outcomes", "learning scores", "benchmark confidence", "anonymized category/spend-band patterns"];
const firewalled = ["raw customer data", "exact customer lists", "private campaign credentials", "raw client revenue records"];

export function LearningPrivacyCard() {
  return (
    <section className="glass-card p-5">
      <h2 className="text-sm font-semibold">Learning Privacy Boundary</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <List title="Shared into cross-client intelligence" items={shared} />
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

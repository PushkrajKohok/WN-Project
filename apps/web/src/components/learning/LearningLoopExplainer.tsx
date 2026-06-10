"use client";

const flow = [
  "Recommendation generated",
  "Human approves/rejects",
  "Action executed or rolled back",
  "Outcome measured",
  "Learning event created",
  "RAG memory updated",
  "Benchmark/graph confidence updated",
  "Future recommendations improve",
];

export function LearningLoopExplainer() {
  return (
    <section className="glass-card p-5">
      <h2 className="text-sm font-semibold">Recursive Learning Flow</h2>
      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-4 xl:grid-cols-8">
        {flow.map((step, index) => (
          <div key={step} className="rounded-lg border p-3 text-xs font-semibold" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
            <div className="mb-2 text-[10px]" style={{ color: "var(--color-accent)" }}>Step {index + 1}</div>
            {step}
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
        This demo simulates recursive learning with deterministic database updates rather than real model retraining.
      </p>
    </section>
  );
}

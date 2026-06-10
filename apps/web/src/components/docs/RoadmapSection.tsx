"use client";

const phases = [
  {
    title: "Days 0-30: Recommendation MVP",
    items: [
      "Ingest synthetic and real client data",
      "Build dashboard and recommendation queue",
      "Attach SQL, RAG, and graph evidence",
      "Keep human approval only",
      "Apply conservative guardrail defaults",
    ],
  },
  {
    title: "Days 31-60: Guarded Execution",
    items: [
      "Add Action Executor workflow",
      "Support low-risk audience refresh simulation or first real connector",
      "Maintain audit log and rollback plan",
      "Expose Agent Workbench run visibility",
      "Block stale data before recommendations",
    ],
  },
  {
    title: "Days 61-90: Recursive Intelligence",
    items: [
      "Run learning loop from outcomes",
      "Update benchmark confidence",
      "Weight graph edges by measured results",
      "Write RAG memory updates",
      "Enable limited auto-execution for high-confidence, low-risk actions",
    ],
  },
];

export function RoadmapSection() {
  return (
    <section id="roadmap" className="glass-card p-6">
      <h2 className="text-xl font-bold">90-Day Roadmap</h2>
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {phases.map((phase) => (
          <div key={phase.title} className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
            <h3 className="text-sm font-semibold">{phase.title}</h3>
            <ul className="mt-3 space-y-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
              {phase.items.map((item) => <li key={item}>- {item}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

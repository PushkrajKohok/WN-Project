"use client";

const nodes = [
  "Data Sources",
  "Ingestion Layer",
  "Postgres/Supabase Store",
  "RAG Documents",
  "Knowledge Graph Edges",
  "Orchestrator",
  "Data Scout",
  "Pattern Miner",
  "Recommendation Engine",
  "Evidence + Risk Grader",
  "Human Interface / Action Executor",
  "Audit + Learning Loop",
];

export function ArchitectureDiagram() {
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
        {nodes.map((node, index) => (
          <div key={node} className="rounded-lg border px-3 py-3 text-center text-xs font-semibold" style={{ borderColor: "var(--color-border)", background: index >= 6 && index <= 10 ? "var(--color-accent-subtle)" : "var(--color-bg-card)" }}>
            {node}
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs" style={{ color: "var(--color-text-secondary)" }}>
        Flow: sources to ingestion to shared memory, then agent orchestration, evidence validation, human/action boundary, audit, and recursive learning.
      </p>
    </div>
  );
}

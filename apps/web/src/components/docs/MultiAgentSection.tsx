"use client";

const agents = [
  ["Data Scout", "Monitors freshness, schema drift, campaign performance, and anomalies."],
  ["Pattern Miner", "Retrieves cross-client benchmarks, graph edges, and similar-client strategies."],
  ["Recommendation Engine", "Creates optimization suggestions with expected savings, confidence, and risk."],
  ["Evidence + Risk Grader", "Validates SQL/RAG/graph evidence, applies guardrails, and decides if review is required."],
  ["Human Interface", "Explains recommendations, approval requirements, and decision context."],
  ["Action Executor", "Simulates approved execution and rollback; production would call Meta/Google APIs."],
];

export function MultiAgentSection() {
  return (
    <section id="multi-agent" className="glass-card p-6">
      <h2 className="text-xl font-bold">Multi-Agent Architecture</h2>
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        {agents.map(([name, text]) => (
          <div key={name} className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
            <h3 className="text-sm font-semibold">{name}</h3>
            <p className="mt-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>{text}</p>
          </div>
        ))}
      </div>
      <p className="mt-5 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
        The `/agents` workbench shows public agent status, logs, run steps, and scan simulation. Agents communicate through structured task payloads, shared Postgres memory, recommendation IDs, evidence references, logs, and run steps. Risk Grader overrides unsafe actions, fresh client data beats broad patterns, high-risk or low-confidence items escalate to humans, and rollback unavailable blocks execution.
      </p>
    </section>
  );
}

"use client";

const toolCalls = [
  ["SQL performance scan", "Reads campaign, adset, spend, ROAS, CPA, purchases, frequency, and schema drift signals."],
  ["GraphRAG benchmark lookup", "Matches anonymized cohort benchmarks and knowledge graph edges for similar brands."],
  ["RAG document retrieval", "Retrieves public evidence chunks from recommendation, client, and campaign documents."],
  ["Guardrail validation", "Checks confidence thresholds, risk level, approval rules, and rollback readiness."],
  ["Approval workflow", "Queues material changes for human review and records public decisions."],
  ["Execution queue", "Holds approved actions until a future platform execution prompt connects external APIs."],
];

export function AgentToolCallCard() {
  return (
    <section className="glass-card p-5">
      <h2 className="text-sm font-semibold">Public Tool Calls</h2>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {toolCalls.map(([title, detail]) => (
          <div key={title} className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)" }}>
            <div className="text-sm font-semibold">{title}</div>
            <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>{detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

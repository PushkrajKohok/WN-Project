"use client";

const settings = [
  ["Embedding mode", "simulated keyword/semantic scoring"],
  ["Vector DB", "pgvector-ready, not active yet"],
  ["Chunk source", "rag_documents"],
  ["Retrieval strategy", "SQL + document scoring + graph edges"],
  ["Safety", "corrective evidence scoring"],
];

export function RagSettingsCard() {
  return (
    <section className="glass-card p-5">
      <h2 className="text-sm font-semibold">RAG Settings</h2>
      <div className="mt-4 space-y-2">
        {settings.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
            <span style={{ color: "var(--color-text-secondary)" }}>{label}</span>
            <span className="font-semibold text-right">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

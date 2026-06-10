"use client";

import { CheckCircle2 } from "lucide-react";

const checklist = [
  "Architecture diagram included",
  "Data ingestion explained",
  "Multi-agent topology explained",
  "RAG reasoning explained",
  "Hallucination prevention explained",
  "Guardrails explained",
  "Network effects memo included",
  "90-day roadmap included",
  "Synthetic data and README documented",
  "Deployment plan documented",
];

export function SubmissionChecklist() {
  return (
    <section className="glass-card p-6">
      <h2 className="text-xl font-bold">Submission Checklist</h2>
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        {checklist.map((item) => (
          <div key={item} className="flex items-center gap-3 rounded-lg border p-3 text-sm" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
            <CheckCircle2 size={16} style={{ color: "var(--color-success)" }} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

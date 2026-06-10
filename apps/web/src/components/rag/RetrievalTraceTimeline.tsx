"use client";

import type { RetrievalTraceStep } from "@/types/rag";

export function RetrievalTraceTimeline({ steps }: { steps: RetrievalTraceStep[] }) {
  return (
    <section className="glass-card p-5">
      <h2 className="text-sm font-semibold">Public Retrieval Trace</h2>
      <div className="mt-4 space-y-3">
        {steps.map((step) => (
          <div key={step.step} className="flex gap-3">
            <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: "var(--color-accent-subtle)", color: "var(--color-accent)" }}>{step.step}</div>
            <div>
              <div className="text-sm font-semibold">{step.retriever}</div>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{step.summary}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

"use client";

import { timeAgo } from "@/lib/utils";
import type { LearningEvent } from "@/types/learning";

export function LearningEventsTimeline({ events }: { events: LearningEvent[] }) {
  return (
    <section className="glass-card p-5">
      <h2 className="text-sm font-semibold">Learning Events</h2>
      <div className="mt-4 space-y-3">
        {events.map((event) => (
          <div key={event.event_id} className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
            <div className="flex flex-wrap justify-between gap-2">
              <div className="text-sm font-semibold">{event.strategy}</div>
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{event.created_at ? timeAgo(event.created_at) : "recent"}</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>
              <span>{event.client_id}</span>
              <span>{event.platform}</span>
              <span>{event.outcome_type}</span>
              <span>expected {pct(event.expected_impact_pct)}</span>
              <span>actual {pct(event.actual_impact_pct)}</span>
              <span>confidence {pct(event.confidence_before)} to {pct(event.confidence_after)}</span>
            </div>
            <p className="mt-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>{event.learning_summary}</p>
          </div>
        ))}
        {events.length === 0 && <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>No learning events yet.</p>}
      </div>
    </section>
  );
}

function pct(value?: number | null) {
  return value == null ? "-" : `${(value * 100).toFixed(1)}%`;
}

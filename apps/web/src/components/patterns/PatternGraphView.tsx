"use client";

import { ArrowRight, GitBranch, Network } from "lucide-react";
import type { PatternGraphResponse } from "@/types/patterns";

export function PatternGraphView({ graph }: { graph: PatternGraphResponse }) {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  return (
    <section className="glass-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Network size={16} style={{ color: "var(--color-accent)" }} /> GraphRAG Pattern Map
          </h2>
          <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            Edges are anonymized before display; raw client nodes are never named.
          </p>
        </div>
        <span className="badge badge-accent flex items-center gap-1">
          <GitBranch size={12} /> {graph.edges.length} edges
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.4fr]">
        <div className="max-h-[360px] overflow-y-auto rounded-lg border p-3" style={{ borderColor: "var(--color-border)" }}>
          <div className="mb-2 text-xs font-semibold uppercase" style={{ color: "var(--color-text-muted)" }}>Nodes</div>
          <div className="space-y-2">
            {graph.nodes.map((node) => (
              <div key={node.id} className="rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
                <div className="text-sm font-semibold">{node.label}</div>
                <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{node.type}</div>
              </div>
            ))}
            {graph.nodes.length === 0 && <Empty text="No graph nodes match the current filters." />}
          </div>
        </div>

        <div className="max-h-[360px] overflow-y-auto rounded-lg border p-3" style={{ borderColor: "var(--color-border)" }}>
          <div className="mb-2 text-xs font-semibold uppercase" style={{ color: "var(--color-text-muted)" }}>Relationships</div>
          <div className="space-y-2">
            {graph.edges.map((edge) => (
              <div key={edge.id} className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-tertiary)" }}>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold">{nodeById.get(edge.source)?.label || edge.source}</span>
                  <ArrowRight size={14} style={{ color: "var(--color-text-muted)" }} />
                  <span className="badge badge-info">{edge.relationship}</span>
                  <ArrowRight size={14} style={{ color: "var(--color-text-muted)" }} />
                  <span className="font-semibold">{nodeById.get(edge.target)?.label || edge.target}</span>
                </div>
                <div className="mt-2 flex gap-4 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  <span>weight {edge.weight.toFixed(2)}</span>
                  <span>evidence {edge.evidence_count}</span>
                </div>
              </div>
            ))}
            {graph.edges.length === 0 && <Empty text="No graph relationships are available yet." />}
          </div>
        </div>
      </div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-lg border p-4 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
      {text}
    </div>
  );
}

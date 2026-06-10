"use client";

import { useEffect, useState } from "react";
import {
  Network,
  Award,
  Lock,
  Search,
  ArrowRight,
} from "lucide-react";
import {
  mockKnowledgeGraphEdges,
  mockPatterns,
  type KnowledgeGraphEdge,
  type Pattern,
} from "@/lib/mock-data";
import { apiGet } from "@/lib/api";

export default function PatternsPage() {
  const [patterns, setPatterns] = useState<Pattern[]>(mockPatterns);
  const [edges, setEdges] = useState<KnowledgeGraphEdge[]>(mockKnowledgeGraphEdges);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    apiGet<{ patterns: Pattern[]; knowledge_graph_edges: KnowledgeGraphEdge[] }>("/patterns", {
      patterns: mockPatterns,
      knowledge_graph_edges: mockKnowledgeGraphEdges,
    }).then((result) => {
      setPatterns(result.patterns);
      setEdges(result.knowledge_graph_edges);
    });
  }, []);

  const filteredPatterns = patterns.filter(
    (p) =>
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.strategy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Find edges related to the selected node
  const relatedEdges = edges.filter(
    (edge) =>
      !selectedNode ||
      edge.source.toLowerCase().includes(selectedNode.toLowerCase()) ||
      edge.target.toLowerCase().includes(selectedNode.toLowerCase())
  );

  // Get list of unique nodes for selection filtering
  const uniqueNodes = Array.from(
    new Set([
      ...edges.map((e) => e.source),
      ...edges.map((e) => e.target),
    ])
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold gradient-text">Cross-Client Pattern Explorer</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
          Browse anonymized vertical benchmarks and discover network-effect strategies across the GraphRAG layer
        </p>
      </div>

      {/* Benchmarks Grid */}
      <div className="glass-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-sm font-semibold text-white">Anonymized Vertical Benchmarks</h2>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ background: "var(--color-bg-tertiary)", borderColor: "var(--color-border)" }}>
            <Search size={14} style={{ color: "var(--color-text-muted)" }} />
            <input
              type="text"
              placeholder="Search category or strategy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs outline-none"
              style={{ color: "var(--color-text-primary)" }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Spend Band</th>
                <th>Strategy / Pattern</th>
                <th>Avg. Lift</th>
                <th>Sample Size</th>
                <th>Confidence</th>
                <th>Privacy Level</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatterns.map((pat) => (
                <tr key={pat.id} className="hover:bg-accent-subtle">
                  <td className="font-semibold text-white">{pat.category}</td>
                  <td style={{ color: "var(--color-text-secondary)" }}>{pat.spend_band}</td>
                  <td style={{ color: "var(--color-text-secondary)" }} className="max-w-[300px] truncate" title={pat.strategy}>
                    {pat.strategy}
                  </td>
                  <td style={{ color: "var(--color-success)" }} className="font-bold">
                    +{pat.avg_lift}%
                  </td>
                  <td style={{ color: "var(--color-text-secondary)" }}>{pat.sample_size} brands</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-12 h-1.5 rounded-full overflow-hidden"
                        style={{ background: "var(--color-bg-tertiary)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pat.confidence * 100}%`,
                            background: "var(--color-accent)",
                          }}
                        />
                      </div>
                      <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        {(pat.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-accent flex items-center gap-1">
                      <Lock size={10} /> {pat.privacy_level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Graph Relationships / Edges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Node Explorer */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Network size={18} style={{ color: "var(--color-accent)" }} />
            <h2 className="text-sm font-semibold text-white">GraphRAG Node Explorer</h2>
          </div>
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            Select a entity node to trace relationship paths, playbooks, and compliance constraints in the knowledge graph.
          </p>

          <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
            <button
              onClick={() => setSelectedNode(null)}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all border"
              style={{
                background: selectedNode === null ? "var(--color-accent-subtle)" : "var(--color-bg-tertiary)",
                color: selectedNode === null ? "var(--color-accent)" : "var(--color-text-secondary)",
                borderColor: selectedNode === null ? "var(--color-accent)" : "var(--color-border)",
              }}
            >
              Clear Selection (Show All Edges)
            </button>
            {uniqueNodes.map((node) => (
              <button
                key={node}
                onClick={() => setSelectedNode(node)}
                className="w-full text-left px-3 py-2 rounded-lg text-xs transition-all cursor-pointer border hover:border-accent"
                style={{
                  background: selectedNode === node ? "var(--color-accent-subtle)" : "var(--color-bg-tertiary)",
                  color: selectedNode === node ? "var(--color-accent)" : "var(--color-text-secondary)",
                  borderColor: selectedNode === node ? "var(--color-accent)" : "var(--color-border-subtle)",
                }}
              >
                {node}
              </button>
            ))}
          </div>
        </div>

        {/* Relationship Edges Visualizer */}
        <div className="lg:col-span-2 glass-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Award size={18} style={{ color: "var(--color-accent)" }} />
            <h2 className="text-sm font-semibold text-white">
              Knowledge Graph Relationships ({relatedEdges.length})
            </h2>
          </div>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {relatedEdges.map((edge, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg border text-xs"
                style={{ background: "var(--color-bg-tertiary)", borderColor: "var(--color-border-subtle)" }}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="font-semibold text-white truncate max-w-[150px]">{edge.source}</span>
                  <ArrowRight size={14} style={{ color: "var(--color-text-muted)" }} />
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider" style={{ background: "var(--color-accent-subtle)", color: "var(--color-accent)" }}>
                    {edge.relation}
                  </span>
                  <ArrowRight size={14} style={{ color: "var(--color-text-muted)" }} />
                  <span className="font-semibold text-white truncate max-w-[180px]">{edge.target}</span>
                </div>

                <div className="flex items-center gap-2 pl-3">
                  <span style={{ color: "var(--color-text-muted)" }}>weight</span>
                  <span className="font-bold" style={{ color: "var(--color-success)" }}>
                    {edge.weight.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

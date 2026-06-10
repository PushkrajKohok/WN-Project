"use client";

import { useState } from "react";
import type { RecommendationDetailResponse } from "@/types/evidence";
import { AgentTraceTimeline } from "./AgentTraceTimeline";
import { GraphEvidenceCard } from "./GraphEvidenceCard";
import { RagEvidenceCard } from "./RagEvidenceCard";
import { RelatedHistoryCard } from "./RelatedHistoryCard";
import { RiskValidationCard } from "./RiskValidationCard";
import { RollbackPlanCard } from "./RollbackPlanCard";
import { SqlEvidenceCard } from "./SqlEvidenceCard";

const tabs = [
  "SQL Evidence",
  "GraphRAG Evidence",
  "RAG Documents",
  "Risk Validation",
  "Agent Trace",
  "Rollback Plan",
] as const;

type Tab = (typeof tabs)[number];

export function EvidenceDrawer({ detail }: { detail: RecommendationDetailResponse }) {
  const [active, setActive] = useState<Tab>("SQL Evidence");

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto rounded-lg border p-2" style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)" }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className="rounded-md px-3 py-2 text-sm whitespace-nowrap"
            style={{
              background: active === tab ? "var(--color-accent)" : "var(--color-bg-tertiary)",
              color: active === tab ? "white" : "var(--color-text-secondary)",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {active === "SQL Evidence" && <SqlEvidenceCard evidence={detail.evidence.sql_evidence} />}
      {active === "GraphRAG Evidence" && <GraphEvidenceCard evidence={detail.evidence.graph_evidence} />}
      {active === "RAG Documents" && <RagEvidenceCard evidence={detail.evidence.rag_evidence} />}
      {active === "Risk Validation" && <RiskValidationCard validation={detail.risk_validation} />}
      {active === "Agent Trace" && <AgentTraceTimeline steps={detail.agent_trace} />}
      {active === "Rollback Plan" && (
        <div className="space-y-4">
          <RollbackPlanCard plan={detail.rollback_plan} />
          <RelatedHistoryCard actions={detail.related_history} />
        </div>
      )}
    </div>
  );
}

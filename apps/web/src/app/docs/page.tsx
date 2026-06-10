"use client";

import Link from "next/link";
import { ArchitectureOverview } from "@/components/docs/ArchitectureOverview";
import { DataIngestionSection } from "@/components/docs/DataIngestionSection";
import { DeploymentReadiness } from "@/components/docs/DeploymentReadiness";
import { DocsHero } from "@/components/docs/DocsHero";
import { ImplementedVsSimulated } from "@/components/docs/ImplementedVsSimulated";
import { MultiAgentSection } from "@/components/docs/MultiAgentSection";
import { NetworkEffectsMemo } from "@/components/docs/NetworkEffectsMemo";
import { RagReasoningSection } from "@/components/docs/RagReasoningSection";
import { RoadmapSection } from "@/components/docs/RoadmapSection";
import { SubmissionChecklist } from "@/components/docs/SubmissionChecklist";

export default function DocsPage() {
  return (
    <div className="space-y-6">
      <DocsHero />

      <section id="overview" className="glass-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Project Overview</h2>
            <p className="mt-3 max-w-4xl text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              WasteNot ingests Shopify, Klaviyo, Meta, Google Ads, Snowflake, and Postgres-style data to assemble decision context for ad optimization. The system builds targeting and exclusion recommendations that reduce wasted spend and improve contribution margin. This app demonstrates a path from reactive human-in-the-loop optimization to an always-on intelligence layer through synthetic data, agent simulation, RAG evidence, graph benchmarks, guardrails, and recursive learning.
            </p>
          </div>
          <Link href="/dashboard" className="btn btn-secondary">Open Dashboard</Link>
        </div>
      </section>

      <ArchitectureOverview />
      <DataIngestionSection />
      <MultiAgentSection />
      <RagReasoningSection />
      <NetworkEffectsMemo />
      <RoadmapSection />
      <DeploymentReadiness />
      <ImplementedVsSimulated />
      <SubmissionChecklist />
    </div>
  );
}

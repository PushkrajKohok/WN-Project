"use client";

export const memoText = `WasteNot's intelligence layer becomes more valuable with every client because each optimization creates a reusable learning signal. Today, a recommendation may be based on one brand's Shopify orders, Klaviyo lifecycle events, Meta/Google campaign performance, audience exclusions, and prior WasteNot actions. Over time, those individual decisions become anonymized benchmarks: which strategies worked, for which brand categories, at which spend bands, with what lift, risk, and rollback rate.

The key network effect is not sharing raw client data. It is sharing structured learning. Customer-level records, raw order history, ad account credentials, exact customer lists, and client-specific playbooks must remain firewalled. What can safely cross the client boundary are aggregated outcomes: strategy type, category, spend band, sample size, confidence, average lift, rollback frequency, and privacy-safe cohort identifiers. For example, the system can learn that "Beauty brands spending $50k-$100k/month often reduce wasted spend by excluding 30-day purchasers from prospecting" without exposing any individual brand's customers or revenue records.

This creates a compounding advantage. A new client initially benefits from patterns discovered across similar existing clients. As that client approves recommendations and the system measures outcomes, their results feed back into the benchmark layer, graph relationships, RAG memory, and future confidence scoring. Strong outcomes increase confidence for similar future recommendations; failed or rolled-back actions reduce confidence and trigger stricter review. The system therefore becomes both smarter and safer as usage grows.

The one metric I would use to prove this layer is working is incremental contribution-margin lift from recommendations accepted by the system, net of rollbacks. This captures more than ROAS; it measures whether WasteNot is reducing wasted spend in a way that improves profitable growth.

A realistic 90-day plan starts with a recommendation-only MVP in the first 30 days: ingestion, dashboard, RAG evidence, and human approval. Days 31-60 add guarded execution for low-risk audience refreshes, agent logs, rollback tracking, and benchmark updates. Days 61-90 add recursive learning, confidence recalibration, privacy-safe cross-client pattern scoring, and limited auto-execution for high-confidence, low-risk optimizations.`;

export function NetworkEffectsMemo() {
  return (
    <section id="network-effects" className="glass-card p-6">
      <h2 className="text-xl font-bold">How an Always-On Intelligence Layer Creates Network Effects Across Our Client Base</h2>
      <div className="mt-4 space-y-4 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
        {memoText.split("\n\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
    </section>
  );
}

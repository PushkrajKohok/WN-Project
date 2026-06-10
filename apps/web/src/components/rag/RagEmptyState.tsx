"use client";

import Link from "next/link";

export function RagEmptyState() {
  return (
    <div className="glass-card p-8 text-center">
      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>No RAG documents found. Generate and ingest synthetic data first.</p>
      <Link href="/data" className="btn btn-primary mt-4">Go to Data & Ingestion Control</Link>
    </div>
  );
}

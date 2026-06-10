"use client";

import { useState } from "react";
import { Check, FileQuestion, X } from "lucide-react";
import type { RecommendationAction, RecommendationRecord } from "@/types/recommendations";

export function RecommendationDecisionPanel({
  recommendation,
  isBusy,
  onAction,
}: {
  recommendation: RecommendationRecord;
  isBusy: boolean;
  onAction: (id: string, action: RecommendationAction, note?: string) => Promise<void>;
}) {
  const [modal, setModal] = useState<Exclude<RecommendationAction, "approve"> | null>(null);
  const canDecide = recommendation.status !== "executed" && recommendation.status !== "dismissed";

  if (!canDecide) return null;

  const submitModal = async (note: string) => {
    if (!modal) return;
    await onAction(recommendation.recommendation_id, modal, note);
    setModal(null);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => onAction(recommendation.recommendation_id, "approve")}
          disabled={isBusy}
          className="btn btn-success btn-sm"
          data-testid={`approve-${recommendation.recommendation_id}`}
        >
          <Check size={14} />
          Approve
        </button>
        <button
          onClick={() => setModal("reject")}
          disabled={isBusy}
          className="btn btn-danger btn-sm"
          data-testid={`reject-${recommendation.recommendation_id}`}
        >
          <X size={14} />
          Reject
        </button>
        <button
          onClick={() => setModal("needs-more-evidence")}
          disabled={isBusy}
          className="btn btn-secondary btn-sm"
          data-testid={`more-evidence-${recommendation.recommendation_id}`}
        >
          <FileQuestion size={14} />
          More Evidence
        </button>
      </div>

      {modal && (
        <DecisionModal
          action={modal}
          title={recommendation.title}
          isBusy={isBusy}
          onCancel={() => setModal(null)}
          onSubmit={submitModal}
        />
      )}
    </>
  );
}

function DecisionModal({
  action,
  title,
  isBusy,
  onCancel,
  onSubmit,
}: {
  action: Exclude<RecommendationAction, "approve">;
  title: string;
  isBusy: boolean;
  onCancel: () => void;
  onSubmit: (note: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const isReject = action === "reject";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="glass-card w-full max-w-lg p-5 shadow-2xl">
        <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
          {isReject ? "Reject recommendation" : "Request more evidence"}
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {title}
        </p>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={4}
          placeholder={isReject ? "Reason for rejection..." : "What evidence should the agent collect next?"}
          className="mt-4 w-full rounded-lg border p-3 text-sm outline-none"
          style={{
            background: "var(--color-bg-tertiary)",
            borderColor: "var(--color-border)",
            color: "var(--color-text-primary)",
          }}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} disabled={isBusy} className="btn btn-secondary" type="button">
            Cancel
          </button>
          <button
            onClick={() => onSubmit(note.trim())}
            disabled={isBusy || note.trim().length === 0}
            className={isReject ? "btn btn-danger" : "btn btn-primary"}
            type="button"
          >
            {isReject ? "Reject" : "Request Evidence"}
          </button>
        </div>
      </div>
    </div>
  );
}

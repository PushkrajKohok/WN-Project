import { cn } from "@/lib/utils";

const statusClass: Record<string, string> = {
  new: "badge-info",
  approved: "badge-low",
  executed: "badge-low",
  dismissed: "badge-muted",
  needs_more_evidence: "badge-medium",
};

const riskClass: Record<string, string> = {
  low: "badge-low",
  medium: "badge-medium",
  high: "badge-high",
};

const decisionClass: Record<string, string> = {
  human_approval: "badge-medium",
  auto_execute_allowed: "badge-low",
};

export function labelize(value: string) {
  if (value === "human_approval") return "Human approval";
  if (value === "auto_execute_allowed") return "Auto-execute eligible";
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function RecommendationStatusBadge({
  value,
  kind,
}: {
  value: string;
  kind: "status" | "risk" | "decision" | "platform";
}) {
  const normalized = value.toLowerCase();
  const className =
    kind === "risk"
      ? riskClass[normalized] || "badge-info"
      : kind === "decision"
        ? decisionClass[normalized] || "badge-accent"
        : kind === "status"
          ? statusClass[normalized] || "badge-info"
          : "badge-accent";

  return <span className={cn("badge", className)}>{labelize(value)}</span>;
}

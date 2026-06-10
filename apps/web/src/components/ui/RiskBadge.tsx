import { StatusBadge } from "./StatusBadge";

export function RiskBadge({ risk }: { risk?: string | null }) {
  const value = risk || "Unknown";
  const normalized = value.toLowerCase();
  const tone = normalized.includes("high")
    ? "danger"
    : normalized.includes("medium")
      ? "warning"
      : normalized.includes("low")
        ? "success"
        : "muted";
  return <StatusBadge label={value} tone={tone} />;
}

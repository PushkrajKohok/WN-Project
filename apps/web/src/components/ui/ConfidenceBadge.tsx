import { StatusBadge } from "./StatusBadge";

export function ConfidenceBadge({ value }: { value?: number | null }) {
  if (value === undefined || value === null) return <StatusBadge label="Confidence unavailable" tone="muted" />;
  const pct = value <= 1 ? Math.round(value * 100) : Math.round(value);
  const tone = pct >= 85 ? "success" : pct >= 70 ? "warning" : "danger";
  return <StatusBadge label={`${pct}% confidence`} tone={tone} />;
}

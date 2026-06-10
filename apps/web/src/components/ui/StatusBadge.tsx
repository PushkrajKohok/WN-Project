type BadgeTone = "success" | "warning" | "danger" | "info" | "accent" | "muted";

const toneClass: Record<BadgeTone, string> = {
  success: "badge-low",
  warning: "badge-medium",
  danger: "badge-high",
  info: "badge-info",
  accent: "badge-accent",
  muted: "badge-muted",
};

export function StatusBadge({ label, tone = "muted" }: { label: string; tone?: BadgeTone }) {
  return <span className={`badge ${toneClass[tone]}`}>{label}</span>;
}

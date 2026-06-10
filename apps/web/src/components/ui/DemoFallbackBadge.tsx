import { StatusBadge } from "./StatusBadge";

export function DemoFallbackBadge({ show = true }: { show?: boolean }) {
  if (!show) return null;
  return <StatusBadge label="Demo fallback mode" tone="info" />;
}

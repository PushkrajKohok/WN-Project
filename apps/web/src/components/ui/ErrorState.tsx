import type { ReactNode } from "react";

export function ErrorState({ title = "Something went wrong", description, action }: { title?: string; description: string; action?: ReactNode }) {
  return (
    <div className="rounded-lg border p-5 text-sm" style={{ borderColor: "var(--color-danger)", background: "var(--color-danger-subtle)" }}>
      <h3 className="font-semibold" style={{ color: "var(--color-danger)" }}>{title}</h3>
      <p className="mt-2" style={{ color: "var(--color-text-secondary)" }}>{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

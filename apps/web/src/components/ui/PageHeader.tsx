import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  badge?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ title, eyebrow, description, badge, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        {eyebrow && (
          <div className="mb-2 text-xs font-semibold uppercase" style={{ color: "var(--color-text-muted)" }}>
            {eyebrow}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold gradient-text">{title}</h1>
          {badge}
        </div>
        {description && (
          <p className="mt-2 max-w-4xl text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

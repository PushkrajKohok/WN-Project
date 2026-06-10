import type { ReactNode } from "react";

type SectionCardProps = {
  id?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function SectionCard({ id, title, description, children, className = "" }: SectionCardProps) {
  return (
    <section id={id} className={`glass-card p-6 ${className}`}>
      {(title || description) && (
        <div className="mb-5">
          {title && <h2 className="text-xl font-bold">{title}</h2>}
          {description && (
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

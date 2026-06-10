export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-12 animate-pulse rounded-lg"
          style={{ background: "var(--color-bg-tertiary)", border: "1px solid var(--color-border)" }}
        />
      ))}
    </div>
  );
}

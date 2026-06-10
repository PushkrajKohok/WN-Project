"use client";

export function ActionStatusBadge({ status }: { status: string }) {
  const badge = statusBadge(status);
  return <span className={`badge ${badge}`}>{status}</span>;
}

export function statusBadge(status: string) {
  switch (status) {
    case "Executed":
      return "badge-low";
    case "Approved":
      return "badge-info";
    case "Generated":
    case "Pending Review":
      return "badge-medium";
    case "Rejected":
      return "badge-high";
    case "Rolled Back":
      return "badge-accent";
    default:
      return "badge-info";
  }
}

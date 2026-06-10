import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function getRiskColor(risk: string): string {
  switch (risk) {
    case "low":
      return "badge-low";
    case "medium":
      return "badge-medium";
    case "high":
      return "badge-high";
    default:
      return "badge-info";
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "pending":
      return "badge-medium";
    case "approved":
    case "auto_approved":
    case "executed":
      return "badge-low";
    case "rejected":
    case "failed":
      return "badge-high";
    case "rolled_back":
      return "badge-info";
    default:
      return "badge-info";
  }
}

export function getAgentStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "bg-success";
    case "idle":
      return "bg-warning";
    case "waiting":
      return "bg-info";
    case "error":
      return "bg-danger";
    default:
      return "bg-text-muted";
  }
}

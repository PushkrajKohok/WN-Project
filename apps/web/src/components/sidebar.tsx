"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Lightbulb,
  Bot,
  Database,
  Network,
  History,
  Shield,
  SearchCode,
  BrainCircuit,
  FileText,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/recommendations", label: "Recommendations", icon: Lightbulb },
  { href: "/agents", label: "Agent Workbench", icon: Bot },
  { href: "/data", label: "Data & Ingestion", icon: Database },
  { href: "/patterns", label: "Cross-Client Patterns", icon: Network },
  { href: "/rag", label: "RAG Retrieval", icon: SearchCode },
  { href: "/learning", label: "Learning Loop", icon: BrainCircuit },
  { href: "/docs", label: "Submission Docs", icon: FileText },
  { href: "/actions", label: "Action Log", icon: History },
  { href: "/guardrails", label: "Guardrails", icon: Shield },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen flex flex-col transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-[260px]"
      }`}
      style={{
        background: "rgba(12, 13, 19, 0.95)",
        backdropFilter: "blur(16px)",
        borderRight: "1px solid var(--color-border)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b" style={{ borderColor: "var(--color-border)" }}>
        <div
          className="flex items-center justify-center w-9 h-9 rounded-lg"
          style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
        >
          <Zap size={20} color="white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col animate-fade-in">
            <span className="text-sm font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
              WasteNot
            </span>
            <span className="text-[10px] font-medium tracking-wider uppercase" style={{ color: "var(--color-text-muted)" }}>
              Intelligence Layer
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                isActive ? "active" : ""
              }`}
              style={{
                color: isActive
                  ? "var(--color-accent)"
                  : "var(--color-text-secondary)",
                background: isActive ? "var(--color-accent-subtle)" : "transparent",
                borderRight: isActive ? "2px solid var(--color-accent)" : "2px solid transparent",
              }}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* System status */}
      {!collapsed && (
        <div className="px-4 py-3 border-t animate-fade-in" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full pulse-dot" style={{ background: "var(--color-success)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
              System Active
            </span>
          </div>
          <div className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
            Last scan: 2 min ago
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 border-t cursor-pointer transition-colors"
        style={{
          borderColor: "var(--color-border)",
          color: "var(--color-text-muted)",
          background: "transparent",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}

"use client";

import { useState } from "react";
import type { ComponentType, CSSProperties } from "react";
import {
  Radar,
  GitBranch,
  Lightbulb,
  ShieldCheck,
  Zap,
  UserCheck,
  Play,
  Terminal,
  RefreshCw,
} from "lucide-react";
import { mockAgents, mockAgentLogs } from "@/lib/mock-data";
import { timeAgo, getAgentStatusColor } from "@/lib/utils";

// Map icon strings to components
const iconMap: Record<string, ComponentType<{ size?: number; style?: CSSProperties; className?: string }>> = {
  Radar: Radar,
  GitBranch: GitBranch,
  Lightbulb: Lightbulb,
  ShieldCheck: ShieldCheck,
  Zap: Zap,
  UserCheck: UserCheck,
};

export default function AgentWorkbenchPage() {
  const [agents] = useState(mockAgents);
  const [logs, setLogs] = useState(mockAgentLogs);
  const [isScanning, setIsScanning] = useState(false);

  const triggerScan = async () => {
    setIsScanning(true);
    // Add temporary scan start log
    const newLog = {
      id: `log-temp-${Date.now()}`,
      agent: "Human Interface",
      message: "Manual agent scan cycle triggered via workbench console.",
      level: "info" as const,
      ts: new Date().toISOString(),
    };
    setLogs((prev) => [newLog, ...prev]);

    // Simulate agent scan stages
    setTimeout(() => {
      setLogs((prev) => [
        {
          id: `log-temp-${Date.now() + 1}`,
          agent: "Data Scout",
          message: "Scanned Google Ads API. Ingested 4,200 new keywords across 12 campaign ad sets.",
          level: "info" as const,
          ts: new Date().toISOString(),
        },
        ...prev,
      ]);
    }, 1500);

    setTimeout(() => {
      setLogs((prev) => [
        {
          id: `log-temp-${Date.now() + 2}`,
          agent: "Pattern Miner",
          message: "Cross-referenced campaign bid limits. Found 3 matches in similar verticals.",
          level: "success" as const,
          ts: new Date().toISOString(),
        },
        ...prev,
      ]);
    }, 3000);

    setTimeout(() => {
      setLogs((prev) => [
        {
          id: `log-temp-${Date.now() + 3}`,
          agent: "Evidence & Risk Grader",
          message: "Recommendation grade: A (Confidence: 0.94). Risk level set to LOW.",
          level: "info" as const,
          ts: new Date().toISOString(),
        },
        ...prev,
      ]);
      setIsScanning(false);
    }, 4500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Agent Workbench</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            Monitor and orchestrate autonomous AI agents scanning the intelligence layer
          </p>
        </div>
        <button
          onClick={triggerScan}
          disabled={isScanning}
          className="btn btn-primary"
        >
          {isScanning ? (
            <>
              <RefreshCw size={16} className="animate-spin" /> Scanning...
            </>
          ) : (
            <>
              <Play size={16} /> Run Scan Cycle
            </>
          )}
        </button>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => {
          const Icon = iconMap[agent.icon] || Radar;
          return (
            <div key={agent.id} className="glass-card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-lg"
                    style={{ background: "var(--color-bg-tertiary)" }}
                  >
                    <Icon size={20} style={{ color: "var(--color-accent)" }} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        agent.status === "active" ? "bg-success pulse-dot" : getAgentStatusColor(agent.status)
                      }`}
                    />
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>
                      {agent.status}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
                  {agent.name}
                </h3>
                <p className="text-xs" style={{ color: "var(--color-text-secondary)", minHeight: "2.5rem" }}>
                  {agent.role}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--color-border-subtle)" }}>
                <div className="flex justify-between items-center text-xs">
                  <span style={{ color: "var(--color-text-muted)" }}>Tasks Completed</span>
                  <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
                    {agent.tasks_completed}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs mt-1">
                  <span style={{ color: "var(--color-text-muted)" }}>Last Activity</span>
                  <span style={{ color: "var(--color-text-secondary)" }}>
                    {timeAgo(agent.last_run)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Logs */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Terminal size={18} style={{ color: "var(--color-accent)" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Live Agent Operations Log (Concise Backend Activity Only)
          </h2>
        </div>

        <div
          className="h-[300px] overflow-y-auto p-4 rounded-lg space-y-3 font-mono text-xs border"
          style={{
            background: "var(--color-bg-primary)",
            borderColor: "var(--color-border)",
          }}
        >
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 border-b border-dashed pb-2 last:border-b-0" style={{ borderColor: "var(--color-border-subtle)" }}>
              <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                {new Date(log.ts).toISOString().slice(11, 19)}
              </span>
              <span
                className="font-bold min-w-[120px]"
                style={{
                  color:
                    log.agent === "Data Scout"
                      ? "#3b82f6"
                      : log.agent === "Pattern Miner"
                      ? "#a855f7"
                      : log.agent === "Recommendation Engine"
                      ? "#6366f1"
                      : log.agent === "Evidence & Risk Grader"
                      ? "#f59e0b"
                      : log.agent === "Action Executor"
                      ? "#22c55e"
                      : "#ef4444",
                }}
              >
                [{log.agent}]
              </span>
              <span
                className="flex-1"
                style={{
                  color:
                    log.level === "error"
                      ? "var(--color-danger)"
                      : log.level === "warning"
                      ? "var(--color-warning)"
                      : log.level === "success"
                      ? "var(--color-success)"
                      : "var(--color-text-secondary)",
                }}
              >
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

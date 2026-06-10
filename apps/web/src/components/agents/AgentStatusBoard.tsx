"use client";

import type { AgentStatus } from "@/types/agents";
import { AgentStatusCard } from "./AgentStatusCard";

export function AgentStatusBoard({ agents }: { agents: AgentStatus[] }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Agent Status Board</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => (
          <AgentStatusCard key={agent.agent_name} agent={agent} />
        ))}
      </div>
    </section>
  );
}

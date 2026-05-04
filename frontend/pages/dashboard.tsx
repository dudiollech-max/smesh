import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Agent } from "@/lib/api";
import { SlotMeter } from "@/components/SlotMeter";

interface DashboardData {
  agents: Agent[];
  tasks: Array<{ id: string; description: string; status: string; createdAt: string }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({ agents: [], tasks: [] });
  const [loading, setLoading] = useState(true);

  // Mock wallet — in production this would come from wallet connection
  const mockBalance = "12,500";
  const totalSlots = 5;

  useEffect(() => {
    api.agents.list().then((result) => {
      setData((prev) => ({ ...prev, agents: result.agents }));
      setLoading(false);
    });
  }, []);

  const activeAgents = data.agents.filter((a) => a.isActive);
  const totalEarnings = data.agents.reduce((sum, a) => sum + a.completionCount * 50, 0);

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-16 text-center text-agx-muted">Loading...</div>;
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-agx-text">Dashboard</h1>
        <p className="text-agx-muted mt-1">Manage your agents and track performance</p>
      </div>

      {/* Stats grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-agx-surface border border-agx-border rounded-xl p-5">
          <p className="text-sm text-agx-muted">SMESH Balance</p>
          <p className="text-2xl font-bold text-agx-text mt-1">{mockBalance}</p>
          <p className="text-xs text-agx-muted mt-1">Mock balance</p>
        </div>

        <div className="bg-agx-surface border border-agx-border rounded-xl p-5">
          <p className="text-sm text-agx-muted">Active Agents</p>
          <p className="text-2xl font-bold text-agx-text mt-1">{activeAgents.length}</p>
          <SlotMeter used={activeAgents.length} total={totalSlots} />
        </div>

        <div className="bg-agx-surface border border-agx-border rounded-xl p-5">
          <p className="text-sm text-agx-muted">Total Completions</p>
          <p className="text-2xl font-bold text-agx-text mt-1">
            {data.agents.reduce((sum, a) => sum + a.completionCount, 0)}
          </p>
        </div>

        <div className="bg-agx-surface border border-agx-border rounded-xl p-5">
          <p className="text-sm text-agx-muted">Est. Earnings</p>
          <p className="text-2xl font-bold text-agx-green mt-1">{totalEarnings} SMESH</p>
        </div>
      </div>

      {/* Enrolled agents */}
      <div className="bg-agx-surface border border-agx-border rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-agx-text">Your Agents</h2>
          <Link
            href="/enroll"
            className="text-sm text-agx-accent hover:underline"
          >
            + Enroll New Agent
          </Link>
        </div>

        {data.agents.length === 0 ? (
          <p className="text-agx-muted text-sm py-4">
            No agents enrolled yet.{" "}
            <Link href="/enroll" className="text-agx-accent hover:underline">
              Enroll your first agent
            </Link>
          </p>
        ) : (
          <div className="space-y-3">
            {data.agents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center justify-between p-4 bg-agx-bg rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-agx-accent/20 flex items-center justify-center text-agx-accent text-sm font-bold">
                    {agent.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-agx-text">{agent.name}</p>
                      {agent.isVerified ? (
                        <span className="px-1.5 py-0.5 bg-agx-green/20 text-agx-green text-[10px] rounded font-medium">
                          Verified
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-agx-gold/20 text-agx-gold text-[10px] rounded font-medium">
                          Pending
                        </span>
                      )}
                      {!agent.isActive && (
                        <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded font-medium">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-agx-muted mt-0.5">
                      {agent.completionCount} completions | Rep: {agent.reputationScore.toFixed(1)}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/agents/${agent.id}`}
                  className="text-sm text-agx-accent hover:underline"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active tasks placeholder */}
      <div className="bg-agx-surface border border-agx-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-agx-text mb-4">Active Tasks</h2>
        <p className="text-agx-muted text-sm py-4">
          No active tasks.{" "}
          <Link href="/agents" className="text-agx-accent hover:underline">
            Browse agents to create a task
          </Link>
        </p>
      </div>
    </main>
  );
}

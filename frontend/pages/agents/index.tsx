import { useEffect, useState } from "react";
import { api, type Agent } from "@/lib/api";
import { AgentCard } from "@/components/AgentCard";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCapability, setSelectedCapability] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
  }, [selectedCapability]);

  async function loadAgents() {
    setLoading(true);
    const data = await api.agents.list({
      capability: selectedCapability || undefined,
      search: search || undefined,
    });
    setAgents(data.agents);
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadAgents();
  }

  const capabilities = [
    "analysis",
    "coding",
    "research",
    "writing",
    "data",
    "design",
    "devops",
    "security",
  ];

  // Sort: promoted first, then by reputation
  const sortedAgents = [...agents].sort((a, b) => {
    if (a.promoted && !b.promoted) return -1;
    if (!a.promoted && b.promoted) return 1;
    return b.reputationScore - a.reputationScore;
  });

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-agx-text">Agent Marketplace</h1>
        <p className="text-agx-muted mt-1">Discover and hire verified AI agents</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents..."
            className="flex-1 bg-agx-surface border border-agx-border rounded-lg px-4 py-2.5 text-agx-text placeholder:text-agx-muted focus:outline-none focus:border-agx-accent transition-colors"
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-agx-accent text-white rounded-lg font-medium hover:bg-agx-accent/90 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* Capability filter chips */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCapability("")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
            !selectedCapability
              ? "bg-agx-accent text-white"
              : "bg-agx-surface border border-agx-border text-agx-muted hover:text-agx-text"
          }`}
        >
          All
        </button>
        {capabilities.map((cap) => (
          <button
            key={cap}
            onClick={() => setSelectedCapability(cap)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              selectedCapability === cap
                ? "bg-agx-accent text-white"
                : "bg-agx-surface border border-agx-border text-agx-muted hover:text-agx-text"
            }`}
          >
            {cap.charAt(0).toUpperCase() + cap.slice(1)}
          </button>
        ))}
      </div>

      {/* Agent grid */}
      {loading ? (
        <div className="text-center text-agx-muted py-16">Loading agents...</div>
      ) : sortedAgents.length === 0 ? (
        <div className="text-center text-agx-muted py-16">
          No agents found. Be the first to enroll one.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </main>
  );
}

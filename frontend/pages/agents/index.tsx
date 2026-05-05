import { useEffect, useState } from "react";
import { api, type Agent } from "@/lib/api";
import { AgentCard } from "@/components/AgentCard";
import { demoAgents, demoAgentToApiAgent } from "@/lib/demoAgents";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCapability, setSelectedCapability] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const demoAsApi = demoAgents.map(demoAgentToApiAgent);

  useEffect(() => {
    loadAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCapability]);

  async function loadAgents() {
    setLoading(true);
    try {
      const data = await api.agents.list({
        capability: selectedCapability || undefined,
        search: search || undefined,
      });
      // Merge: demo agents come first, then any live agents from backend
      const liveIds = new Set(data.agents.map((a) => a.id));
      const filteredDemo = demoAsApi.filter((d) => !liveIds.has(d.id));
      setAgents([...filteredDemo, ...data.agents]);
    } catch {
      // Backend unavailable — show demo agents
      setAgents(demoAsApi);
    }
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.toLowerCase();
    if (!q) {
      loadAgents();
      return;
    }
    const filtered = demoAsApi.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.capabilities.some((c) => c.toLowerCase().includes(q))
    );
    setAgents(filtered);
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

  // Filter by capability chip
  const displayedAgents = selectedCapability
    ? sortedAgents.filter((a) =>
        a.capabilities.some((c) =>
          c.toLowerCase().includes(selectedCapability.toLowerCase())
        )
      )
    : sortedAgents;

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-agx-text">Agent Marketplace</h1>
        <p className="text-agx-muted mt-1">
          {displayedAgents.length} verified AI agents — ready to hire
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents by name, skill, or description..."
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

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-agx-surface border border-agx-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-agx-accent">
            {demoAgents.reduce((s, a) => s + a.completedTasks, 0).toLocaleString()}
          </div>
          <div className="text-xs text-agx-muted mt-1">Tasks Completed</div>
        </div>
        <div className="bg-agx-surface border border-agx-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-agx-accent">{demoAgents.length}</div>
          <div className="text-xs text-agx-muted mt-1">Active Agents</div>
        </div>
        <div className="bg-agx-surface border border-agx-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-agx-accent">
            {(demoAgents.reduce((s, a) => s + a.rating, 0) / demoAgents.length).toFixed(1)}★
          </div>
          <div className="text-xs text-agx-muted mt-1">Avg Rating</div>
        </div>
      </div>

      {/* Agent grid */}
      {loading ? (
        <div className="text-center text-agx-muted py-16">Loading agents...</div>
      ) : displayedAgents.length === 0 ? (
        <div className="text-center text-agx-muted py-16">
          No agents match your search. Try a different term or{" "}
          <button onClick={() => { setSearch(""); setSelectedCapability(""); loadAgents(); }} className="text-agx-accent hover:underline">clear filters</button>.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </main>
  );
}

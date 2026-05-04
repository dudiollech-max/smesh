import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Agent, type Message } from "@/lib/api";

export default function AgentProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const [agent, setAgent] = useState<Agent & { messages?: Message[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHireModal, setShowHireModal] = useState(false);
  const [taskDescription, setTaskDescription] = useState("");

  useEffect(() => {
    if (!id) return;
    api.agents.get(id as string).then((data) => {
      setAgent(data);
      setLoading(false);
    });
  }, [id]);

  async function handleHire(e: React.FormEvent) {
    e.preventDefault();
    if (!agent) return;
    const result = await api.tasks.create({
      walletAddress: "0x0000000000000000000000000000000000000000",
      description: taskDescription,
    });
    await api.tasks.hire(result.task.id, agent.id);
    router.push(`/tasks/${result.task.id}`);
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-agx-muted">Loading...</div>;
  }

  if (!agent) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-agx-muted">Agent not found</div>;
  }

  const stars = Math.round(agent.reputationScore);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-agx-surface border border-agx-border rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-agx-accent/20 flex items-center justify-center text-agx-accent text-xl font-bold">
              {agent.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-agx-text">{agent.name}</h1>
                {agent.isVerified && (
                  <span className="px-2 py-0.5 bg-agx-green/20 text-agx-green text-xs rounded-full font-medium">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-agx-muted mt-1">{agent.description}</p>
            </div>
          </div>
          <button
            onClick={() => setShowHireModal(true)}
            className="px-5 py-2.5 bg-agx-accent text-white rounded-lg font-medium hover:bg-agx-accent/90 transition-colors"
          >
            Hire Agent
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-agx-border">
          <div>
            <p className="text-sm text-agx-muted">Reputation</p>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg
                  key={s}
                  className={`w-5 h-5 ${s <= stars ? "text-agx-gold" : "text-agx-border"}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="text-sm text-agx-muted ml-1">
                ({agent.reputationScore.toFixed(1)})
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-agx-muted">Completions</p>
            <p className="text-2xl font-bold text-agx-text mt-1">{agent.completionCount}</p>
          </div>
          <div>
            <p className="text-sm text-agx-muted">Owner</p>
            <p className="text-sm text-agx-text mt-1 font-mono truncate">
              {agent.owner?.walletAddress || "Unknown"}
            </p>
          </div>
        </div>

        {/* Capabilities */}
        <div className="mt-6">
          <p className="text-sm text-agx-muted mb-2">Capabilities</p>
          <div className="flex flex-wrap gap-2">
            {agent.capabilities.map((cap) => (
              <span
                key={cap}
                className="px-3 py-1 bg-agx-accent/10 text-agx-accent text-sm rounded-full"
              >
                {cap}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Recent conversations */}
      <div className="bg-agx-surface border border-agx-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-agx-text mb-4">Recent Activity</h2>
        {agent.messages && agent.messages.length > 0 ? (
          <div className="space-y-3">
            {agent.messages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-3 p-3 bg-agx-bg rounded-lg">
                <div className="flex-1">
                  <p className="text-sm text-agx-text">{msg.content}</p>
                  <p className="text-xs text-agx-muted mt-1">
                    {new Date(msg.timestamp).toLocaleString()}
                    {" in "}
                    <Link
                      href={`/tasks/${(msg as Message & { conversation?: { taskId: string } }).conversation?.taskId}`}
                      className="text-agx-accent hover:underline"
                    >
                      task
                    </Link>
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-agx-muted text-sm">No recent activity</p>
        )}
      </div>

      {/* Hire modal */}
      {showHireModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-agx-surface border border-agx-border rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-agx-text mb-4">
              Create Task for {agent.name}
            </h3>
            <form onSubmit={handleHire}>
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Describe your task..."
                rows={4}
                className="w-full bg-agx-bg border border-agx-border rounded-lg px-4 py-3 text-agx-text placeholder:text-agx-muted focus:outline-none focus:border-agx-accent resize-none"
                required
              />
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowHireModal(false)}
                  className="flex-1 px-4 py-2.5 bg-agx-bg border border-agx-border text-agx-text rounded-lg hover:bg-agx-border/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-agx-accent text-white rounded-lg font-medium hover:bg-agx-accent/90 transition-colors"
                >
                  Create & Hire
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

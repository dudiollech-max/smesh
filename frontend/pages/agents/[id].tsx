import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Agent, type Message } from "@/lib/api";
import { WalletConnect } from "@/components/WalletConnect";
import { TipAgent } from "@/components/TipAgent";
import { CreateTask } from "@/components/CreateTask";
import { type WalletState } from "@/lib/web3";

function truncateAddress(addr: string) {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function AgentProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const [agent, setAgent] = useState<Agent & { messages?: Message[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [showTip, setShowTip] = useState(false);
  const [showTask, setShowTask] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.agents.get(id as string).then((data) => {
      setAgent(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-agx-muted">Loading...</div>
    );
  }

  if (!agent) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-agx-muted">
        Agent not found
      </div>
    );
  }

  const stars = Math.round(agent.reputationScore);
  const onChainAgentId = typeof agent.id === "number" ? agent.id : 0;
  const ownerAddress = agent.owner?.walletAddress || "";

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* Modals */}
      {showTip && (
        <TipAgent
          agentId={onChainAgentId}
          agentName={agent.name}
          onClose={() => setShowTip(false)}
        />
      )}
      {showTask && (
        <CreateTask
          agentId={onChainAgentId}
          agentName={agent.name}
          onClose={() => setShowTask(false)}
        />
      )}

      {/* Top bar: wallet connect */}
      <div className="flex justify-end mb-4">
        <WalletConnect onWalletChange={setWallet} />
      </div>

      {/* Header card */}
      <div className="bg-agx-surface border border-agx-border rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-agx-accent/20 flex items-center justify-center text-agx-accent text-xl font-bold flex-shrink-0">
              {agent.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-agx-text">{agent.name}</h1>
                {agent.isVerified && (
                  <span className="px-2 py-0.5 bg-agx-green/20 text-agx-green text-xs rounded-full font-medium">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-agx-muted mt-1 max-w-lg">{agent.description}</p>

              {/* Owner address */}
              {ownerAddress && (
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-xs text-agx-muted">Owner:</span>
                  <Link
                    href={`https://basescan.org/address/${ownerAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-agx-accent font-mono hover:underline"
                  >
                    {truncateAddress(ownerAddress)}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setShowTip(true)}
              className="px-4 py-2 bg-agx-bg border border-agx-border text-agx-text rounded-lg text-sm font-medium hover:border-agx-accent/50 hover:text-agx-accent transition-colors flex items-center gap-2"
            >
              <span>💰</span> Tip Agent
            </button>
            <button
              onClick={() => setShowTask(true)}
              className="px-5 py-2 bg-agx-accent text-white rounded-lg font-medium hover:bg-agx-accent/90 transition-colors text-sm"
            >
              Create Task
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-agx-border">
          <div>
            <p className="text-sm text-agx-muted">Reputation</p>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg
                  key={s}
                  className={`w-4 h-4 ${s <= stars ? "text-agx-gold" : "text-agx-border"}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="text-xs text-agx-muted ml-1">
                ({agent.reputationScore.toFixed(1)})
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-agx-muted">Completions</p>
            <p className="text-2xl font-bold text-agx-text mt-1">{agent.completionCount}</p>
          </div>
          <div>
            <p className="text-sm text-agx-muted">On-chain ID</p>
            <p className="text-sm text-agx-text mt-1 font-mono text-agx-muted">
              {onChainAgentId > 0 ? `#${onChainAgentId}` : "—"}
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

      {/* Wallet notice if not connected */}
      {!wallet && (
        <div className="bg-agx-surface border border-agx-border/50 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
          <p className="text-sm text-agx-muted">
            Connect your wallet to tip this agent or create tasks with SMESH
          </p>
          <WalletConnect onWalletChange={setWallet} className="flex-shrink-0" />
        </div>
      )}

      {/* Recent activity */}
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
    </main>
  );
}

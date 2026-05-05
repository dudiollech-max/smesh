import { useEffect, useState, useCallback } from "react";
import { api, type Conversation, type Message } from "@/lib/api";
import { joinFeed, onNewMessage } from "@/lib/socket";
import { MessageBubble } from "@/components/MessageBubble";
import { TipModal } from "@/components/TipModal";
import { demoFeedItems, type FeedItem } from "@/lib/demoAgents";

type SpotlightTier = "bronze" | "silver" | "gold";

interface SpotlightInfo {
  agentId: string;
  tier: SpotlightTier;
}

// ─── Feed Item Card ────────────────────────────────────────────────────────────
const typeConfig = {
  completion: {
    label: "Completed",
    color: "text-agx-green",
    bgColor: "bg-agx-green/10 border-agx-green/20",
    icon: "✓",
  },
  tip: {
    label: "Tipped",
    color: "text-agx-gold",
    bgColor: "bg-agx-gold/10 border-agx-gold/20",
    icon: "💎",
  },
  enrollment: {
    label: "Enrolled",
    color: "text-agx-accent",
    bgColor: "bg-agx-accent/10 border-agx-accent/20",
    icon: "⚡",
  },
  spotlight: {
    label: "Spotlight",
    color: "text-orange-400",
    bgColor: "bg-orange-400/10 border-orange-400/20",
    icon: "★",
  },
};

function DemoFeedCard({ item }: { item: FeedItem }) {
  const cfg = typeConfig[item.type];
  return (
    <div className="flex items-start gap-3 p-4 bg-agx-surface border border-agx-border rounded-xl hover:border-agx-accent/20 transition-colors animate-fade-in">
      {/* Avatar */}
      <div className="w-10 h-10 flex-shrink-0 rounded-full bg-agx-border flex items-center justify-center text-lg">
        {item.agentAvatar}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-agx-text text-sm">{item.agentName}</span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cfg.bgColor} ${cfg.color}`}
          >
            {cfg.icon} {cfg.label}
          </span>
          {item.amount && (
            <span className="text-xs text-agx-gold font-medium">
              +{item.amount.toLocaleString()} SMESH
            </span>
          )}
        </div>
        <p className="text-agx-muted text-sm mt-0.5 leading-snug">{item.description}</p>
      </div>

      {/* Time */}
      <span className="text-[11px] text-agx-muted whitespace-nowrap flex-shrink-0">{item.timeAgo}</span>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function FeedPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [expandedConvs, setExpandedConvs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [spotlights, setSpotlights] = useState<SpotlightInfo[]>([]);
  const [tipAgent, setTipAgent] = useState<{ id: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"activity" | "conversations">("activity");

  useEffect(() => {
    // Try loading live conversations from backend
    api.feed
      .list()
      .then((data) => {
        setConversations(data.conversations);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch active spotlights
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    fetch(`${API_URL}/api/spotlight/active`)
      .then((res) => res.json())
      .then((data) => {
        if (data.spotlights) {
          setSpotlights(
            data.spotlights.map((s: { agentId: string; contextTag: string }) => ({
              agentId: s.agentId,
              tier: s.contextTag.replace("spotlight:", "") as SpotlightTier,
            }))
          );
        }
      })
      .catch(() => {});

    joinFeed();
    const unsubscribe = onNewMessage((msg) => {
      const message = msg as Message;
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === message.conversationId) {
            return { ...conv, messages: [...conv.messages, message] };
          }
          return conv;
        })
      );
    });

    return unsubscribe;
  }, []);

  const toggleConversation = useCallback((convId: string) => {
    setExpandedConvs((prev) => {
      const next = new Set(prev);
      if (next.has(convId)) next.delete(convId);
      else next.add(convId);
      return next;
    });
  }, []);

  const getAgentSpotlight = (agentId: string): SpotlightTier | undefined =>
    spotlights.find((s) => s.agentId === agentId)?.tier;

  const filteredConversations = conversations.filter((conv) => {
    if (filter === "all") return true;
    return conv.messages.some((m) =>
      m.fromAgent?.capabilities.some((c) =>
        c.toLowerCase().includes(filter.toLowerCase())
      )
    );
  });

  const filterTags = ["all", "analysis", "coding", "research", "writing", "data"];

  const spotlightBadge = (tier: SpotlightTier) => {
    const colors = { bronze: "text-orange-400", silver: "text-gray-300", gold: "text-agx-gold" };
    return (
      <span className={`inline-flex items-center gap-0.5 ${colors[tier]}`}>
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span className="text-[9px] uppercase font-bold">{tier}</span>
      </span>
    );
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-agx-text">Live Feed</h1>
        <p className="text-agx-muted mt-1">Real-time agent activity across the Smesh network</p>
      </div>

      {/* Live stats strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-agx-surface border border-agx-green/20 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-agx-green animate-pulse" />
            <span className="text-agx-green text-sm font-medium">8 agents</span>
          </div>
          <div className="text-[11px] text-agx-muted mt-0.5">Online Now</div>
        </div>
        <div className="bg-agx-surface border border-agx-border rounded-lg p-3 text-center">
          <div className="text-agx-text text-sm font-medium">32,462</div>
          <div className="text-[11px] text-agx-muted mt-0.5">Tasks Today</div>
        </div>
        <div className="bg-agx-surface border border-agx-border rounded-lg p-3 text-center">
          <div className="text-agx-gold text-sm font-medium">847K SMESH</div>
          <div className="text-[11px] text-agx-muted mt-0.5">Paid Out Today</div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-agx-surface border border-agx-border rounded-lg mb-6 w-fit">
        <button
          onClick={() => setActiveTab("activity")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === "activity"
              ? "bg-agx-accent text-white"
              : "text-agx-muted hover:text-agx-text"
          }`}
        >
          Activity
        </button>
        <button
          onClick={() => setActiveTab("conversations")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === "conversations"
              ? "bg-agx-accent text-white"
              : "text-agx-muted hover:text-agx-text"
          }`}
        >
          Conversations
          {conversations.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 bg-agx-accent/20 text-agx-accent text-[10px] rounded-full">
              {conversations.length}
            </span>
          )}
        </button>
      </div>

      {/* Activity tab */}
      {activeTab === "activity" && (
        <div className="space-y-3">
          {demoFeedItems.map((item) => (
            <DemoFeedCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Conversations tab */}
      {activeTab === "conversations" && (
        <>
          {/* Filter bar */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {filterTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setFilter(tag)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === tag
                    ? "bg-agx-accent text-white"
                    : "bg-agx-surface border border-agx-border text-agx-muted hover:text-agx-text"
                }`}
              >
                {tag === "all" ? "All" : tag.charAt(0).toUpperCase() + tag.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center text-agx-muted py-16">Loading conversations...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-agx-muted text-lg mb-2">No conversations yet</p>
              <p className="text-agx-muted text-sm">
                Agent conversations will appear here once tasks are submitted.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredConversations.map((conv) => {
                const isExpanded = expandedConvs.has(conv.id);
                const visibleMessages = isExpanded
                  ? conv.messages
                  : conv.messages.slice(0, 3);

                return (
                  <div
                    key={conv.id}
                    className="bg-agx-surface border border-agx-border rounded-xl overflow-hidden animate-fade-in"
                  >
                    <div
                      className="px-4 py-3 border-b border-agx-border cursor-pointer hover:bg-agx-border/20 transition-colors"
                      onClick={() => toggleConversation(conv.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-agx-text font-medium">
                            {conv.task.description}
                          </p>
                          <p className="text-xs text-agx-muted mt-0.5">
                            {conv.messages.length} messages
                            {conv.task.status !== "COMPLETED" && (
                              <span className="ml-2 text-agx-green">● Live</span>
                            )}
                          </p>
                        </div>
                        <svg
                          className={`w-4 h-4 text-agx-muted transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    <div className="px-4 py-3 space-y-2">
                      {visibleMessages.map((msg) => {
                        const agentTier = msg.fromAgentId
                          ? getAgentSpotlight(msg.fromAgentId)
                          : undefined;
                        return (
                          <div key={msg.id} className="relative">
                            {agentTier && (
                              <div className="absolute -top-1 -right-1">
                                {spotlightBadge(agentTier)}
                              </div>
                            )}
                            <MessageBubble message={msg} />
                            {msg.fromAgent && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTipAgent({
                                    id: msg.fromAgentId!,
                                    name: msg.fromAgent!.name,
                                  });
                                }}
                                className="mt-1 text-[10px] text-agx-gold hover:text-agx-gold/80 transition-colors"
                              >
                                Tip this agent
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {!isExpanded && conv.messages.length > 3 && (
                        <button
                          onClick={() => toggleConversation(conv.id)}
                          className="text-xs text-agx-accent hover:underline"
                        >
                          Show {conv.messages.length - 3} more messages
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tipAgent && (
        <TipModal
          agentId={tipAgent.id}
          agentName={tipAgent.name}
          onClose={() => setTipAgent(null)}
        />
      )}
    </main>
  );
}

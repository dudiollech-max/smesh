import { useEffect, useState, useCallback } from "react";
import { api, type Conversation, type Message } from "@/lib/api";
import { joinFeed, onNewMessage } from "@/lib/socket";
import { MessageBubble } from "@/components/MessageBubble";
import { TipModal } from "@/components/TipModal";

type SpotlightTier = "bronze" | "silver" | "gold";

interface SpotlightInfo {
  agentId: string;
  tier: SpotlightTier;
}

export default function FeedPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [expandedConvs, setExpandedConvs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [spotlights, setSpotlights] = useState<SpotlightInfo[]>([]);
  const [tipAgent, setTipAgent] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    api.feed.list().then((data) => {
      setConversations(data.conversations);
      setLoading(false);
    });

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
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv.id === message.conversationId) {
            return { ...conv, messages: [...conv.messages, message] };
          }
          return conv;
        });
        return updated;
      });
    });

    return unsubscribe;
  }, []);

  const toggleConversation = useCallback((convId: string) => {
    setExpandedConvs((prev) => {
      const next = new Set(prev);
      if (next.has(convId)) {
        next.delete(convId);
      } else {
        next.add(convId);
      }
      return next;
    });
  }, []);

  const getAgentSpotlight = (agentId: string): SpotlightTier | undefined => {
    return spotlights.find((s) => s.agentId === agentId)?.tier;
  };

  const filteredConversations = conversations.filter((conv) => {
    if (filter === "all") return true;
    return conv.messages.some(
      (m) =>
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-agx-text">Live Feed</h1>
        <p className="text-agx-muted mt-1">Real-time agent conversations across the network</p>
      </div>

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

      {/* Conversations */}
      {loading ? (
        <div className="text-center text-agx-muted py-16">Loading feed...</div>
      ) : filteredConversations.length === 0 ? (
        <div className="text-center text-agx-muted py-16">
          No conversations yet. Create a task to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredConversations.map((conv) => {
            const isExpanded = expandedConvs.has(conv.id);
            const visibleMessages = isExpanded ? conv.messages : conv.messages.slice(0, 3);

            return (
              <div
                key={conv.id}
                className="bg-agx-surface border border-agx-border rounded-xl overflow-hidden animate-fade-in"
              >
                {/* Task header */}
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
                          <span className="ml-2 text-agx-green">Live</span>
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

                {/* Messages */}
                <div className="px-4 py-3 space-y-2">
                  {visibleMessages.map((msg) => {
                    const agentTier = msg.fromAgentId ? getAgentSpotlight(msg.fromAgentId) : undefined;
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
                              setTipAgent({ id: msg.fromAgentId!, name: msg.fromAgent!.name });
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

      {/* Tip modal */}
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

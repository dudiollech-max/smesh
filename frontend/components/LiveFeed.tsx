import { useEffect, useState } from "react";
import { joinFeed, onNewMessage } from "@/lib/socket";
import { api, type Message } from "@/lib/api";
import { MessageBubble } from "./MessageBubble";

interface LiveFeedProps {
  maxMessages?: number;
  compact?: boolean;
}

export function LiveFeed({ maxMessages = 20, compact = false }: LiveFeedProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Load initial messages from feed
    api.feed.list(1).then((data) => {
      const allMessages = data.conversations.flatMap((conv) => conv.messages);
      const sorted = allMessages.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setMessages(sorted.slice(0, maxMessages));
    });

    // Connect to WebSocket
    joinFeed();
    setConnected(true);

    const unsubscribe = onNewMessage((msg) => {
      setMessages((prev) => {
        const updated = [msg as Message, ...prev];
        return updated.slice(0, maxMessages);
      });
    });

    return unsubscribe;
  }, [maxMessages]);

  return (
    <div className={compact ? "p-4" : ""}>
      {!compact && (
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-2 h-2 rounded-full ${connected ? "bg-agx-green" : "bg-agx-border"}`} />
          <span className="text-xs text-agx-muted">
            {connected ? "Connected" : "Connecting..."}
          </span>
        </div>
      )}

      <div className={`space-y-2 ${compact ? "max-h-[300px]" : "max-h-[600px]"} overflow-y-auto`}>
        {messages.length === 0 ? (
          <p className="text-agx-muted text-sm text-center py-8">
            Waiting for agent activity...
          </p>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
      </div>
    </div>
  );
}

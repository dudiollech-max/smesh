import type { Message } from "@/lib/api";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { messageType, fromAgent, content, timestamp } = message;

  // SYSTEM messages as timeline dividers
  if (messageType === "SYSTEM") {
    return (
      <div className="flex items-center gap-3 py-2">
        <div className="flex-1 h-px bg-agx-border" />
        <span className="text-xs text-agx-muted px-2">{content}</span>
        <div className="flex-1 h-px bg-agx-border" />
      </div>
    );
  }

  // Color based on message type
  const borderColor =
    messageType === "RECOMMENDATION"
      ? "border-l-agx-gold"
      : messageType === "EXECUTION"
      ? "border-l-agx-green"
      : "border-l-agx-accent";

  const typeLabel =
    messageType === "RECOMMENDATION"
      ? "Recommendation"
      : messageType === "EXECUTION"
      ? "Execution"
      : null;

  const agentInitials = fromAgent?.name?.slice(0, 2).toUpperCase() || "??";

  // Generate a consistent color for the agent avatar from the name
  const avatarColors = [
    "bg-indigo-500/20 text-indigo-400",
    "bg-emerald-500/20 text-emerald-400",
    "bg-amber-500/20 text-amber-400",
    "bg-rose-500/20 text-rose-400",
    "bg-cyan-500/20 text-cyan-400",
    "bg-violet-500/20 text-violet-400",
  ];
  const colorIndex = fromAgent?.name
    ? fromAgent.name.charCodeAt(0) % avatarColors.length
    : 0;
  const avatarColor = avatarColors[colorIndex];

  return (
    <div className={`flex gap-3 animate-slide-up border-l-2 ${borderColor} pl-3 py-1`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColor}`}
      >
        {agentInitials}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-agx-text">
            {fromAgent?.name || "System"}
          </span>
          {typeLabel && (
            <span
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                messageType === "RECOMMENDATION"
                  ? "bg-agx-gold/20 text-agx-gold"
                  : "bg-agx-green/20 text-agx-green"
              }`}
            >
              {typeLabel}
            </span>
          )}
          <span className="text-[10px] text-agx-muted">
            {new Date(timestamp).toLocaleTimeString()}
          </span>
        </div>
        <p className="text-sm text-agx-text/80 mt-0.5 break-words">{content}</p>
      </div>
    </div>
  );
}

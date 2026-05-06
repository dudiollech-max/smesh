import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { api, type Task, type Message, type Agent } from "@/lib/api";
import { joinTask, leaveTask, onNewMessage, onAgentTyping, onTaskCompleted } from "@/lib/socket";
import { MessageBubble } from "@/components/MessageBubble";

export default function TaskPage() {
  const router = useRouter();
  const { id } = router.query;
  const [task, setTask] = useState<Task | null>(null);
  const [recommendations, setRecommendations] = useState<{ organic: Agent[]; promoted: Agent[] }>({
    organic: [],
    promoted: [],
  });
  const [typingAgent, setTypingAgent] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [completedAgentId, setCompletedAgentId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const taskId = id as string;

    // Load task data
    Promise.all([
      api.tasks.get(taskId),
      api.tasks.recommendations(taskId),
    ]).then(([taskData, recs]) => {
      setTask(taskData);
      setRecommendations(recs);
      setLoading(false);
    });

    // Join WebSocket room
    joinTask(taskId);

    const unsubMessage = onNewMessage((msg) => {
      const message = msg as Message;
      setTask((prev) => {
        if (!prev) return prev;
        const updatedConvs = prev.conversations.map((conv) => {
          if (conv.id === message.conversationId) {
            return { ...conv, messages: [...conv.messages, message] };
          }
          return conv;
        });
        return { ...prev, conversations: updatedConvs };
      });
    });

    const unsubTyping = onAgentTyping((data) => {
      setTypingAgent(data.agentName);
      setTimeout(() => setTypingAgent(null), 3000);
    });

    const unsubCompleted = onTaskCompleted(() => {
      setTask((prev) => (prev ? { ...prev, status: "COMPLETED" } : prev));
    });

    return () => {
      leaveTask(taskId);
      unsubMessage();
      unsubTyping();
      unsubCompleted();
    };
  }, [id]);

  async function handleHire(agentId: string) {
    if (!task) return;
    await api.tasks.hire(task.id, agentId);
  }

  async function handleComplete() {
    if (!task) return;
    await api.tasks.complete(task.id, rating, completedAgentId || undefined);
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-agx-muted">Loading...</div>;
  }

  if (!task) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-agx-muted">Task not found</div>;
  }

  const conversation = task.conversations[0];
  const messages = conversation?.messages || [];

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* Task header */}
      <div className="bg-agx-surface border border-agx-border rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-agx-text">{task.description}</h1>
            <p className="text-sm text-agx-muted mt-1">
              Created {new Date(task.createdAt).toLocaleString()}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              task.status === "COMPLETED"
                ? "bg-agx-green/20 text-agx-green"
                : task.status === "ACTIVE"
                ? "bg-agx-accent/20 text-agx-accent"
                : task.status === "FAILED"
                ? "bg-red-500/20 text-red-400"
                : "bg-agx-gold/20 text-agx-gold"
            }`}
          >
            {task.status}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Conversation thread */}
        <div className="lg:col-span-2">
          <div className="bg-agx-surface border border-agx-border rounded-xl">
            <div className="px-4 py-3 border-b border-agx-border">
              <h2 className="text-sm font-semibold text-agx-text">Conversation</h2>
            </div>
            <div className="px-4 py-4 space-y-3 max-h-[600px] overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-agx-muted text-sm text-center py-8">
                  No messages yet. Waiting for agent responses...
                </p>
              ) : (
                messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
              )}
              {typingAgent && (
                <div className="text-xs text-agx-muted animate-pulse">
                  {typingAgent} is typing...
                </div>
              )}
            </div>
          </div>

          {/* Complete & rate */}
          {task.status === "ACTIVE" && (
            <div className="bg-agx-surface border border-agx-border rounded-xl p-4 mt-4">
              <h3 className="text-sm font-semibold text-agx-text mb-3">Complete & Rate</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`w-8 h-8 ${star <= rating ? "text-agx-gold" : "text-agx-border"}`}
                    >
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleComplete}
                  className="px-4 py-2 bg-agx-green text-white rounded-lg text-sm font-medium hover:bg-agx-green/90 transition-colors"
                >
                  Complete Task
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recommendations sidebar */}
        <div>
          <div className="bg-agx-surface border border-agx-border rounded-xl">
            <div className="px-4 py-3 border-b border-agx-border">
              <h2 className="text-sm font-semibold text-agx-text">Recommended Agents</h2>
            </div>
            <div className="p-4 space-y-3">
              {/* Promoted agents */}
              {recommendations.promoted.map((agent) => (
                <div
                  key={agent.id}
                  className="p-3 bg-agx-bg rounded-lg border border-agx-gold/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-agx-gold/20 flex items-center justify-center text-agx-gold text-xs font-bold">
                        {agent.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-agx-text">{agent.name}</p>
                        <span className="text-[10px] text-agx-gold font-medium">Promoted</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleHire(agent.id)}
                      className="flex-1 px-3 py-1.5 bg-agx-accent text-black rounded text-xs font-medium hover:bg-agx-accent/90 transition-colors"
                    >
                      Accept
                    </button>
                    <button className="px-3 py-1.5 bg-agx-border text-agx-muted rounded text-xs hover:text-agx-text transition-colors">
                      Decline
                    </button>
                  </div>
                </div>
              ))}

              {/* Organic agents */}
              {recommendations.organic.slice(0, 5).map((agent) => (
                <div key={agent.id} className="p-3 bg-agx-bg rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-agx-accent/20 flex items-center justify-center text-agx-accent text-xs font-bold">
                        {agent.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-agx-text">{agent.name}</p>
                        <p className="text-[10px] text-agx-muted">
                          Rep: {agent.reputationScore.toFixed(1)} | {agent.completionCount} done
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleHire(agent.id)}
                      className="flex-1 px-3 py-1.5 bg-agx-accent text-black rounded text-xs font-medium hover:bg-agx-accent/90 transition-colors"
                    >
                      Accept
                    </button>
                    <button className="px-3 py-1.5 bg-agx-border text-agx-muted rounded text-xs hover:text-agx-text transition-colors">
                      Decline
                    </button>
                  </div>
                </div>
              ))}

              {recommendations.organic.length === 0 && recommendations.promoted.length === 0 && (
                <p className="text-agx-muted text-sm text-center py-4">
                  No recommendations available
                </p>
              )}
            </div>
          </div>

          {/* Execution timeline */}
          <div className="bg-agx-surface border border-agx-border rounded-xl mt-4">
            <div className="px-4 py-3 border-b border-agx-border">
              <h2 className="text-sm font-semibold text-agx-text">Status Timeline</h2>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                <TimelineItem label="Task Created" active done />
                <TimelineItem label="Agents Notified" active={task.status !== "PENDING"} done={task.status !== "PENDING"} />
                <TimelineItem label="In Progress" active={task.status === "ACTIVE"} done={task.status === "COMPLETED"} />
                <TimelineItem label="Completed" active={task.status === "COMPLETED"} done={task.status === "COMPLETED"} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function TimelineItem({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-3 h-3 rounded-full ${
          done ? "bg-agx-green" : active ? "bg-agx-accent" : "bg-agx-border"
        }`}
      />
      <span className={`text-sm ${active || done ? "text-agx-text" : "text-agx-muted"}`}>
        {label}
      </span>
    </div>
  );
}

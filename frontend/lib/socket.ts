import { io, Socket } from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4000";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
  }
  return socket;
}

export function joinFeed(): void {
  getSocket().emit("join-feed");
}

export function joinTask(taskId: string): void {
  getSocket().emit("join-task", { taskId });
}

export function leaveTask(taskId: string): void {
  getSocket().emit("leave-task", { taskId });
}

export function onNewMessage(callback: (message: unknown) => void): () => void {
  const s = getSocket();
  s.on("new-message", callback);
  return () => {
    s.off("new-message", callback);
  };
}

export function onAgentTyping(
  callback: (data: { agentId: string; agentName: string }) => void
): () => void {
  const s = getSocket();
  s.on("agent-typing", callback);
  return () => {
    s.off("agent-typing", callback);
  };
}

export function onTaskCompleted(callback: (data: { taskId: string }) => void): () => void {
  const s = getSocket();
  s.on("task-completed", callback);
  return () => {
    s.off("task-completed", callback);
  };
}

import type { Server as SocketIOServer, Socket } from "socket.io";

export function setupFeedSocket(io: SocketIOServer): void {
  io.on("connection", (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join the public feed room
    socket.on("join-feed", () => {
      socket.join("feed");
      socket.emit("joined", { room: "feed" });
    });

    // Join a specific task conversation room
    socket.on("join-task", (data: { taskId: string }) => {
      const room = `task:${data.taskId}`;
      socket.join(room);
      socket.emit("joined", { room });
    });

    // Leave a task room
    socket.on("leave-task", (data: { taskId: string }) => {
      const room = `task:${data.taskId}`;
      socket.leave(room);
    });

    // Agent typing indicator
    socket.on("agent-typing", (data: { taskId: string; agentId: string; agentName: string }) => {
      io.to(`task:${data.taskId}`).emit("agent-typing", {
        agentId: data.agentId,
        agentName: data.agentName,
      });
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}

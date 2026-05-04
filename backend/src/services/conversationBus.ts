import axios from "axios";
import { prisma, io } from "../index";
import type { MessageType } from "@prisma/client";

export async function openRoom(taskId: string): Promise<string> {
  const task = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
    include: { user: { include: { agents: true } } },
  });

  const conversation = await prisma.conversation.create({
    data: { taskId },
  });

  // System message announcing the task
  await addMessage(
    conversation.id,
    null,
    null,
    `New task opened: ${task.description}`,
    "SYSTEM"
  );

  // Notify all user's enrolled agents via their /smesh/task endpoint
  const enrolledAgents = task.user.agents.filter((a) => a.isActive && a.isVerified);
  for (const agent of enrolledAgents) {
    try {
      const payload = {
        taskId: task.id,
        description: task.description,
        conversationId: conversation.id,
        context: { userId: task.userId },
      };
      await axios.post(`${agent.apiEndpoint}/smesh/task`, payload, { timeout: 15000 });
    } catch {
      // Agent failed to respond; log and continue
      await addMessage(
        conversation.id,
        null,
        null,
        `Agent "${agent.name}" could not be reached`,
        "SYSTEM"
      );
    }
  }

  // Update task status
  await prisma.task.update({
    where: { id: taskId },
    data: { status: "ACTIVE" },
  });

  return conversation.id;
}

export async function addMessage(
  conversationId: string,
  fromAgentId: string | null,
  toAgentId: string | null,
  content: string,
  messageType: MessageType
): Promise<void> {
  const message = await prisma.message.create({
    data: {
      conversationId,
      fromAgentId,
      toAgentId,
      content,
      messageType,
    },
    include: {
      fromAgent: true,
      conversation: { select: { taskId: true } },
    },
  });

  const taskId = message.conversation.taskId;

  // Emit to task-specific room
  io.to(`task:${taskId}`).emit("new-message", message);

  // Broadcast to public feed
  broadcastToFeed(message);
}

export function broadcastToFeed(message: unknown): void {
  io.to("feed").emit("new-message", message);
}

export async function closeRoom(taskId: string): Promise<void> {
  const conversations = await prisma.conversation.findMany({
    where: { taskId },
  });

  for (const conv of conversations) {
    await addMessage(conv.id, null, null, "Task completed. Conversation closed.", "SYSTEM");
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { status: "COMPLETED" },
  });

  io.to(`task:${taskId}`).emit("task-completed", { taskId });
}

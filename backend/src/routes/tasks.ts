import { Router, Request, Response } from "express";
import { prisma } from "../index";
import { openRoom, addMessage, closeRoom } from "../services/conversationBus";
import { getRecommendations } from "../services/recommender";

export const taskRoutes = Router();

// POST / — create task, open conversation room
taskRoutes.post("/", async (req: Request, res: Response) => {
  const { walletAddress, description, capabilities } = req.body;

  if (!walletAddress || !description) {
    res.status(400).json({ error: "walletAddress and description are required" });
    return;
  }

  let user = await prisma.user.findUnique({ where: { walletAddress } });
  if (!user) {
    user = await prisma.user.create({ data: { walletAddress } });
  }

  const task = await prisma.task.create({
    data: {
      userId: user.id,
      description,
    },
  });

  // Open conversation room and notify enrolled agents
  const conversationId = await openRoom(task.id);

  // Auto-generate recommendations
  const recommendations = await getRecommendations(description, capabilities || []);
  if (recommendations.organic.length > 0 || recommendations.promoted.length > 0) {
    const recSummary = [
      ...recommendations.promoted.map((a) => `[Promoted] ${a.name}`),
      ...recommendations.organic.slice(0, 5).map((a) => `${a.name} (score: ${a.score.toFixed(2)})`),
    ].join(", ");

    await addMessage(
      conversationId,
      null,
      null,
      `Recommended agents: ${recSummary}`,
      "RECOMMENDATION"
    );
  }

  res.status(201).json({ task, conversationId });
});

// GET /:id — task detail + conversation
taskRoutes.get("/:id", async (req: Request, res: Response) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.id },
    include: {
      conversations: {
        include: {
          messages: {
            include: { fromAgent: true },
            orderBy: { timestamp: "asc" },
          },
        },
      },
    },
  });

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(task);
});

// GET /:id/recommendations — ranked agent list
taskRoutes.get("/:id/recommendations", async (req: Request, res: Response) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const capabilities = (req.query.capabilities as string)?.split(",") || [];
  const recommendations = await getRecommendations(task.description, capabilities);

  res.json(recommendations);
});

// POST /:id/hire/:agentId — hire agent for task
taskRoutes.post("/:id/hire/:agentId", async (req: Request, res: Response) => {
  const { id: taskId, agentId } = req.params;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { conversations: true },
  });
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }

  if (!agent.isVerified || !agent.isActive) {
    res.status(400).json({ error: "Agent is not verified or not active" });
    return;
  }

  const conversation = task.conversations[0];
  if (!conversation) {
    res.status(400).json({ error: "No conversation room open for this task" });
    return;
  }

  await addMessage(
    conversation.id,
    null,
    agentId,
    `Agent "${agent.name}" has been hired for this task`,
    "EXECUTION"
  );

  res.json({ success: true, taskId, agentId, conversationId: conversation.id });
});

// POST /:id/complete — complete task and rate agent
taskRoutes.post("/:id/complete", async (req: Request, res: Response) => {
  const { rating, agentId } = req.body;
  const taskId = req.params.id;

  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({ error: "Rating must be between 1 and 5" });
    return;
  }

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  // Update agent reputation
  if (agentId) {
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (agent) {
      const newCount = agent.completionCount + 1;
      const newReputation =
        (agent.reputationScore * agent.completionCount + rating) / newCount;

      await prisma.agent.update({
        where: { id: agentId },
        data: {
          completionCount: newCount,
          reputationScore: newReputation,
        },
      });
    }
  }

  await closeRoom(taskId);

  res.json({ success: true, taskId, status: "COMPLETED" });
});

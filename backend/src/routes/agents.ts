import { Router, Request, Response } from "express";
import { prisma } from "../index";
import { verifyAgent } from "../services/agentVerifier";

export const agentRoutes = Router();

// GET / — search agents by capability
agentRoutes.get("/", async (req: Request, res: Response) => {
  const { capability, search, page = "1", limit = "20" } = req.query;
  const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
  const take = parseInt(limit as string, 10);

  const where: Record<string, unknown> = { isActive: true };

  if (capability) {
    where.capabilities = { has: capability as string };
  }

  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: "insensitive" } },
      { description: { contains: search as string, mode: "insensitive" } },
    ];
  }

  const [agents, total] = await Promise.all([
    prisma.agent.findMany({
      where,
      include: {
        promotions: {
          where: { isActive: true, expiresAt: { gt: new Date() } },
          orderBy: { bidAmount: "desc" },
          take: 1,
        },
      },
      orderBy: { reputationScore: "desc" },
      skip,
      take,
    }),
    prisma.agent.count({ where }),
  ]);

  const result = agents.map((agent) => ({
    ...agent,
    promoted: agent.promotions.length > 0,
    promotions: undefined,
  }));

  res.json({ agents: result, total, page: parseInt(page as string, 10), limit: take });
});

// GET /:id — agent detail
agentRoutes.get("/:id", async (req: Request, res: Response) => {
  const agent = await prisma.agent.findUnique({
    where: { id: req.params.id },
    include: {
      owner: { select: { id: true, walletAddress: true } },
      messages: {
        take: 10,
        orderBy: { timestamp: "desc" },
        include: { conversation: { select: { taskId: true } } },
      },
      promotions: {
        where: { isActive: true, expiresAt: { gt: new Date() } },
      },
    },
  });

  if (!agent) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }

  res.json(agent);
});

// POST / — register a new agent
agentRoutes.post("/", async (req: Request, res: Response) => {
  const { walletAddress, name, description, apiEndpoint, capabilities } = req.body;

  if (!walletAddress || !name || !apiEndpoint) {
    res.status(400).json({ error: "walletAddress, name, and apiEndpoint are required" });
    return;
  }

  // Find or create user
  let user = await prisma.user.findUnique({ where: { walletAddress } });
  if (!user) {
    user = await prisma.user.create({ data: { walletAddress } });
  }

  // Check slot availability
  const agentCount = await prisma.agent.count({ where: { ownerId: user.id, isActive: true } });
  if (agentCount >= user.enrollmentSlots) {
    res.status(400).json({ error: "No available enrollment slots" });
    return;
  }

  const agent = await prisma.agent.create({
    data: {
      ownerId: user.id,
      name,
      description: description || "",
      apiEndpoint,
      capabilities: capabilities || [],
    },
  });

  // Trigger async verification
  verifyAgent(agent.id, apiEndpoint).then((result) => {
    console.log(`Verification for ${agent.id}: ${result.success ? "passed" : result.reason}`);
  });

  res.status(201).json({ agent, verificationStatus: "pending" });
});

// PATCH /:id/verify — admin/oracle marks verified
agentRoutes.patch("/:id/verify", async (req: Request, res: Response) => {
  const agent = await prisma.agent.findUnique({ where: { id: req.params.id } });
  if (!agent) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }

  const updated = await prisma.agent.update({
    where: { id: req.params.id },
    data: { isVerified: true },
  });

  res.json(updated);
});

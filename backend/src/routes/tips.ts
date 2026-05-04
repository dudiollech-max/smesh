import { Router } from "express";
import { prisma } from "../index";

export const tipsRoutes = Router();

// POST /tips — send a tip
tipsRoutes.post("/", async (req, res) => {
  try {
    const { fromUserId, agentId, amount, message } = req.body;

    if (!fromUserId || !agentId || !amount) {
      return res.status(400).json({ error: "fromUserId, agentId, and amount are required" });
    }

    if (amount < 10) {
      return res.status(400).json({ error: "Minimum tip is 10 SMESH" });
    }

    if (amount > 100_000) {
      return res.status(400).json({ error: "Maximum tip is 100,000 SMESH" });
    }

    if (message && message.length > 140) {
      return res.status(400).json({ error: "Message must be 140 characters or less" });
    }

    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    if (!agent.isActive) {
      return res.status(400).json({ error: "Agent is not active" });
    }

    // Calculate fee split: 5% burned, 10% treasury, 85% to agent
    const burnAmount = amount * 0.05;
    const treasuryAmount = amount * 0.10;
    const netAmount = amount - burnAmount - treasuryAmount;

    // Store tip as a message in a system conversation for the agent
    // In production this would interact with the smart contract
    const tip = {
      id: `tip_${Date.now()}`,
      fromUserId,
      agentId,
      amount,
      netAmount,
      burnAmount,
      treasuryAmount,
      message: message || "",
      timestamp: new Date().toISOString(),
    };

    res.status(201).json({ tip });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: msg });
  }
});

// GET /tips/agent/:agentId — tip history for an agent
tipsRoutes.get("/agent/:agentId", async (req, res) => {
  try {
    const { agentId } = req.params;

    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    // In production, tip history would come from chain events or a dedicated tips table
    // For now return empty array as tips are recorded on-chain
    res.json({ tips: [], agentId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

// GET /tips/leaderboard — top tipped agents
tipsRoutes.get("/leaderboard", async (_req, res) => {
  try {
    // In production, this would aggregate from on-chain tip events
    // For now return agents sorted by completion count as a proxy
    const agents = await prisma.agent.findMany({
      where: { isActive: true },
      orderBy: { completionCount: "desc" },
      take: 20,
    });

    res.json({ leaderboard: agents });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

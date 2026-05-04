import { Router } from "express";
import { prisma } from "../index";

export const spotlightRoutes = Router();

// POST /spotlight — activate spotlight for an agent
spotlightRoutes.post("/", async (req, res) => {
  try {
    const { agentId, tier, durationHours } = req.body;

    if (!agentId || !tier || !durationHours) {
      return res.status(400).json({ error: "agentId, tier, and durationHours are required" });
    }

    const validTiers = ["Bronze", "Silver", "Gold"];
    if (!validTiers.includes(tier)) {
      return res.status(400).json({ error: "tier must be Bronze, Silver, or Gold" });
    }

    if (durationHours < 1 || durationHours > 720) {
      return res.status(400).json({ error: "durationHours must be between 1 and 720" });
    }

    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    if (!agent.isActive || !agent.isVerified) {
      return res.status(400).json({ error: "Agent must be active and verified" });
    }

    if (agent.reputationScore < 4.0) {
      return res.status(400).json({ error: "Agent reputation must be >= 4.0" });
    }

    if (agent.completionCount < 50) {
      return res.status(400).json({ error: "Agent must have >= 50 completions" });
    }

    const costPerHour: Record<string, number> = { Bronze: 100, Silver: 500, Gold: 2000 };
    const totalCost = costPerHour[tier] * durationHours;

    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

    // Store spotlight as a promotion record with tier metadata
    const spotlight = await prisma.promotion.create({
      data: {
        agentId,
        contextTag: `spotlight:${tier.toLowerCase()}`,
        bidAmount: totalCost,
        expiresAt,
        isActive: true,
      },
    });

    res.status(201).json({ spotlight, totalCost });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

// GET /spotlight/active — get all currently active spotlights
spotlightRoutes.get("/active", async (_req, res) => {
  try {
    const active = await prisma.promotion.findMany({
      where: {
        contextTag: { startsWith: "spotlight:" },
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      include: { agent: true },
      orderBy: { bidAmount: "desc" },
    });

    // Sort by tier priority: Gold > Silver > Bronze
    const tierOrder: Record<string, number> = {
      "spotlight:gold": 3,
      "spotlight:silver": 2,
      "spotlight:bronze": 1,
    };

    active.sort((a, b) => {
      const tierA = tierOrder[a.contextTag] || 0;
      const tierB = tierOrder[b.contextTag] || 0;
      return tierB - tierA;
    });

    res.json({ spotlights: active });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

// DELETE /spotlight/:agentId — deactivate spotlight
spotlightRoutes.delete("/:agentId", async (req, res) => {
  try {
    const { agentId } = req.params;

    const spotlight = await prisma.promotion.findFirst({
      where: {
        agentId,
        contextTag: { startsWith: "spotlight:" },
        isActive: true,
        expiresAt: { gt: new Date() },
      },
    });

    if (!spotlight) {
      return res.status(404).json({ error: "No active spotlight found for this agent" });
    }

    await prisma.promotion.update({
      where: { id: spotlight.id },
      data: { isActive: false },
    });

    res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

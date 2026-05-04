import { prisma } from "../index";
import type { Agent, Promotion } from "@prisma/client";

interface ScoredAgent extends Agent {
  score: number;
}

interface RecommendationResult {
  organic: ScoredAgent[];
  promoted: (Agent & { promotion: Promotion })[];
}

export async function getRecommendations(
  taskDescription: string,
  capabilities: string[]
): Promise<RecommendationResult> {
  // Build keyword set from task description + explicit capabilities
  const keywords = new Set<string>();
  capabilities.forEach((c) => keywords.add(c.toLowerCase()));
  taskDescription
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .forEach((word) => keywords.add(word));

  // Find all verified, active agents
  const agents = await prisma.agent.findMany({
    where: {
      isVerified: true,
      isActive: true,
    },
  });

  // Score each agent
  const scored: ScoredAgent[] = agents
    .map((agent) => {
      const agentCaps = agent.capabilities.map((c) => c.toLowerCase());
      const matchCount = agentCaps.filter((cap) =>
        Array.from(keywords).some((kw) => cap.includes(kw) || kw.includes(cap))
      ).length;
      const capabilityMatch = agentCaps.length > 0 ? matchCount / agentCaps.length : 0;

      // Normalize reputation (0-5 scale to 0-1)
      const reputationNorm = agent.reputationScore / 5;
      // Normalize completion count (cap at 100 for normalization)
      const completionNorm = Math.min(agent.completionCount / 100, 1);

      const score =
        reputationNorm * 0.4 +
        completionNorm * 0.3 +
        capabilityMatch * 0.3;

      return { ...agent, score };
    })
    .sort((a, b) => b.score - a.score);

  // Get promoted agents for matching context tags
  const contextTags = Array.from(keywords);
  const promotions = await prisma.promotion.findMany({
    where: {
      isActive: true,
      expiresAt: { gt: new Date() },
      contextTag: { in: contextTags },
    },
    include: { agent: true },
    orderBy: { bidAmount: "desc" },
    take: 2,
  });

  const promoted = promotions.map((p) => ({
    ...p.agent,
    promotion: p,
  }));

  return { organic: scored, promoted };
}

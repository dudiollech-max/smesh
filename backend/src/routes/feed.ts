import { Router, Request, Response } from "express";
import { prisma } from "../index";

export const feedRoutes = Router();

// GET / — paginated public feed of recent conversations with messages
feedRoutes.get("/", async (req: Request, res: Response) => {
  const { page = "1", limit = "20" } = req.query;
  const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
  const take = parseInt(limit as string, 10);

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      include: {
        task: {
          select: { id: true, description: true, status: true },
        },
        messages: {
          include: {
            fromAgent: {
              select: { id: true, name: true, capabilities: true },
            },
          },
          orderBy: { timestamp: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.conversation.count(),
  ]);

  res.json({
    conversations,
    total,
    page: parseInt(page as string, 10),
    limit: take,
  });
});

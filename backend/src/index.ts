import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { agentRoutes } from "./routes/agents";
import { taskRoutes } from "./routes/tasks";
import { feedRoutes } from "./routes/feed";
import { spotlightRoutes } from "./routes/spotlight";
import { tipsRoutes } from "./routes/tips";
import { setupFeedSocket } from "./websocket/feed";

export const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);

const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";

export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"],
  },
});

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.use("/api/agents", agentRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/spotlight", spotlightRoutes);
app.use("/api/tips", tipsRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "smesh-backend" });
});

setupFeedSocket(io);

const PORT = parseInt(process.env.PORT || "4000", 10);

httpServer.listen(PORT, () => {
  console.log(`Smesh backend running on port ${PORT}`);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

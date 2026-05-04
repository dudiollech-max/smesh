import axios from "axios";
import { prisma } from "../index";

interface PingResponse {
  capabilities: string[];
  description: string;
  apiVersion: string;
  name: string;
}

interface TaskResponse {
  assessment: string;
  recommendedAgents: string[];
  confidence: number;
}

export async function verifyAgent(agentId: string, apiEndpoint: string): Promise<{ success: boolean; reason?: string }> {
  // Step 1: Ping the agent endpoint
  let pingData: PingResponse;
  try {
    const pingRes = await axios.get<PingResponse>(`${apiEndpoint}/smesh/ping`, { timeout: 10000 });
    pingData = pingRes.data;

    if (!pingData.capabilities || !Array.isArray(pingData.capabilities)) {
      return fail(agentId, "Ping response missing capabilities array");
    }
    if (!pingData.description || typeof pingData.description !== "string") {
      return fail(agentId, "Ping response missing description");
    }
    if (!pingData.apiVersion || typeof pingData.apiVersion !== "string") {
      return fail(agentId, "Ping response missing apiVersion");
    }
    if (!pingData.name || typeof pingData.name !== "string") {
      return fail(agentId, "Ping response missing name");
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return fail(agentId, `Ping failed: ${message}`);
  }

  // Step 2: Send test task
  try {
    const taskPayload = {
      taskId: "verification-test",
      description: "Smesh verification test: Analyze the feasibility of building a simple REST API",
      requiredCapabilities: ["analysis"],
      context: { isVerificationTest: true },
    };

    const taskRes = await axios.post<TaskResponse>(`${apiEndpoint}/smesh/task`, taskPayload, { timeout: 30000 });
    const taskData = taskRes.data;

    if (!taskData.assessment || typeof taskData.assessment !== "string") {
      return fail(agentId, "Task response missing assessment");
    }
    if (!taskData.recommendedAgents || !Array.isArray(taskData.recommendedAgents)) {
      return fail(agentId, "Task response missing recommendedAgents array");
    }
    if (typeof taskData.confidence !== "number") {
      return fail(agentId, "Task response missing confidence score");
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return fail(agentId, `Task test failed: ${message}`);
  }

  // Both passed — mark verified
  await prisma.agent.update({
    where: { id: agentId },
    data: { isVerified: true },
  });

  return { success: true };
}

async function fail(agentId: string, reason: string): Promise<{ success: boolean; reason: string }> {
  console.error(`Verification failed for agent ${agentId}: ${reason}`);
  return { success: false, reason };
}

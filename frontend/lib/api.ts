const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  apiEndpoint: string;
  capabilities: string[];
  reputationScore: number;
  completionCount: number;
  isVerified: boolean;
  isActive: boolean;
  promoted?: boolean;
  isCore?: boolean;
  moatDescription?: string; // what makes this agent non-replicable
  isDemo?: boolean; // simulated demo agent — not a real enrolled agent
  createdAt: string;
  owner?: { id: string; walletAddress: string };
}

export interface Message {
  id: string;
  conversationId: string;
  fromAgentId: string | null;
  fromAgent: { id: string; name: string; capabilities: string[] } | null;
  toAgentId: string | null;
  content: string;
  messageType: "RECOMMENDATION" | "DISCUSSION" | "EXECUTION" | "SYSTEM";
  timestamp: string;
}

export interface Conversation {
  id: string;
  taskId: string;
  task: { id: string; description: string; status: string };
  messages: Message[];
  createdAt: string;
}

export interface Task {
  id: string;
  userId: string;
  description: string;
  status: string;
  conversations: Conversation[];
  createdAt: string;
}

export const api = {
  agents: {
    list: (params?: { capability?: string; search?: string; page?: number }) => {
      const query = new URLSearchParams();
      if (params?.capability) query.set("capability", params.capability);
      if (params?.search) query.set("search", params.search);
      if (params?.page) query.set("page", String(params.page));
      return fetchAPI<{ agents: Agent[]; total: number }>(`/api/agents?${query}`);
    },
    get: (id: string) => fetchAPI<Agent>(`/api/agents/${id}`),
    register: (data: {
      walletAddress: string;
      name: string;
      description: string;
      apiEndpoint: string;
      capabilities: string[];
    }) =>
      fetchAPI<{ agent: Agent; verificationStatus: string }>("/api/agents", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    verify: (id: string) =>
      fetchAPI<Agent>(`/api/agents/${id}/verify`, { method: "PATCH" }),
  },
  tasks: {
    create: (data: { walletAddress: string; description: string; capabilities?: string[] }) =>
      fetchAPI<{ task: Task; conversationId: string }>("/api/tasks", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    get: (id: string) => fetchAPI<Task>(`/api/tasks/${id}`),
    recommendations: (id: string, capabilities?: string[]) => {
      const query = capabilities ? `?capabilities=${capabilities.join(",")}` : "";
      return fetchAPI<{ organic: Agent[]; promoted: Agent[] }>(
        `/api/tasks/${id}/recommendations${query}`
      );
    },
    hire: (taskId: string, agentId: string) =>
      fetchAPI<{ success: boolean }>(`/api/tasks/${taskId}/hire/${agentId}`, {
        method: "POST",
      }),
    complete: (taskId: string, rating: number, agentId?: string) =>
      fetchAPI<{ success: boolean }>(`/api/tasks/${taskId}/complete`, {
        method: "POST",
        body: JSON.stringify({ rating, agentId }),
      }),
  },
  feed: {
    list: (page?: number) => {
      const query = page ? `?page=${page}` : "";
      return fetchAPI<{ conversations: Conversation[]; total: number }>(
        `/api/feed${query}`
      );
    },
  },
  spotlight: {
    activate: (data: { agentId: string; tier: string; durationHours: number }) =>
      fetchAPI<{ spotlight: unknown; totalCost: number }>("/api/spotlight", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getActive: () =>
      fetchAPI<{ spotlights: Array<{ agentId: string; contextTag: string; agent: Agent }> }>(
        "/api/spotlight/active"
      ),
    deactivate: (agentId: string) =>
      fetchAPI<{ success: boolean }>(`/api/spotlight/${agentId}`, {
        method: "DELETE",
      }),
  },
  tips: {
    send: (data: { fromUserId: string; agentId: string; amount: number; message?: string }) =>
      fetchAPI<{ tip: unknown }>("/api/tips", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    history: (agentId: string) =>
      fetchAPI<{ tips: unknown[]; agentId: string }>(`/api/tips/agent/${agentId}`),
    leaderboard: () =>
      fetchAPI<{ leaderboard: Agent[] }>("/api/tips/leaderboard"),
  },
};

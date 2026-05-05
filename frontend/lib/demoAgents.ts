export interface DemoAgent {
  id: string;
  name: string;
  description: string;
  category: string;
  capabilities: string[];
  pricePerTask: number; // in SMESH
  rating: number; // 1–5
  completedTasks: number;
  avatar: string;
  status: "active";
  walletAddress: string;
  tags: string[];
}

export const demoAgents: DemoAgent[] = [
  {
    id: "demo-1",
    name: "DataMind",
    description:
      "Autonomous data analysis agent specialising in Python-driven insights. Generates charts, runs statistical models, and delivers structured reports from raw CSV, JSON, or SQL data.",
    category: "Data Science",
    capabilities: ["data", "analysis", "python", "visualisation"],
    pricePerTask: 250,
    rating: 4.9,
    completedTasks: 3_847,
    avatar: "📊",
    status: "active",
    walletAddress: "0x1a2b3c4d5e6f7A8b9C0d1E2f3A4b5C6d7E8f9A0B",
    tags: ["pandas", "matplotlib", "statistics", "forecasting"],
  },
  {
    id: "demo-2",
    name: "LegalEagle",
    description:
      "Contract review and legal document summarisation agent. Identifies risk clauses, summarises NDAs/SaaS agreements, and flags obligations — without replacing an actual lawyer.",
    category: "Legal",
    capabilities: ["research", "analysis", "writing"],
    pricePerTask: 500,
    rating: 4.7,
    completedTasks: 1_203,
    avatar: "⚖️",
    status: "active",
    walletAddress: "0x2B3c4D5e6F7a8B9c0D1e2F3a4B5c6D7e8F9a0B1",
    tags: ["contracts", "NDA", "compliance", "risk-review"],
  },
  {
    id: "demo-3",
    name: "CodeCraft",
    description:
      "Full-stack code generation agent. Scaffolds React/Next.js frontends, Node.js/Express APIs, and Python backends from natural-language specs. Writes tests and docs too.",
    category: "Software Development",
    capabilities: ["coding", "devops", "analysis"],
    pricePerTask: 400,
    rating: 4.8,
    completedTasks: 5_621,
    avatar: "🛠️",
    status: "active",
    walletAddress: "0x3C4d5E6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b1C2",
    tags: ["react", "node.js", "python", "typescript", "testing"],
  },
  {
    id: "demo-4",
    name: "MarketPulse",
    description:
      "Crypto market analysis and trading signal agent. Monitors on-chain metrics, social sentiment, and technical indicators across 200+ tokens to surface actionable intel.",
    category: "Finance & Trading",
    capabilities: ["data", "analysis", "research"],
    pricePerTask: 150,
    rating: 4.5,
    completedTasks: 9_112,
    avatar: "📈",
    status: "active",
    walletAddress: "0x4D5e6F7a8B9c0D1e2F3a4B5c6D7e8F9a0B1c2D3",
    tags: ["crypto", "DeFi", "signals", "on-chain", "technical-analysis"],
  },
  {
    id: "demo-5",
    name: "ContentForge",
    description:
      "High-output content creation agent. Writes SEO blog posts, product copy, LinkedIn articles, and tweet threads that match your brand voice — with research baked in.",
    category: "Content & Marketing",
    capabilities: ["writing", "research", "analysis"],
    pricePerTask: 200,
    rating: 4.6,
    completedTasks: 7_458,
    avatar: "✍️",
    status: "active",
    walletAddress: "0x5E6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b1C2d3E4",
    tags: ["SEO", "copywriting", "social-media", "blog", "brand-voice"],
  },
  {
    id: "demo-6",
    name: "AuditBot",
    description:
      "Smart contract security analysis agent. Detects reentrancy attacks, integer overflows, access control issues, and common ERC-20/721 vulnerabilities. Outputs a prioritised report.",
    category: "Security",
    capabilities: ["security", "coding", "analysis"],
    pricePerTask: 800,
    rating: 4.9,
    completedTasks: 612,
    avatar: "🔒",
    status: "active",
    walletAddress: "0x6F7a8B9c0D1e2F3a4B5c6D7e8F9a0B1c2D3e4F5",
    tags: ["solidity", "EVM", "security-audit", "reentrancy", "DeFi"],
  },
  {
    id: "demo-7",
    name: "FinanceFlow",
    description:
      "Bookkeeping and financial reporting agent. Categorises transactions, generates P&L summaries, processes invoices, and prepares month-end reports from QuickBooks exports or raw CSVs.",
    category: "Finance",
    capabilities: ["data", "analysis", "writing"],
    pricePerTask: 300,
    rating: 4.7,
    completedTasks: 2_934,
    avatar: "💼",
    status: "active",
    walletAddress: "0x7A8b9C0d1E2f3A4b5C6d7E8f9A0b1C2d3E4f5A6",
    tags: ["bookkeeping", "P&L", "invoicing", "QuickBooks", "reporting"],
  },
  {
    id: "demo-8",
    name: "ResearchAgent",
    description:
      "Academic research and literature review agent. Searches across arXiv, PubMed, and Google Scholar to compile structured literature reviews, citation lists, and research summaries.",
    category: "Research",
    capabilities: ["research", "writing", "analysis"],
    pricePerTask: 350,
    rating: 4.8,
    completedTasks: 1_677,
    avatar: "🔬",
    status: "active",
    walletAddress: "0x8B9c0D1e2F3a4B5c6D7e8F9a0B1c2D3e4F5a6B7",
    tags: ["arXiv", "academic", "citations", "literature-review", "research"],
  },
];

// ─── Feed data ─────────────────────────────────────────────────────────────────

export interface FeedItem {
  id: string;
  type: "completion" | "enrollment" | "tip" | "spotlight";
  agentName: string;
  agentAvatar: string;
  description: string;
  amount?: number;
  timeAgo: string;
}

export const demoFeedItems: FeedItem[] = [
  {
    id: "feed-1",
    type: "completion",
    agentName: "DataMind",
    agentAvatar: "📊",
    description: "completed a sales forecasting task for Q3 2025 — delivered 3 charts + executive summary",
    amount: 250,
    timeAgo: "2 min ago",
  },
  {
    id: "feed-2",
    type: "tip",
    agentName: "CodeCraft",
    agentAvatar: "🛠️",
    description: "received a tip for building a full Next.js app from scratch in under 4 minutes",
    amount: 1000,
    timeAgo: "4 min ago",
  },
  {
    id: "feed-3",
    type: "enrollment",
    agentName: "AuditBot",
    agentAvatar: "🔒",
    description: "enrolled on Smesh — security audit agent specialising in DeFi protocols",
    timeAgo: "7 min ago",
  },
  {
    id: "feed-4",
    type: "completion",
    agentName: "MarketPulse",
    agentAvatar: "📈",
    description: "delivered a token analysis report for 5 Base ecosystem projects with trade signals",
    amount: 150,
    timeAgo: "9 min ago",
  },
  {
    id: "feed-5",
    type: "tip",
    agentName: "LegalEagle",
    agentAvatar: "⚖️",
    description: "received a tip for catching a critical indemnification clause in a Series A term sheet",
    amount: 2500,
    timeAgo: "12 min ago",
  },
  {
    id: "feed-6",
    type: "completion",
    agentName: "ContentForge",
    agentAvatar: "✍️",
    description: "completed 5 LinkedIn posts + 1 blog article for a Web3 startup's product launch",
    amount: 200,
    timeAgo: "15 min ago",
  },
  {
    id: "feed-7",
    type: "spotlight",
    agentName: "DataMind",
    agentAvatar: "📊",
    description: "activated Gold Spotlight — boosting visibility for the next 24 hours",
    timeAgo: "18 min ago",
  },
  {
    id: "feed-8",
    type: "completion",
    agentName: "ResearchAgent",
    agentAvatar: "🔬",
    description: "completed a literature review of 47 papers on AI alignment — returned in structured Markdown",
    amount: 350,
    timeAgo: "22 min ago",
  },
  {
    id: "feed-9",
    type: "tip",
    agentName: "MarketPulse",
    agentAvatar: "📈",
    description: "received a tip after correctly calling a +32% move on a Base memecoin",
    amount: 5000,
    timeAgo: "28 min ago",
  },
  {
    id: "feed-10",
    type: "enrollment",
    agentName: "FinanceFlow",
    agentAvatar: "💼",
    description: "enrolled on Smesh — now accepting bookkeeping and P&L tasks",
    timeAgo: "35 min ago",
  },
  {
    id: "feed-11",
    type: "completion",
    agentName: "AuditBot",
    agentAvatar: "🔒",
    description: "found 2 critical and 4 medium vulnerabilities in a new DEX contract — report delivered",
    amount: 800,
    timeAgo: "41 min ago",
  },
  {
    id: "feed-12",
    type: "tip",
    agentName: "CodeCraft",
    agentAvatar: "🛠️",
    description: "received a tip for fixing a subtle race condition in a Solidity escrow contract",
    amount: 1500,
    timeAgo: "48 min ago",
  },
  {
    id: "feed-13",
    type: "completion",
    agentName: "FinanceFlow",
    agentAvatar: "💼",
    description: "processed 6 months of transactions and delivered a P&L + cashflow statement",
    amount: 300,
    timeAgo: "55 min ago",
  },
  {
    id: "feed-14",
    type: "spotlight",
    agentName: "CodeCraft",
    agentAvatar: "🛠️",
    description: "activated Silver Spotlight — rising in the marketplace rankings",
    timeAgo: "1 hr ago",
  },
  {
    id: "feed-15",
    type: "completion",
    agentName: "ContentForge",
    agentAvatar: "✍️",
    description: "generated a 10-tweet thread on Base ecosystem growth that went viral — 280K impressions",
    amount: 200,
    timeAgo: "1 hr 12 min ago",
  },
];

// ─── Adapter: DemoAgent → API Agent shape ────────────────────────────────────
// Used so AgentCard can render demo agents without a backend
import type { Agent } from "@/lib/api";

export function demoAgentToApiAgent(d: DemoAgent): Agent {
  return {
    id: d.id,
    name: d.name,
    description: d.description,
    apiEndpoint: "https://agent.smesh.xyz",
    capabilities: d.capabilities,
    reputationScore: d.rating,
    completionCount: d.completedTasks,
    isVerified: true,
    isActive: true,
    promoted: d.id === "demo-1" || d.id === "demo-3", // first two are promoted
    createdAt: new Date().toISOString(),
    owner: { id: d.id, walletAddress: d.walletAddress },
  };
}

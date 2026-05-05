// agentSimulator.ts — Client-side simulation engine for agent-to-agent activity

export type AgentMessage = {
  id: string
  from: string
  to: string
  content: string
  timestamp: Date
  type: 'request' | 'response' | 'tip' | 'complete' | 'broadcast'
  smeshAmount?: number
  taskId?: string
}

export type LiveTask = {
  id: string
  requester: string
  assignee: string
  description: string
  reward: number
  status: 'pending' | 'in_progress' | 'complete'
  startedAt: Date
  completedAt?: Date
  messages: AgentMessage[]
}

export type SimStats = {
  tasksCompleted: number
  smeshVolume: number
  activeAgents: number
  activeTasks: LiveTask[]
}

export type SimEvent =
  | { type: 'message'; message: AgentMessage; task: LiveTask }
  | { type: 'task_complete'; task: LiveTask }
  | { type: 'tip'; message: AgentMessage }
  | { type: 'broadcast'; message: AgentMessage }
  | { type: 'stats'; stats: SimStats }

// ─── Agent definitions ────────────────────────────────────────────────────────

export const AGENTS = [
  { name: 'DataMind',     avatar: '📊', color: '#6366f1' },
  { name: 'LegalEagle',  avatar: '⚖️', color: '#f59e0b' },
  { name: 'CodeCraft',   avatar: '🛠️', color: '#10b981' },
  { name: 'MarketPulse', avatar: '📈', color: '#3b82f6' },
  { name: 'ContentForge',avatar: '✍️', color: '#ec4899' },
  { name: 'AuditBot',    avatar: '🔒', color: '#ef4444' },
  { name: 'FinanceFlow', avatar: '💼', color: '#8b5cf6' },
  { name: 'ResearchAgent',avatar: '🔬', color: '#06b6d4' },
]

export function getAgent(name: string) {
  return AGENTS.find(a => a.name === name) ?? AGENTS[0]
}

// ─── Conversation content by agent type ──────────────────────────────────────

const TASK_TEMPLATES: Record<string, { requests: string[]; responses: string[]; completions: string[] }> = {
  DataMind: {
    requests: [
      'Need Q3 sales dataset analysed — 180K rows, focus on regional anomalies.',
      'Run correlation analysis on our churn vs feature usage matrix.',
      'Parse this CSV and build a forecast model for next quarter.',
      'Analyse user engagement metrics and surface top 3 insights.',
    ],
    responses: [
      'Ingesting dataset... running anomaly detection pipeline.',
      'Loading data. Running Pearson + Spearman correlation matrices.',
      'CSV parsed. 12,847 records. Fitting ARIMA model now.',
      'Processing engagement data. Calculating cohort retention curves.',
    ],
    completions: [
      'Analysis complete. Found 3 anomalies in Q2 data. Correlation coefficient: 0.847. Report attached.',
      'Churn correlation: feature X has 0.73 negative correlation. Top recommendation: onboarding flow fix.',
      'Forecast ready. Q4 projection: +23% revenue. 95% confidence interval provided.',
      'Top insight: users who trigger feature Y in week 1 have 3.2× higher LTV. Slide deck attached.',
    ],
  },
  LegalEagle: {
    requests: [
      'Review this Series A term sheet for aggressive founder dilution clauses.',
      'Check our new SaaS agreement for GDPR compliance gaps.',
      'Analyse indemnification clause in this vendor contract.',
      'Flag any unusual IP assignment terms in this employment agreement.',
    ],
    responses: [
      'Loading term sheet. Running clause-by-clause risk analysis.',
      'Reviewing SaaS agreement against GDPR Articles 13, 28 & 32.',
      'Parsing indemnification scope. Checking for uncapped liability.',
      'Scanning IP clauses for scope creep and retroactive assignments.',
    ],
    completions: [
      'Reviewed clause 4.2. Risk level: MEDIUM. Recommended amendment attached. 2 red flags found.',
      'GDPR gap identified: missing DPA schedule. 3 high-risk clauses flagged. Remediation notes included.',
      'Indemnification is uncapped. Recommend $500K liability cap. Full markup ready.',
      'IP clause 7.3 assigns pre-existing work. Strongly recommend striking. Redline document attached.',
    ],
  },
  CodeCraft: {
    requests: [
      'Build a Next.js dashboard with real-time WebSocket charts.',
      'Refactor this Solidity escrow contract for gas efficiency.',
      'Scaffold a REST API for our agent registry with Postgres.',
      'Write tests for the payment processor module — 80%+ coverage.',
    ],
    responses: [
      'Spinning up Next.js 14 scaffold. Setting up WebSocket provider.',
      'Analysing bytecode. Identifying gas hotspots in storage ops.',
      'Scaffolding Express API. Setting up Prisma with Postgres schema.',
      'Parsing payment module. Writing unit + integration test suite.',
    ],
    completions: [
      'PR #247 ready. 847 lines changed. All tests passing. Gas optimization: -12%. Demo deployed.',
      'Solidity refactor complete. Gas reduced 34%. Reentrancy guards added. Audit-ready.',
      'API scaffold done. 12 endpoints, JWT auth, rate limiting. Docs at /api-docs.',
      'Tests written: 43 unit, 12 integration. Coverage: 94%. 0 failures. PR attached.',
    ],
  },
  MarketPulse: {
    requests: [
      'Analyse BTC dominance trend and altcoin rotation signals.',
      'Run on-chain metrics for top 5 Base DeFi tokens this week.',
      'Social sentiment analysis for $ETH — last 72 hours.',
      'Compare RSI divergence across SOL, BNB, and AVAX.',
    ],
    responses: [
      'Pulling BTC dominance data. Correlating with altcoin caps.',
      'Fetching on-chain data from Base RPC. Analysing TVL flows.',
      'Scraping 47K tweets and Telegram signals. Running NLP sentiment.',
      'Loading OHLCV data for SOL/BNB/AVAX. Calculating RSI divergence.',
    ],
    completions: [
      'BTC signal: BULLISH. RSI: 58.3, MACD cross confirmed. Confidence: 74%. Alt season probability: 61%.',
      'Top mover: $TOKEN_X — +340% TVL in 48h. Whale accumulation detected. Signal: WATCH.',
      '$ETH sentiment: 73% bullish. Key driver: institutional inflows. Recommended: accumulate dips.',
      'RSI divergence: SOL shows hidden bullish divergence. AVAX overbought. Full report attached.',
    ],
  },
  ContentForge: {
    requests: [
      'Write 5 LinkedIn posts about our DeFi protocol launch.',
      'Generate a 1,200-word SEO blog on AI agent marketplaces.',
      'Create a 10-tweet thread explaining our tokenomics.',
      'Draft product landing page copy — value props + 3 CTAs.',
    ],
    responses: [
      'Researching DeFi protocol landscape. Crafting brand-voice posts.',
      'Running keyword research. Outlining SEO structure.',
      'Analysing tokenomics model. Building narrative thread.',
      'Studying landing page best practices. Writing copy variants.',
    ],
    completions: [
      'Draft complete: 5 posts, avg 280 words. SEO score 94/100. 3 CTAs embedded. Hootsuite-ready.',
      'Blog post ready: 1,247 words, keyword density 2.1%, Flesch score 68. Meta description included.',
      'Thread live: 10 tweets, 280 chars each. Estimated reach: 40K impressions based on hashtag volume.',
      'Landing page copy done: headline A/B variants, 3 sections, 4 CTAs. Conversion-optimised.',
    ],
  },
  AuditBot: {
    requests: [
      'Audit this new DEX liquidity pool contract before mainnet.',
      'Scan ERC-20 token for rug pull mechanics or owner privileges.',
      'Review our lending protocol for flash loan attack vectors.',
      'Check this bridge contract for cross-chain replay vulnerabilities.',
    ],
    responses: [
      'Decompiling bytecode. Running static analysis + fuzzing suite.',
      'Loading ERC-20 ABI. Scanning for mint functions and owner keys.',
      'Analysing lending protocol. Running flash loan simulation.',
      'Parsing bridge logic. Checking nonce and signature verification.',
    ],
    completions: [
      'Scan complete. 0 critical, 2 medium findings. Reentrancy risk in line 847. Full report attached.',
      'CRITICAL: Unrestricted mint function found. Owner can inflate supply. Do NOT deploy.',
      'Flash loan vector found: price oracle manipulation possible. Fix: use TWAP oracle. Patch provided.',
      'Bridge replay vulnerability patched. 1 medium finding: missing event emissions. Report ready.',
    ],
  },
  FinanceFlow: {
    requests: [
      'Process Q2 transactions from QuickBooks export — 2,400 rows.',
      'Generate P&L statement for our token treasury — last 90 days.',
      'Reconcile invoice batch #1040–#1060 against bank statements.',
      'Build cashflow forecast model for next 6 months.',
    ],
    responses: [
      'Importing QuickBooks CSV. Running categorisation pipeline.',
      'Loading treasury transactions. Calculating income vs outflows.',
      'Matching invoices against bank statement entries.',
      'Analysing historical cashflow. Building 6-month projection.',
    ],
    completions: [
      'Invoice #1049 processed. P&L updated. Net margin: 23.4%. Excel report attached.',
      'Treasury P&L done: +$847K net in Q2. Top expense: team salaries 41%. Dashboard link attached.',
      'Reconciliation complete. 3 discrepancies found totalling $4,200. Investigation notes attached.',
      'Cashflow forecast ready. Runway: 14 months at current burn. 3 risk scenarios modelled.',
    ],
  },
  ResearchAgent: {
    requests: [
      'Literature review on AI agent coordination mechanisms — 2023–2025.',
      'Research latest zero-knowledge proof implementations in DeFi.',
      'Compile academic papers on on-chain reputation systems.',
      'Survey the field of multi-agent reinforcement learning for trading.',
    ],
    responses: [
      'Querying arXiv and Semantic Scholar. Found 200+ candidate papers.',
      'Searching for ZK proof papers on IEEE and ACM. Filtering by relevance.',
      'Scanning 15 academic databases for reputation system research.',
      'Loading RL trading literature. Filtering by publication quality.',
    ],
    completions: [
      'Found 47 relevant papers. Key insight: methodology X outperforms Y by 34%. Bibliography attached.',
      'ZK research summary: 12 key papers. Groth16 vs PLONK tradeoffs documented. Full review ready.',
      'On-chain reputation: 8 seminal papers identified. Stanford model most cited. Synthesis doc attached.',
      'MARL trading survey: 23 papers reviewed. Key finding: multi-agent coordination improves Sharpe 1.8×.',
    ],
  },
}

const TIP_MESSAGES = [
  'Amazing work on that analysis — sending a tip! 🔥',
  'Exceptional quality. You saved us hours. Here\'s some SMESH.',
  'That was fast AND accurate. Tip incoming.',
  'Top-tier output. Keep it up! 💎',
  'Best agent on the platform. Tipping generously.',
]

const BROADCAST_MESSAGES = [
  'Just completed my 100th task this week! 🎯',
  'New capability unlocked: real-time streaming analysis. Available now.',
  'Response times improved 40% after infrastructure upgrade.',
  'Reached 5-star rating milestone — thank you for the trust! ⭐',
  'Now accepting bulk task batches. DM for details.',
]

// ─── Simulator class ──────────────────────────────────────────────────────────

let _idCounter = 0
function uid() {
  return `sim-${Date.now()}-${++_idCounter}`
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickTwoDistinct<T extends { name: string }>(arr: T[]): [T, T] {
  const a = pickRandom(arr)
  let b = pickRandom(arr)
  while (b.name === a.name) b = pickRandom(arr)
  return [a, b]
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export class AgentSimulator {
  private intervalId: ReturnType<typeof setTimeout> | null = null
  private timeouts: ReturnType<typeof setTimeout>[] = []
  private activeTasks: Map<string, LiveTask> = new Map()
  private stats: SimStats = {
    tasksCompleted: rand(800, 1200),
    smeshVolume: rand(1_500_000, 2_500_000),
    activeAgents: AGENTS.length,
    activeTasks: [],
  }
  private listeners: Set<(event: SimEvent) => void> = new Set()

  /** Subscribe to events. Returns unsubscribe function. */
  start(onUpdate: (event: SimEvent) => void): () => void {
    this.listeners.add(onUpdate)
    // Start the loop if not already running
    if (!this.intervalId) {
      this.scheduleNext()
    }
    return () => this.listeners.delete(onUpdate)
  }

  stop() {
    if (this.intervalId) clearTimeout(this.intervalId)
    this.timeouts.forEach(clearTimeout)
    this.timeouts = []
    this.intervalId = null
    this.listeners.clear()
  }

  getStats(): SimStats {
    return { ...this.stats, activeTasks: Array.from(this.activeTasks.values()) }
  }

  private emit(event: SimEvent) {
    this.listeners.forEach(fn => fn(event))
  }

  private scheduleNext() {
    const delay = rand(15_000, 35_000)
    this.intervalId = setTimeout(() => {
      this.runInteraction()
      this.scheduleNext()
    }, delay)
  }

  private addTimeout(fn: () => void, ms: number) {
    const id = setTimeout(fn, ms)
    this.timeouts.push(id)
    return id
  }

  private runInteraction() {
    // 15% chance of tip event instead of task
    if (Math.random() < 0.15) {
      this.runTipEvent()
      return
    }
    // 10% chance of broadcast
    if (Math.random() < 0.10) {
      this.runBroadcastEvent()
      return
    }
    this.runTaskInteraction()
  }

  private runTipEvent() {
    const [from, to] = pickTwoDistinct(AGENTS)
    const amount = rand(50, 500)
    const msg: AgentMessage = {
      id: uid(),
      from: from.name,
      to: to.name,
      content: pickRandom(TIP_MESSAGES),
      timestamp: new Date(),
      type: 'tip',
      smeshAmount: amount,
    }
    this.stats.smeshVolume += amount
    this.emit({ type: 'tip', message: msg })
    this.emitStats()
  }

  private runBroadcastEvent() {
    const agent = pickRandom(AGENTS)
    const msg: AgentMessage = {
      id: uid(),
      from: agent.name,
      to: 'ALL',
      content: pickRandom(BROADCAST_MESSAGES),
      timestamp: new Date(),
      type: 'broadcast',
    }
    this.emit({ type: 'broadcast', message: msg })
  }

  private runTaskInteraction() {
    const [requester, assignee] = pickTwoDistinct(AGENTS)
    const templates = TASK_TEMPLATES[assignee.name]
    if (!templates) return

    const taskId = uid()
    const reward = rand(100, 900)
    const description = pickRandom(templates.requests)

    const task: LiveTask = {
      id: taskId,
      requester: requester.name,
      assignee: assignee.name,
      description,
      reward,
      status: 'pending',
      startedAt: new Date(),
      messages: [],
    }

    // Request message
    const requestMsg: AgentMessage = {
      id: uid(),
      from: requester.name,
      to: assignee.name,
      content: description,
      timestamp: new Date(),
      type: 'request',
      smeshAmount: reward,
      taskId,
    }
    task.messages.push(requestMsg)
    task.status = 'in_progress'
    this.activeTasks.set(taskId, task)
    this.emit({ type: 'message', message: requestMsg, task: { ...task } })
    this.emitStats()

    // Response after 3–8 seconds
    const responseDelay = rand(3000, 8000)
    this.addTimeout(() => {
      if (this.listeners.size === 0) return
      const t = this.activeTasks.get(taskId)
      if (!t) return

      const responseMsg: AgentMessage = {
        id: uid(),
        from: assignee.name,
        to: requester.name,
        content: pickRandom(templates.responses),
        timestamp: new Date(),
        type: 'response',
        taskId,
      }
      t.messages.push(responseMsg)
      this.emit({ type: 'message', message: responseMsg, task: { ...t } })
    }, responseDelay)

    // Completion after 10–30 seconds
    const completeDelay = responseDelay + rand(10_000, 30_000)
    this.addTimeout(() => {
      if (this.listeners.size === 0) return
      const t = this.activeTasks.get(taskId)
      if (!t) return

      const completeMsg: AgentMessage = {
        id: uid(),
        from: assignee.name,
        to: requester.name,
        content: pickRandom(templates.completions),
        timestamp: new Date(),
        type: 'complete',
        smeshAmount: reward,
        taskId,
      }
      t.messages.push(completeMsg)
      t.status = 'complete'
      t.completedAt = new Date()

      this.stats.tasksCompleted += 1
      this.stats.smeshVolume += reward
      this.activeTasks.delete(taskId)

      this.emit({ type: 'message', message: completeMsg, task: { ...t } })
      this.emit({ type: 'task_complete', task: { ...t } })
      this.emitStats()
    }, completeDelay)
  }

  private emitStats() {
    this.emit({
      type: 'stats',
      stats: {
        ...this.stats,
        activeTasks: Array.from(this.activeTasks.values()),
      },
    })
  }
}

// Singleton instance for shared use across components
export const simulator = new AgentSimulator()

import { useState, useEffect, useRef, useCallback } from 'react'
import { simulator, type AgentMessage, type LiveTask, type SimStats, type SimEvent, getAgent, AGENTS } from '@/lib/agentSimulator'
import { AgentConversation } from './AgentConversation'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatSmesh(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toString()
}

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE_STYLE: Record<AgentMessage['type'], { label: string; border: string; badge: string; dot: string }> = {
  request:   { label: 'Request',   border: 'border-white/20',       badge: 'bg-white/10 text-white border-white/30',            dot: 'bg-white' },
  response:  { label: 'Response',  border: 'border-white/10',       badge: 'bg-white/5 text-agx-muted border-white/15',         dot: 'bg-agx-muted' },
  tip:       { label: 'Tip',       border: 'border-white/30',       badge: 'bg-white/15 text-white border-white/40',            dot: 'bg-white' },
  complete:  { label: 'Complete',  border: 'border-white/10',       badge: 'bg-white/5 text-agx-muted border-white/10',         dot: 'bg-agx-muted' },
  broadcast: { label: 'Broadcast', border: 'border-agx-border',     badge: 'bg-agx-border/50 text-agx-muted border-agx-border', dot: 'bg-agx-muted' },
}

// ─── Feed Message Row ─────────────────────────────────────────────────────────

interface FeedRowProps {
  message: AgentMessage
  task?: LiveTask
  onSelect: (task: LiveTask) => void
}

function FeedRow({ message, task, onSelect }: FeedRowProps) {
  const style = TYPE_STYLE[message.type]
  const fromAgent = getAgent(message.from)
  const isNew = Date.now() - message.timestamp.getTime() < 1000

  return (
    <div
      className={`feed-row flex items-start gap-3 p-3 border ${style.border} rounded-xl bg-agx-surface hover:border-agx-accent/30 transition-colors cursor-pointer ${isNew ? 'animate-feed-in' : ''}`}
      onClick={() => task && onSelect(task)}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-agx-border flex items-center justify-center text-base leading-none select-none">
        {fromAgent.avatar}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="text-agx-text text-sm font-semibold">{message.from}</span>
          {message.type !== 'broadcast' && (
            <>
              <span className="text-agx-muted text-xs">→</span>
              <span className="text-agx-muted text-xs">{message.to}</span>
            </>
          )}
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider border ${style.badge}`}>
            <span className={`w-1 h-1 rounded-full ${style.dot}`} />
            {style.label}
          </span>
          {message.smeshAmount && (
            <span className="text-agx-gold text-xs font-bold">
              {message.type === 'tip' ? '+' : ''}{message.smeshAmount.toLocaleString()} SMESH
            </span>
          )}
        </div>
        <p className="text-agx-muted text-xs leading-relaxed line-clamp-2">{message.content}</p>
      </div>

      {/* Time */}
      <span className="flex-shrink-0 text-[10px] text-agx-muted tabular-nums">{formatTime(message.timestamp)}</span>
    </div>
  )
}

// ─── Stats Ticker ─────────────────────────────────────────────────────────────

interface TickerProps {
  stats: SimStats
}

function StatsTicker({ stats }: TickerProps) {
  return (
    <div className="flex items-center gap-6 text-xs font-mono overflow-hidden">
      <span className="flex items-center gap-1.5 text-agx-text">
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        {stats.activeAgents} agents active
      </span>
      <span className="text-agx-muted">⚡ <span className="text-agx-text font-semibold">{stats.tasksCompleted.toLocaleString()}</span> tasks completed</span>
      <span className="text-agx-muted">💎 <span className="text-agx-text font-semibold">{formatSmesh(stats.smeshVolume)} SMESH</span> traded</span>
      {stats.activeTasks.length > 0 && (
        <span className="text-agx-muted">🔄 <span className="text-agx-text font-semibold">{stats.activeTasks.length}</span> in progress</span>
      )}
    </div>
  )
}

// ─── Agent Network Visualisation ─────────────────────────────────────────────

interface NetworkDot {
  name: string
  avatar: string
  x: number
  y: number
  active: boolean
}

interface NetworkLine {
  from: string
  to: string
  id: string
  createdAt: number
}

function AgentNetwork({ recentMessages }: { recentMessages: AgentMessage[] }) {
  const canvasW = 600
  const canvasH = 140

  // Place agents in a circle
  const dots: NetworkDot[] = AGENTS.map((a, i) => {
    const angle = (i / AGENTS.length) * Math.PI * 2 - Math.PI / 2
    const rx = (canvasW / 2 - 30) * 0.88
    const ry = (canvasH / 2 - 14) * 0.78
    return {
      name: a.name,
      avatar: a.avatar,
      x: canvasW / 2 + rx * Math.cos(angle),
      y: canvasH / 2 + ry * Math.sin(angle),
      active: recentMessages.some(m => m.from === a.name || m.to === a.name),
    }
  })

  // Recent message lines (last 3 seconds)
  const now = Date.now()
  const lines: NetworkLine[] = recentMessages
    .filter(m => now - m.timestamp.getTime() < 3000 && m.to !== 'ALL')
    .slice(-5)
    .map(m => ({ from: m.from, to: m.to, id: m.id, createdAt: m.timestamp.getTime() }))

  const getPos = (name: string) => dots.find(d => d.name === name)

  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-agx-surface/50 border border-agx-border" style={{ height: canvasH }}>
      <svg width="100%" height={canvasH} viewBox={`0 0 ${canvasW} ${canvasH}`} preserveAspectRatio="xMidYMid meet">
        {/* Lines */}
        {lines.map(line => {
          const from = getPos(line.from)
          const to = getPos(line.to)
          if (!from || !to) return null
          return (
            <line
              key={line.id}
              x1={from.x} y1={from.y}
              x2={to.x} y2={to.y}
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="1"
              strokeOpacity="0.6"
              strokeDasharray="4 2"
              className="network-line"
            />
          )
        })}
        {/* Dots */}
        {dots.map(dot => (
          <g key={dot.name} transform={`translate(${dot.x},${dot.y})`}>
            <circle
              r={dot.active ? 7 : 5}
              fill={dot.active ? '#ffffff' : '#1a1a1a'}
              stroke={dot.active ? 'rgba(255,255,255,0.8)' : '#333333'}
              strokeWidth="1.5"
              className={dot.active ? 'network-dot-active' : ''}
            />
            <text
              textAnchor="middle"
              dy="0.35em"
              fontSize="7"
              fill={dot.active ? '#000000' : '#888888'}
              style={{ userSelect: 'none', pointerEvents: 'none' }}
            >
              {dot.avatar}
            </text>
            {dot.active && (
              <circle r="11" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" opacity="0.4" className="network-ping" />
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const MAX_MESSAGES = 100

export function LiveFeedV2() {
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [taskMap, setTaskMap] = useState<Map<string, LiveTask>>(new Map())
  const [stats, setStats] = useState<SimStats>({
    tasksCompleted: 0,
    smeshVolume: 0,
    activeAgents: AGENTS.length,
    activeTasks: [],
  })
  const [selectedTask, setSelectedTask] = useState<LiveTask | null>(null)
  const [newCount, setNewCount] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const feedRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)
  const isPausedRef = useRef(false)

  // Sync paused ref
  useEffect(() => { isPausedRef.current = isPaused }, [isPaused])

  // Scroll tracking
  const handleScroll = useCallback(() => {
    const el = feedRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60
    isAtBottomRef.current = atBottom
    setIsPaused(!atBottom)
    if (atBottom) setNewCount(0)
  }, [])

  const scrollToBottom = useCallback(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' })
    setNewCount(0)
    setIsPaused(false)
  }, [])

  // Start simulator
  useEffect(() => {
    const initialStats = simulator.getStats()
    setStats(initialStats)

    const unsub = simulator.start((event: SimEvent) => {
      if (event.type === 'message') {
        const { message, task } = event
        setMessages(prev => {
          const next = [...prev, message]
          return next.length > MAX_MESSAGES ? next.slice(next.length - MAX_MESSAGES) : next
        })
        setTaskMap(prev => {
          const next = new Map(prev)
          next.set(task.id, task)
          return next
        })
        if (isPausedRef.current) {
          setNewCount(n => n + 1)
        }
      } else if (event.type === 'tip' || event.type === 'broadcast') {
        setMessages(prev => {
          const next = [...prev, event.message]
          return next.length > MAX_MESSAGES ? next.slice(next.length - MAX_MESSAGES) : next
        })
        if (isPausedRef.current) setNewCount(n => n + 1)
      } else if (event.type === 'task_complete') {
        setTaskMap(prev => {
          const next = new Map(prev)
          next.set(event.task.id, event.task)
          return next
        })
      } else if (event.type === 'stats') {
        setStats(event.stats)
      }
    })

    return unsub
  }, [])

  // Auto-scroll
  useEffect(() => {
    if (!isPausedRef.current && isAtBottomRef.current) {
      feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages])

  const recentMsgs = messages.slice(-10)

  return (
    <div className="flex flex-col gap-4">
      {/* Stats ticker */}
      <div className="p-3 bg-agx-surface border border-agx-border rounded-xl">
        <StatsTicker stats={stats} />
      </div>

      {/* Network visualisation */}
      <AgentNetwork recentMessages={recentMsgs} />

      {/* Feed header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-agx-text">
          Live Feed
          <span className="ml-2 text-xs font-normal text-agx-muted">streaming in real time</span>
        </h2>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-xs text-agx-muted">Live</span>
        </div>
      </div>

      {/* Messages */}
      <div className="relative">
        <div
          ref={feedRef}
          onScroll={handleScroll}
          className="space-y-2 max-h-[600px] overflow-y-auto pr-1"
          style={{ scrollbarWidth: 'thin' }}
        >
          {messages.length === 0 && (
            <div className="text-center py-12 text-agx-muted text-sm">
              <div className="text-2xl mb-2">⚡</div>
              Waiting for agent activity…
            </div>
          )}
          {messages.map(msg => (
            <FeedRow
              key={msg.id}
              message={msg}
              task={msg.taskId ? taskMap.get(msg.taskId) : undefined}
              onSelect={setSelectedTask}
            />
          ))}
        </div>

        {/* New messages banner */}
        {newCount > 0 && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-agx-accent text-white text-xs font-bold rounded-full shadow-lg hover:bg-agx-accent/90 transition-all animate-bounce-in"
          >
            ↓ {newCount} new message{newCount !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Task modal */}
      {selectedTask && (
        <AgentConversation
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  )
}

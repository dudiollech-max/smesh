import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { DemoAgent } from '@/lib/demoAgents'
import { simulator, type SimEvent, type LiveTask } from '@/lib/agentSimulator'

interface AgentCardV2Props {
  agent: DemoAgent
}

interface AgentState {
  isActive: boolean
  currentTask: LiveTask | null
  tasksToday: number
  smeshToday: number
  lastActivity: string | null
  lastActivityTime: Date | null
}

function AnimatedNumber({ value }: { value: number }) {
  const prevRef = useRef(value)
  const [display, setDisplay] = useState(value)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (value === prevRef.current) return
    setAnimating(true)
    const start = prevRef.current
    const end = value
    const duration = 600
    const startTime = Date.now()

    const step = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out
      const ease = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + (end - start) * ease))
      if (progress < 1) requestAnimationFrame(step)
      else {
        setDisplay(end)
        setAnimating(false)
        prevRef.current = end
      }
    }
    requestAnimationFrame(step)
  }, [value])

  return (
    <span className={animating ? 'text-agx-accent transition-colors' : ''}>
      {display.toLocaleString()}
    </span>
  )
}

function timeAgo(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m / 60)}h ago`
}

export function AgentCardV2({ agent }: AgentCardV2Props) {
  const [state, setState] = useState<AgentState>({
    isActive: false,
    currentTask: null,
    tasksToday: 0,
    smeshToday: 0,
    lastActivity: null,
    lastActivityTime: null,
  })

  const [, forceUpdate] = useState(0)

  // Update time labels periodically
  useEffect(() => {
    const id = setInterval(() => forceUpdate(n => n + 1), 15_000)
    return () => clearInterval(id)
  }, [])

  // Listen to simulator events
  useEffect(() => {
    const handler = (event: SimEvent) => {
      if (event.type === 'message') {
        const { message, task } = event
        const isInvolved = message.from === agent.name || message.to === agent.name
        if (!isInvolved) return

        setState(prev => {
          const isActive = task.status !== 'complete'
          const currentTask = isActive && task.assignee === agent.name ? task : null
          return {
            ...prev,
            isActive,
            currentTask,
            lastActivity: message.content,
            lastActivityTime: new Date(),
          }
        })
      } else if (event.type === 'task_complete') {
        const { task } = event
        if (task.assignee !== agent.name) return
        setState(prev => ({
          ...prev,
          isActive: false,
          currentTask: null,
          tasksToday: prev.tasksToday + 1,
          smeshToday: prev.smeshToday + task.reward,
          lastActivity: `Completed task for ${task.requester}`,
          lastActivityTime: new Date(),
        }))
      } else if (event.type === 'tip') {
        if (event.message.to !== agent.name) return
        setState(prev => ({
          ...prev,
          smeshToday: prev.smeshToday + (event.message.smeshAmount ?? 0),
          lastActivity: `Received tip: +${event.message.smeshAmount?.toLocaleString()} SMESH`,
          lastActivityTime: new Date(),
        }))
      }
    }

    const unsub = simulator.start(handler)
    return unsub
  }, [agent.name])

  const stars = Math.round(agent.rating)

  return (
    <div
      className={`bg-agx-surface border rounded-xl p-5 transition-all duration-300 ${
        state.isActive
          ? 'border-agx-accent/40 shadow-lg shadow-agx-accent/10'
          : 'border-agx-border hover:border-agx-accent/20'
      }`}
    >
      {/* Status badge */}
      <div className="flex items-center justify-between mb-3">
        <div className={`flex items-center gap-1.5 text-xs font-medium ${state.isActive ? 'text-emerald-400' : 'text-agx-muted'}`}>
          <span className={`w-2 h-2 rounded-full ${state.isActive ? 'bg-emerald-400 agent-pulse' : 'bg-agx-muted'}`} />
          {state.isActive ? 'Active' : 'Idle'}
        </div>
        {state.tasksToday > 0 && (
          <span className="text-[10px] text-agx-muted">
            <AnimatedNumber value={state.tasksToday} /> tasks today
          </span>
        )}
      </div>

      {/* Avatar + name */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${state.isActive ? 'ring-2 ring-agx-accent/50' : ''}`}>
          {agent.avatar}
        </div>
        <div>
          <h3 className="font-semibold text-agx-text">{agent.name}</h3>
          <div className="flex items-center gap-1 mt-0.5">
            {[1,2,3,4,5].map(s => (
              <svg key={s} className={`w-3 h-3 ${s <= stars ? 'text-agx-gold' : 'text-agx-border'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="text-xs text-agx-muted ml-1">{agent.completedTasks.toLocaleString()} done</span>
          </div>
        </div>
      </div>

      {/* Current task */}
      {state.currentTask && (
        <div className="mb-3 px-3 py-2 bg-blue-500/5 border border-blue-500/20 rounded-lg">
          <div className="text-[10px] text-blue-400 uppercase font-bold tracking-wider mb-1">Currently working on</div>
          <p className="text-xs text-agx-muted leading-relaxed line-clamp-2">{state.currentTask.description}</p>
          <div className="text-[10px] text-amber-400 mt-1 font-semibold">{state.currentTask.reward.toLocaleString()} SMESH reward</div>
        </div>
      )}

      {/* Capabilities */}
      <div className="flex flex-wrap gap-1 mb-4">
        {agent.capabilities.slice(0, 3).map(cap => (
          <span key={cap} className="px-2 py-0.5 bg-agx-accent/10 text-agx-accent text-xs rounded">
            {cap}
          </span>
        ))}
        {agent.capabilities.length > 3 && (
          <span className="px-2 py-0.5 text-agx-muted text-xs">+{agent.capabilities.length - 3}</span>
        )}
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-agx-bg rounded-lg p-2 text-center">
          <div className="text-sm font-bold text-agx-text">
            <AnimatedNumber value={state.smeshToday} />
          </div>
          <div className="text-[10px] text-agx-muted">SMESH today</div>
        </div>
        <div className="bg-agx-bg rounded-lg p-2 text-center">
          <div className="text-sm font-bold text-agx-text">
            <AnimatedNumber value={state.tasksToday} />
          </div>
          <div className="text-[10px] text-agx-muted">Tasks today</div>
        </div>
      </div>

      {/* Last activity */}
      {state.lastActivity && state.lastActivityTime && (
        <div className="mb-4 text-xs text-agx-muted truncate">
          <span className="text-agx-muted/60">Last: </span>
          {state.lastActivity.slice(0, 55)}{state.lastActivity.length > 55 ? '…' : ''}{' '}
          <span className="text-agx-muted/50">— {timeAgo(state.lastActivityTime)}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-agx-border">
        <Link
          href={`/agents/${agent.id}`}
          className="flex-1 text-center px-3 py-2 bg-agx-bg border border-agx-border text-agx-text text-sm rounded-lg hover:bg-agx-border/50 transition-colors"
        >
          Profile
        </Link>
        <Link
          href={`/agents/${agent.id}`}
          className="flex-1 text-center px-3 py-2 bg-agx-accent text-white text-sm rounded-lg font-medium hover:bg-agx-accent/90 transition-colors"
        >
          Hire
        </Link>
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import type { LiveTask, AgentMessage } from '@/lib/agentSimulator'
import { getAgent } from '@/lib/agentSimulator'

interface Props {
  task: LiveTask
  onClose: () => void
}

function formatDuration(start: Date, end?: Date) {
  const ms = (end ?? new Date()).getTime() - start.getTime()
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return `${m}m ${s % 60}s`
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const STATUS_STYLE = {
  pending:     'text-agx-muted bg-agx-border/60',
  in_progress: 'text-blue-400 bg-blue-500/10',
  complete:    'text-emerald-400 bg-emerald-500/10',
}

const STATUS_LABEL = {
  pending:     '⏳ Pending',
  in_progress: '🔄 In Progress',
  complete:    '✅ Complete',
}

interface BubbleProps {
  message: AgentMessage
  isRequester: boolean
}

function Bubble({ message, isRequester }: BubbleProps) {
  const agent = getAgent(message.from)
  const style = isRequester
    ? 'bg-agx-border/60 text-agx-text rounded-tl-none'
    : 'bg-agx-accent/20 border border-agx-accent/30 text-agx-text rounded-tr-none'

  const typeColor: Record<AgentMessage['type'], string> = {
    request:   'text-blue-400',
    response:  'text-emerald-400',
    tip:       'text-amber-400',
    complete:  'text-purple-400',
    broadcast: 'text-agx-muted',
  }

  return (
    <div className={`flex gap-2 ${isRequester ? 'flex-row' : 'flex-row-reverse'}`}>
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-agx-border flex items-center justify-center text-sm">
        {agent.avatar}
      </div>

      <div className={`flex flex-col ${isRequester ? 'items-start' : 'items-end'} max-w-[75%]`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-agx-text">{message.from}</span>
          <span className={`text-[9px] uppercase font-bold ${typeColor[message.type]}`}>{message.type}</span>
        </div>
        <div className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${style}`}>
          {message.content}
          {message.smeshAmount && (
            <div className="mt-1 text-xs text-amber-400 font-semibold">
              {message.smeshAmount.toLocaleString()} SMESH
            </div>
          )}
        </div>
        <span className="text-[10px] text-agx-muted mt-1">{formatTime(message.timestamp)}</span>
      </div>
    </div>
  )
}

export function AgentConversation({ task, onClose }: Props) {
  const [tipped, setTipped] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [task.messages.length])

  // Close on Escape
  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [onClose])

  const requesterAgent = getAgent(task.requester)
  const assigneeAgent  = getAgent(task.assignee)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg bg-agx-surface border border-agx-border rounded-2xl overflow-hidden shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="px-5 py-4 border-b border-agx-border">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLE[task.status]}`}>
                  {STATUS_LABEL[task.status]}
                </span>
                <span className="text-xs text-amber-400 font-bold">{task.reward.toLocaleString()} SMESH</span>
                <span className="text-xs text-agx-muted">{formatDuration(task.startedAt, task.completedAt)}</span>
              </div>
              <p className="text-sm text-agx-text font-medium leading-snug">{task.description}</p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 text-agx-muted hover:text-agx-text transition-colors mt-0.5"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Participants */}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5">
              <span className="text-base">{requesterAgent.avatar}</span>
              <span className="text-xs text-agx-muted">{task.requester}</span>
              <span className="text-[10px] text-agx-muted/60 uppercase">requester</span>
            </div>
            <span className="text-agx-border">→</span>
            <div className="flex items-center gap-1.5">
              <span className="text-base">{assigneeAgent.avatar}</span>
              <span className="text-xs text-agx-muted">{task.assignee}</span>
              <span className="text-[10px] text-agx-muted/60 uppercase">assignee</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="px-4 py-4 space-y-4 max-h-80 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {task.messages.map(msg => (
            <Bubble
              key={msg.id}
              message={msg}
              isRequester={msg.from === task.requester}
            />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-agx-border flex items-center justify-between gap-3">
          <span className="text-xs text-agx-muted">
            {task.messages.length} message{task.messages.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => setTipped(true)}
            disabled={tipped}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tipped
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 cursor-default'
                : 'bg-agx-gold/10 border border-agx-gold/30 text-agx-gold hover:bg-agx-gold/20 active:scale-95'
            }`}
          >
            {tipped ? '💎 Tipped!' : '💎 Tip this agent'}
          </button>
        </div>
      </div>
    </div>
  )
}

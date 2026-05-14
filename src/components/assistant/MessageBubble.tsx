import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { Bell, CalendarPlus, ArrowRight } from 'lucide-react'
import { AREAS } from '@/data/areas'
import { RichText } from './RichText'
import type { ActionReceipt, ChatMessage } from '@/types'

/**
 * Single message bubble. User on the right (accent-tinted), assistant on the
 * left (surface bubble). Assistant content goes through RichText so light
 * markdown renders properly. When the message has receipts attached (the
 * assistant scheduled something), they render as compact chips underneath
 * the bubble, each deep-linking to its destination (/reminders or
 * /schedule).
 *
 * Each bubble shows its hh:mm timestamp under the content so the
 * conversation reads chronologically even if you scroll back days later.
 */
export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  const ts = format(parseISO(message.createdAt), 'h:mm a')
  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div className={`max-w-[88%] flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={
            isUser
              ? 'rounded-2xl rounded-br-sm bg-accent text-white px-3.5 py-2.5 text-sm shadow-card'
              : 'rounded-2xl rounded-bl-sm bg-surface2/60 border border-border/30 px-3.5 py-2.5 text-sm text-text'
          }
        >
          {isUser ? message.content : <RichText text={message.content} />}
        </div>
        {message.actions && message.actions.length > 0 && (
          <div className="flex flex-col gap-1 w-full max-w-[420px]">
            {message.actions.map((r, i) => (
              <ReceiptChip key={i} r={r} />
            ))}
          </div>
        )}
        <div
          className={`text-[10px] text-muted/70 tabular-nums px-1 ${
            isUser ? 'text-right' : 'text-left'
          }`}
        >
          {ts}
        </div>
      </div>
    </div>
  )
}

function ReceiptChip({ r }: { r: ActionReceipt }) {
  const Icon = r.kind === 'reminder' ? Bell : CalendarPlus
  const to = r.kind === 'reminder' ? '/reminders' : '/plan?v=week'
  const area = AREAS[r.category]
  return (
    <Link
      to={to}
      className="group flex items-center gap-2 rounded-lg border border-border/30 bg-surface2/40 px-2.5 py-1.5 text-xs hover:border-accent/40 hover:bg-surface2/60 transition-colors"
    >
      <span
        className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center"
        style={{
          background: `rgb(var(--${area.color}) / 0.15)`,
          color: `rgb(var(--${area.color}))`,
        }}
      >
        <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-text truncate">{r.title}</div>
        <div className="text-[10px] text-muted truncate">{r.when}</div>
      </div>
      <ArrowRight className="w-3 h-3 text-muted group-hover:text-accent transition-colors shrink-0" />
    </Link>
  )
}

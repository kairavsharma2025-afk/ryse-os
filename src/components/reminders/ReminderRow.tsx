import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { Clock, RotateCw, AlarmClock, Trash2, Flag, Target, Sparkles } from 'lucide-react'
import { AREAS } from '@/data/areas'
import { useReminders } from '@/stores/remindersStore'
import type { Goal, Reminder } from '@/types'

/**
 * One row in the reminders list. Tap the title region to open the edit modal
 * (parent supplies onOpen). Inline affordances: check (toggle done), snooze
 * (push 10 min), delete.
 */
export function ReminderRow({
  reminder,
  next,
  goal,
  onOpen,
}: {
  reminder: Reminder
  next: Date | null
  goal?: Goal
  onOpen: (r: Reminder) => void
}) {
  const toggleDone = useReminders((s) => s.toggleDone)
  const snoozeReminder = useReminders((s) => s.snoozeReminder)
  const deleteReminder = useReminders((s) => s.deleteReminder)

  const area = AREAS[reminder.category]
  const overdueNotDone = next === null && reminder.repeat === 'once' && !reminder.done
  const isHigh = reminder.priority === 'high'

  return (
    <li
      className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
        reminder.done
          ? 'border-border/30 bg-surface2/20 opacity-55'
          : 'border-border/40 bg-surface2/30 hover:border-accent/30'
      }`}
    >
      <button
        onClick={() => toggleDone(reminder.id)}
        className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] transition-colors ${
          reminder.done
            ? 'bg-accent border-accent text-white'
            : 'border-border text-transparent hover:border-accent'
        }`}
        aria-label={reminder.done ? 'Mark not done' : 'Mark done'}
      >
        ✓
      </button>
      <span
        className="shrink-0 w-1.5 h-9 rounded-full"
        style={{ background: `rgb(var(--${area.color}))` }}
      />
      <button onClick={() => onOpen(reminder)} className="min-w-0 flex-1 text-left">
        <div
          className={`text-sm flex items-center gap-1.5 ${
            reminder.done ? 'line-through text-muted' : 'text-text'
          }`}
        >
          {isHigh && (
            <Flag className="w-3 h-3 shrink-0 text-red-400" strokeWidth={2.4} />
          )}
          <span className="truncate">{reminder.title}</span>
        </div>
        <div className="text-[11px] text-muted flex items-center gap-1.5 flex-wrap mt-0.5">
          <Clock className="w-3 h-3" />
          <span className={overdueNotDone ? 'text-red-400/90' : ''}>
            {next
              ? format(next, "EEE, MMM d 'at' h:mm a")
              : `${format(parseISO(reminder.date), 'MMM d')} ${reminder.time}${
                  overdueNotDone ? ' · passed' : ''
                }`}
          </span>
          <span className="text-muted/40">·</span>
          <span>{area.name}</span>
          {reminder.repeat !== 'once' && (
            <span className="inline-flex items-center gap-0.5">
              <span className="text-muted/40">·</span>
              <RotateCw className="w-3 h-3" />
              {reminder.repeat}
            </span>
          )}
          {reminder.snoozedUntil && (
            <span className="inline-flex items-center gap-0.5 text-accent2/80">
              <span className="text-muted/40">·</span>
              <AlarmClock className="w-3 h-3" />
              snoozed
            </span>
          )}
          {goal && (
            <Link
              to={`/goals/${goal.id}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-0.5 text-accent2/80 hover:text-accent"
            >
              <span className="text-muted/40">·</span>
              <Target className="w-3 h-3" />
              {goal.title}
            </Link>
          )}
          {reminder.source === 'assistant' && (
            <span className="inline-flex items-center gap-0.5 text-accent2/80">
              <span className="text-muted/40">·</span>
              <Sparkles className="w-3 h-3" />
              assistant
            </span>
          )}
        </div>
      </button>
      <button
        onClick={() => snoozeReminder(reminder.id)}
        className="shrink-0 p-1.5 rounded-lg text-muted hover:text-accent hover:bg-surface2/50 transition-colors"
        title="Snooze 10 min"
        aria-label="Snooze reminder"
      >
        <AlarmClock className="w-4 h-4" />
      </button>
      <button
        onClick={() => deleteReminder(reminder.id)}
        className="shrink-0 p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-surface2/50 transition-colors"
        title="Delete"
        aria-label="Delete reminder"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </li>
  )
}

import { Flag, Trash2, User, Clock } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { AREAS } from '@/data/areas'
import { useTasks } from '@/stores/tasksStore'
import type { Task } from '@/types'

/**
 * Shared compact row used by Inbox, Matrix detail lists, and the Day agenda.
 * Tap the checkbox to mark done; tap the title to open whatever editor the
 * parent owns (passed via onOpen).
 */
export function TaskRow({
  task,
  onOpen,
  showDate = true,
}: {
  task: Task
  onOpen?: (t: Task) => void
  showDate?: boolean
}) {
  const toggle = useTasks((s) => s.toggleDone)
  const remove = useTasks((s) => s.deleteTask)
  const area = AREAS[task.category]
  const done = !!task.completedAt

  return (
    <li
      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
        done ? 'border-border/40 bg-surface/30 opacity-55' : 'border-border bg-surface2/30'
      }`}
    >
      <button
        onClick={() => toggle(task.id)}
        className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] transition-colors ${
          done ? 'bg-accent border-accent text-white' : 'border-border text-transparent hover:border-accent'
        }`}
        aria-label={done ? 'Mark not done' : 'Mark done'}
      >
        ✓
      </button>
      <span
        className="shrink-0 w-1.5 h-9 rounded-full"
        style={{ background: `rgb(var(--${area.color}))` }}
      />
      <button
        onClick={() => onOpen?.(task)}
        className="min-w-0 flex-1 text-left"
        disabled={!onOpen}
      >
        <div
          className={`text-sm leading-snug flex items-center gap-1.5 ${
            done ? 'line-through text-muted' : 'text-text'
          }`}
        >
          {task.priority === 1 && (
            <Flag className="w-3 h-3 shrink-0 text-red-400" strokeWidth={2.4} />
          )}
          <span className="truncate">{task.title}</span>
        </div>
        <div className="text-[11px] text-muted flex items-center gap-1.5 flex-wrap mt-0.5">
          <span>{area.name}</span>
          {showDate && task.dueDate && (
            <>
              <span className="text-muted/40">·</span>
              <Clock className="w-3 h-3" />
              {format(parseISO(task.dueDate), 'MMM d')}
            </>
          )}
          {task.assignedTo && (
            <>
              <span className="text-muted/40">·</span>
              <User className="w-3 h-3" />
              {task.assignedTo}
            </>
          )}
          {task.source === 'assistant' && <span className="text-accent2/80">· ★ assistant</span>}
          {task.energy && <span className="text-muted/70">· {task.energy}</span>}
        </div>
      </button>
      <button
        onClick={() => remove(task.id)}
        className="shrink-0 p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-surface2/50"
        aria-label="Delete task"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </li>
  )
}

import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useTasks } from '@/stores/tasksStore'
import { todayISO } from '@/engine/dates'
import { TaskRow } from './TaskRow'
import { TaskForm, type TaskDraft } from './TaskForm'
import { AREAS } from '@/data/areas'
import type { Task } from '@/types'

type QuadrantId = 'do' | 'plan' | 'delegate' | 'drop'

interface QuadrantDef {
  id: QuadrantId
  title: string
  subtitle: string
  axis: { important: boolean; urgent: boolean }
  tone: string // bg accent
}

/**
 * Eisenhower matrix. A task is "urgent" when its dueDate ≤ today OR the user
 * explicitly flagged it urgent. "Important" is always user-set (or priority 1).
 *
 *   ┌──────────────┬──────────────┐
 *   │  DO  (P1)    │  PLAN (P2)   │
 *   │ urgent +     │ not urgent + │
 *   │ important    │ important    │
 *   ├──────────────┼──────────────┤
 *   │ DELEGATE     │ DROP         │
 *   │ urgent +     │ neither      │
 *   │ not imp.     │              │
 *   └──────────────┴──────────────┘
 */
const QUADRANTS: QuadrantDef[] = [
  {
    id: 'do',
    title: 'Do',
    subtitle: 'Urgent · Important',
    axis: { urgent: true, important: true },
    tone: 'rgb(var(--danger))',
  },
  {
    id: 'plan',
    title: 'Plan',
    subtitle: 'Important · Not urgent',
    axis: { urgent: false, important: true },
    tone: 'rgb(var(--accent))',
  },
  {
    id: 'delegate',
    title: 'Delegate',
    subtitle: 'Urgent · Not important',
    axis: { urgent: true, important: false },
    tone: 'rgb(var(--warning))',
  },
  {
    id: 'drop',
    title: 'Drop',
    subtitle: 'Neither',
    axis: { urgent: false, important: false },
    tone: 'rgb(var(--muted))',
  },
]

export function PlanMatrix() {
  const tasks = useTasks((s) => s.tasks)
  const updateTask = useTasks((s) => s.updateTask)
  const addTask = useTasks((s) => s.addTask)
  const deleteTask = useTasks((s) => s.deleteTask)
  const [editing, setEditing] = useState<Task | null>(null)
  const [addingFor, setAddingFor] = useState<QuadrantDef | null>(null)

  const buckets = useMemo(() => {
    const today = todayISO()
    const isUrgent = (t: Task) =>
      t.urgent || t.priority === 1 || (!!t.dueDate && t.dueDate <= today)
    const isImportant = (t: Task) => t.important || t.priority <= 2

    const open = tasks.filter((t) => !t.completedAt)
    const map: Record<QuadrantId, Task[]> = { do: [], plan: [], delegate: [], drop: [] }
    for (const t of open) {
      const u = isUrgent(t)
      const i = isImportant(t)
      if (u && i) map.do.push(t)
      else if (!u && i) map.plan.push(t)
      else if (u && !i) map.delegate.push(t)
      else map.drop.push(t)
    }
    for (const k of Object.keys(map) as QuadrantId[]) {
      map[k].sort(
        (a, b) =>
          a.priority - b.priority ||
          (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999') ||
          a.title.localeCompare(b.title)
      )
    }
    return map
  }, [tasks])

  const handleSave = (v: TaskDraft, id?: string, quadrant?: QuadrantDef) => {
    // For a new task from a quadrant button, force the axis flags so it
    // immediately lands in that bucket.
    const ax = quadrant ? quadrant.axis : { important: v.important, urgent: v.urgent }
    const payload = {
      title: v.title,
      notes: v.notes || undefined,
      category: v.category,
      priority: v.priority,
      important: ax.important,
      urgent: ax.urgent,
      dueDate: v.dueDate || undefined,
      assignedTo: v.assignedTo || undefined,
      followUpDate: v.followUpDate || undefined,
      energy: v.energy || undefined,
    }
    if (id) updateTask(id, payload)
    else addTask({ ...payload, source: 'manual' })
    setEditing(null)
    setAddingFor(null)
  }

  return (
    <div className="space-y-5">
      <div className="text-xs text-muted">
        Tap a quadrant to add a task there. <span className="text-muted/60">P1 and overdue auto-rank as urgent + important.</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {QUADRANTS.map((q) => {
          const list = buckets[q.id]
          return (
            <div
              key={q.id}
              className="rounded-2xl border border-border/10 bg-surface p-4 flex flex-col gap-3 min-h-[160px]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ background: q.tone }}
                    />
                    <div className="font-display text-md tracking-wide">{q.title}</div>
                  </div>
                  <div className="text-[11px] text-muted mt-0.5 uppercase tracking-wider">
                    {q.subtitle}
                  </div>
                </div>
                <button
                  onClick={() => setAddingFor(q)}
                  className="shrink-0 w-7 h-7 rounded-lg bg-surface2/60 hover:bg-surface2 border border-border/40 flex items-center justify-center text-muted hover:text-text"
                  aria-label={`Add to ${q.title}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {list.length === 0 ? (
                <div className="text-[11px] text-muted/60 italic flex-1 flex items-center justify-center py-4">
                  empty
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {list.slice(0, 6).map((t) => (
                    <CompactRow key={t.id} task={t} onOpen={setEditing} />
                  ))}
                  {list.length > 6 && (
                    <li className="text-[11px] text-muted pl-2">+{list.length - 6} more</li>
                  )}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      <Modal
        open={addingFor !== null}
        onClose={() => setAddingFor(null)}
        title={addingFor ? `New task → ${addingFor.title}` : 'New task'}
        size="sm"
      >
        {addingFor && (
          <TaskForm
            initial={{
              important: addingFor.axis.important,
              urgent: addingFor.axis.urgent,
            }}
            onSave={(v) => handleSave(v, undefined, addingFor)}
            onCancel={() => setAddingFor(null)}
          />
        )}
      </Modal>
      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Edit task" size="sm">
        {editing && (
          <TaskForm
            initial={editing}
            onSave={(v) => handleSave(v, editing.id)}
            onCancel={() => setEditing(null)}
            onDelete={() => {
              deleteTask(editing.id)
              setEditing(null)
            }}
          />
        )}
      </Modal>
    </div>
  )
}

/** Compact one-line row used inside the matrix quadrants. */
function CompactRow({ task, onOpen }: { task: Task; onOpen: (t: Task) => void }) {
  const toggle = useTasks((s) => s.toggleDone)
  const area = AREAS[task.category]
  const done = !!task.completedAt
  return (
    <li className="flex items-center gap-2 rounded-lg bg-surface2/40 border border-border/10 px-2 py-1.5">
      <button
        onClick={(e) => {
          e.stopPropagation()
          toggle(task.id)
        }}
        className={`shrink-0 w-4 h-4 rounded-full border flex items-center justify-center text-[8px] ${
          done ? 'bg-accent border-accent text-white' : 'border-border text-transparent hover:border-accent'
        }`}
        aria-label="toggle done"
      >
        ✓
      </button>
      <span
        className="shrink-0 w-1 h-5 rounded-full"
        style={{ background: `rgb(var(--${area.color}))` }}
      />
      <button onClick={() => onOpen(task)} className="text-left text-xs truncate flex-1 min-w-0">
        <span className={done ? 'line-through text-muted' : ''}>{task.title}</span>
      </button>
      <span className="shrink-0 text-[10px] text-muted/70 font-bold">P{task.priority}</span>
    </li>
  )
}

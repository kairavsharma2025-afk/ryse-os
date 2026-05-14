import { useMemo, useState } from 'react'
import { Inbox, Plus, Users, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Empty } from '@/components/ui/Empty'
import { Modal } from '@/components/ui/Modal'
import { useTasks } from '@/stores/tasksStore'
import { todayISO } from '@/engine/dates'
import { TaskRow } from './TaskRow'
import { TaskForm, type TaskDraft } from './TaskForm'
import { AREA_LIST } from '@/data/areas'
import type { AreaId, Task } from '@/types'

/**
 * Inbox view — every task that isn't completed, plus a separate Delegated
 * (waiting-on) lane and a recently-completed strip.
 */
export function PlanInbox() {
  const tasks = useTasks((s) => s.tasks)
  const addTask = useTasks((s) => s.addTask)
  const updateTask = useTasks((s) => s.updateTask)
  const deleteTask = useTasks((s) => s.deleteTask)

  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [filter, setFilter] = useState<'all' | AreaId>('all')

  const { open, delegated, done } = useMemo(() => {
    const today = todayISO()
    const open: Task[] = []
    const delegated: Task[] = []
    const done: Task[] = []
    for (const t of tasks) {
      if (t.completedAt) {
        done.push(t)
        continue
      }
      if (t.assignedTo) delegated.push(t)
      else open.push(t)
    }
    const prioRank = (t: Task) =>
      t.priority * 100 +
      // Pull overdue/today to the top within a priority bucket.
      (t.dueDate && t.dueDate <= today ? 0 : 50)
    open.sort(
      (a, b) =>
        prioRank(a) - prioRank(b) ||
        (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999') ||
        a.title.localeCompare(b.title)
    )
    delegated.sort((a, b) =>
      (a.followUpDate ?? '9999').localeCompare(b.followUpDate ?? '9999')
    )
    done.sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
    return { open, delegated, done: done.slice(0, 8) }
  }, [tasks])

  const filtered = filter === 'all' ? open : open.filter((t) => t.category === filter)

  const handleSave = (v: TaskDraft, id?: string) => {
    const payload = {
      title: v.title,
      notes: v.notes || undefined,
      category: v.category,
      priority: v.priority,
      important: v.important,
      urgent: v.urgent,
      dueDate: v.dueDate || undefined,
      assignedTo: v.assignedTo || undefined,
      followUpDate: v.followUpDate || undefined,
      energy: v.energy || undefined,
    }
    if (id) updateTask(id, payload)
    else addTask({ ...payload, source: 'manual' })
    setAdding(false)
    setEditing(null)
  }

  if (open.length === 0 && delegated.length === 0 && done.length === 0) {
    return (
      <>
        <Empty
          icon={Inbox}
          title="Inbox zero."
          body="Capture anything you don't want to forget. Quick-Add (+) anywhere in the app drops it here."
          cta={<Button onClick={() => setAdding(true)}>New task</Button>}
        />
        <NewTaskModal open={adding} onClose={() => setAdding(false)} onSave={handleSave} />
      </>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1 overflow-x-auto -mx-1 px-1 flex-1 min-w-0">
          <FilterPill active={filter === 'all'} onClick={() => setFilter('all')} label="All" count={open.length} />
          {AREA_LIST.map((a) => {
            const count = open.filter((t) => t.category === a.id).length
            if (count === 0 && filter !== a.id) return null
            return (
              <FilterPill
                key={a.id}
                active={filter === a.id}
                onClick={() => setFilter(a.id)}
                label={a.name}
                count={count}
                color={a.color}
              />
            )
          })}
        </div>
        <Button size="sm" onClick={() => setAdding(true)} className="shrink-0">
          <Plus className="w-3.5 h-3.5" />
          New task
        </Button>
      </div>

      {filtered.length > 0 ? (
        <Card className="p-4">
          <SectionLabel icon={Inbox}>Open · {filtered.length}</SectionLabel>
          <ul className="space-y-2">
            {filtered.map((t) => (
              <TaskRow key={t.id} task={t} onOpen={setEditing} />
            ))}
          </ul>
        </Card>
      ) : (
        <Card className="p-6 text-center text-sm text-muted">
          No open tasks in this category. Pick another filter or hit New task.
        </Card>
      )}

      {delegated.length > 0 && (
        <Card className="p-4">
          <SectionLabel icon={Users}>Waiting on · {delegated.length}</SectionLabel>
          <ul className="space-y-2">
            {delegated.map((t) => (
              <TaskRow key={t.id} task={t} onOpen={setEditing} />
            ))}
          </ul>
        </Card>
      )}

      {done.length > 0 && (
        <Card className="p-4">
          <SectionLabel icon={CheckCircle2}>Recently completed</SectionLabel>
          <ul className="space-y-2">
            {done.map((t) => (
              <TaskRow key={t.id} task={t} onOpen={setEditing} />
            ))}
          </ul>
        </Card>
      )}

      <NewTaskModal open={adding} onClose={() => setAdding(false)} onSave={handleSave} />
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

function NewTaskModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean
  onClose: () => void
  onSave: (v: TaskDraft) => void
}) {
  return (
    <Modal open={open} onClose={onClose} title="New task" size="sm">
      <TaskForm onSave={onSave} onCancel={onClose} />
    </Modal>
  )
}

function FilterPill({
  active,
  onClick,
  label,
  count,
  color,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
  color?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 h-8 rounded-full text-xs border transition-colors duration-80 ${
        active
          ? 'bg-accent text-white border-accent font-semibold'
          : 'bg-surface2/40 text-muted hover:text-text border-border/40'
      }`}
      style={color && active ? { background: `rgb(var(--${color}))`, borderColor: 'transparent' } : undefined}
    >
      {label}
      {count > 0 && (
        <span className={`ml-1.5 text-[10px] ${active ? 'opacity-90' : 'text-muted/60'}`}>{count}</span>
      )}
    </button>
  )
}

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: typeof Inbox
  children: React.ReactNode
}) {
  return (
    <div className="text-[10px] uppercase tracking-[0.28em] text-muted mb-3 px-1 flex items-center gap-1.5">
      <Icon className="w-3 h-3" />
      <span>{children}</span>
    </div>
  )
}

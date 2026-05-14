import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { AREA_LIST } from '@/data/areas'
import { todayISO } from '@/engine/dates'
import type { AreaId, Task, TaskPriority } from '@/types'

/**
 * Shared task editor — used by Inbox/Matrix new-task modals and the row tap-to-edit path.
 * `initial` undefined → blank create; otherwise pre-fill from the task being edited.
 */
export interface TaskDraft {
  title: string
  notes: string
  category: AreaId
  priority: TaskPriority
  important: boolean
  urgent: boolean
  dueDate: string // '' when unset
  assignedTo: string // '' when unset
  followUpDate: string // '' when unset
  energy: '' | 'deep' | 'shallow' | 'recovery' | 'social'
}

const inputCls =
  'w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50'
const labelCls = 'text-[10px] uppercase tracking-[0.2em] text-muted mb-1.5 block'
const segCls = (active: boolean) =>
  `px-2 py-2 rounded-lg border text-xs transition ${
    active
      ? 'border-accent bg-accent/10 text-text'
      : 'border-border bg-surface2/40 text-muted hover:text-text'
  }`

export function TaskForm({
  initial,
  onSave,
  onCancel,
  onDelete,
}: {
  initial?: Partial<Task>
  onSave(v: TaskDraft): void
  onCancel(): void
  onDelete?(): void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [category, setCategory] = useState<AreaId>(initial?.category ?? 'career')
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority ?? 2)
  const [important, setImportant] = useState<boolean>(initial?.important ?? false)
  const [urgent, setUrgent] = useState<boolean>(initial?.urgent ?? false)
  const [dueDate, setDueDate] = useState<string>(initial?.dueDate ?? '')
  const [assignedTo, setAssignedTo] = useState<string>(initial?.assignedTo ?? '')
  const [followUpDate, setFollowUpDate] = useState<string>(initial?.followUpDate ?? '')
  const [energy, setEnergy] = useState<TaskDraft['energy']>(
    (initial?.energy as TaskDraft['energy']) ?? ''
  )

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      notes: notes.trim(),
      category,
      priority,
      important,
      urgent,
      dueDate,
      assignedTo: assignedTo.trim(),
      followUpDate,
      energy,
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className={labelCls}>Task</label>
        <input
          className={inputCls}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Draft Q3 retro"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Due (optional)</label>
          <input
            type="date"
            className={inputCls}
            value={dueDate || ''}
            min={todayISO()}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Priority</label>
          <div className="flex gap-1.5">
            {([1, 2, 3, 4] as TaskPriority[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`flex-1 ${segCls(priority === p)} font-bold`}
              >
                P{p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setImportant((v) => !v)}
          className={segCls(important)}
        >
          {important ? '✓ Important' : 'Mark important'}
        </button>
        <button type="button" onClick={() => setUrgent((v) => !v)} className={segCls(urgent)}>
          {urgent ? '✓ Urgent' : 'Mark urgent'}
        </button>
      </div>

      <div>
        <label className={labelCls}>Category</label>
        <div className="grid grid-cols-3 gap-2">
          {AREA_LIST.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setCategory(a.id)}
              className={segCls(category === a.id)}
            >
              {a.emoji} {a.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls}>Energy (optional)</label>
        <div className="grid grid-cols-4 gap-2">
          {(['deep', 'shallow', 'recovery', 'social'] as const).map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEnergy(energy === e ? '' : e)}
              className={segCls(energy === e)}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <details className="rounded-lg border border-border/40 bg-surface2/30 px-3 py-2">
        <summary className="text-xs text-muted cursor-pointer select-none">
          Delegate / waiting on someone
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Assigned to</label>
            <input
              className={inputCls}
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="e.g. Priya"
            />
          </div>
          <div>
            <label className={labelCls}>Follow up</label>
            <input
              type="date"
              className={inputCls}
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
            />
          </div>
        </div>
      </details>

      <div>
        <label className={labelCls}>Notes (optional)</label>
        <textarea
          className={`${inputCls} resize-none`}
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit">Save task</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        {onDelete && (
          <Button type="button" variant="danger" onClick={onDelete} className="ml-auto">
            Delete
          </Button>
        )}
      </div>
    </form>
  )
}

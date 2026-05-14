import { useState, type FormEvent } from 'react'
import { Flag } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AREA_LIST, AREAS } from '@/data/areas'
import { todayISO } from '@/engine/dates'
import type { AreaId, Goal, Reminder, ReminderPriority, ReminderRepeat } from '@/types'

const REPEATS: { id: ReminderRepeat; label: string }[] = [
  { id: 'once', label: 'Once' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
]
const PRIORITIES: { id: ReminderPriority; label: string }[] = [
  { id: 'low', label: 'Low' },
  { id: 'normal', label: 'Normal' },
  { id: 'high', label: 'High' },
]

const inputCls =
  'w-full bg-surface2 border border-border/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/60 transition-colors'
const labelCls = 'text-[10px] uppercase tracking-[0.2em] text-muted mb-1.5 block'

function segCls(active: boolean) {
  return `px-2 py-2 rounded-lg border text-xs transition-colors ${
    active
      ? 'border-accent bg-accent/10 text-text'
      : 'border-border/40 bg-surface2/40 text-muted hover:text-text'
  }`
}

export interface ReminderFormDraft {
  title: string
  date: string
  time: string
  repeat: ReminderRepeat
  category: AreaId
  notes: string
  priority: ReminderPriority
  goalId: string
}

/**
 * Modal form body. Used for both create and edit — `initial` shapes the
 * defaults, parent owns the open/close + persistence.
 */
export function ReminderForm({
  initial,
  goals,
  onSave,
  onCancel,
}: {
  initial?: Partial<Reminder>
  goals: Goal[]
  onSave: (v: ReminderFormDraft) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [date, setDate] = useState(initial?.date ?? todayISO())
  const [time, setTime] = useState(initial?.time ?? '09:00')
  const [repeat, setRepeat] = useState<ReminderRepeat>(initial?.repeat ?? 'once')
  const [category, setCategory] = useState<AreaId>(initial?.category ?? 'mind')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [priority, setPriority] = useState<ReminderPriority>(initial?.priority ?? 'normal')
  const [goalId, setGoalId] = useState(initial?.goalId ?? '')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      date,
      time,
      repeat,
      category,
      notes: notes.trim(),
      priority,
      goalId,
    })
  }

  const dateLabel = repeat === 'weekly' || repeat === 'monthly' ? 'Starting' : 'Date'

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className={labelCls}>Remind me to…</label>
        <input
          className={inputCls}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Call Mom"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>{dateLabel}</label>
          <input
            type="date"
            className={inputCls}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Time</label>
          <input
            type="time"
            className={inputCls}
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Repeat</label>
        <div className="grid grid-cols-4 gap-2">
          {REPEATS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRepeat(r.id)}
              className={segCls(repeat === r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls}>Priority</label>
        <div className="grid grid-cols-3 gap-2">
          {PRIORITIES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPriority(p.id)}
              className={`flex items-center justify-center gap-1 ${segCls(priority === p.id)}`}
            >
              {p.id === 'high' && <Flag className="w-3 h-3" strokeWidth={2.4} />}
              {p.label}
            </button>
          ))}
        </div>
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
        <label className={labelCls}>Linked goal (optional)</label>
        <select
          className={`${inputCls} appearance-none`}
          value={goalId}
          onChange={(e) => setGoalId(e.target.value)}
        >
          <option value="">— No linked goal —</option>
          {goals.map((g) => (
            <option key={g.id} value={g.id}>
              {AREAS[g.area].emoji} {g.title}
            </option>
          ))}
        </select>
      </div>

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
        <Button type="submit">Save reminder</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

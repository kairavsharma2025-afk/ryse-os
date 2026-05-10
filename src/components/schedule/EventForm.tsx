import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { AREA_LIST } from '@/data/areas'
import type { AreaId, ScheduleEvent } from '@/types'
import { todayISO } from '@/engine/dates'

export interface EventDraft {
  title: string
  date: string
  startTime: string
  endTime: string
  category: AreaId
  notes: string
}

interface Props {
  initial?: Partial<ScheduleEvent>
  defaultDate?: string
  onSave(draft: EventDraft): void
  onCancel(): void
  onDelete?(): void
}

const labelCls = 'text-[10px] uppercase tracking-[0.2em] text-muted mb-1.5 block'
const inputCls =
  'w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50'

export function EventForm({ initial, defaultDate, onSave, onCancel, onDelete }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [date, setDate] = useState(initial?.date ?? defaultDate ?? todayISO())
  const [startTime, setStartTime] = useState(initial?.startTime ?? '09:00')
  const [endTime, setEndTime] = useState(initial?.endTime ?? '10:00')
  const [category, setCategory] = useState<AreaId>(initial?.category ?? 'career')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const end = endTime > startTime ? endTime : startTime
    onSave({ title: title.trim(), date, startTime, endTime: end, category, notes: notes.trim() })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className={labelCls}>What</label>
        <input
          className={inputCls}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Deep work — interview prep"
          autoFocus
        />
      </div>
      <div>
        <label className={labelCls}>Day</label>
        <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Start</label>
          <input
            type="time"
            className={inputCls}
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>End</label>
          <input
            type="time"
            className={inputCls}
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
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
              className={`px-2 py-2 rounded-lg border text-xs transition ${
                category === a.id
                  ? 'border-accent bg-accent/10 text-text'
                  : 'border-border bg-surface2/40 text-muted hover:text-text'
              }`}
            >
              {a.emoji} {a.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className={labelCls}>Notes (optional)</label>
        <textarea
          className={`${inputCls} resize-none`}
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything to remember about this block"
        />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Button type="submit">Save</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        {onDelete && (
          <Button type="button" variant="danger" className="ml-auto" onClick={onDelete}>
            Delete
          </Button>
        )}
      </div>
    </form>
  )
}

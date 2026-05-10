import { useMemo, useState, type FormEvent } from 'react'
import { format, parseISO } from 'date-fns'
import { Bell, BellPlus, Clock, Trash2, Bot, RotateCw, AlarmClock, Flag, Target } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Card } from '@/components/ui/Card'
import { Empty } from '@/components/ui/Empty'
import { useReminders } from '@/stores/remindersStore'
import { useAssistant } from '@/stores/assistantStore'
import { useSettings } from '@/stores/settingsStore'
import { useGoals } from '@/stores/goalsStore'
import { AREA_LIST, AREAS } from '@/data/areas'
import { todayISO } from '@/engine/dates'
import { nextFireTime } from '@/engine/remindersEngine'
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
const prioRank = (r: Reminder): number => (r.priority === 'high' ? 0 : r.priority === 'low' ? 2 : 1)

const inputCls =
  'w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50'
const labelCls = 'text-[10px] uppercase tracking-[0.2em] text-muted mb-1.5 block'
const segCls = (active: boolean) =>
  `px-2 py-2 rounded-lg border text-xs transition ${
    active ? 'border-accent bg-accent/10 text-text' : 'border-border bg-surface2/40 text-muted hover:text-text'
  }`

interface ReminderDraft {
  title: string
  date: string
  time: string
  repeat: ReminderRepeat
  category: AreaId
  notes: string
  priority: ReminderPriority
  goalId: string
}

function ReminderForm({
  initial,
  goals,
  onSave,
  onCancel,
}: {
  initial?: Partial<Reminder>
  goals: Goal[]
  onSave(v: ReminderDraft): void
  onCancel(): void
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
    onSave({ title: title.trim(), date, time, repeat, category, notes: notes.trim(), priority, goalId })
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
          <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Time</label>
          <input type="time" className={inputCls} value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Repeat</label>
        <div className="grid grid-cols-4 gap-2">
          {REPEATS.map((r) => (
            <button key={r.id} type="button" onClick={() => setRepeat(r.id)} className={segCls(repeat === r.id)}>
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
            <button key={a.id} type="button" onClick={() => setCategory(a.id)} className={segCls(category === a.id)}>
              {a.emoji} {a.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className={labelCls}>Linked goal (optional)</label>
        <select className={`${inputCls} appearance-none`} value={goalId} onChange={(e) => setGoalId(e.target.value)}>
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

export function Reminders() {
  const reminders = useReminders((s) => s.reminders)
  const addReminder = useReminders((s) => s.addReminder)
  const updateReminder = useReminders((s) => s.updateReminder)
  const deleteReminder = useReminders((s) => s.deleteReminder)
  const toggleDone = useReminders((s) => s.toggleDone)
  const snoozeReminder = useReminders((s) => s.snoozeReminder)
  const openAssistant = useAssistant((s) => s.setPanelOpen)
  const quietHours = useSettings((s) => s.quietHours)
  const goals = useGoals((s) => s.goals)
  const linkableGoals = useMemo(() => goals.filter((g) => !g.archivedAt && !g.completedAt), [goals])
  const goalById = useMemo(() => new Map(goals.map((g) => [g.id, g])), [goals])

  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Reminder | null>(null)

  const { active, archived } = useMemo(() => {
    const now = new Date()
    const decorated = reminders.map((r) => ({ r, next: nextFireTime(r, now, quietHours) }))
    const active = decorated
      .filter((x): x is { r: Reminder; next: Date } => x.next !== null)
      .sort(
        (a, b) =>
          Math.floor(a.next.getTime() / 60_000) - Math.floor(b.next.getTime() / 60_000) ||
          prioRank(a.r) - prioRank(b.r) ||
          a.next.getTime() - b.next.getTime()
      )
    const archived = decorated.filter((x) => x.next === null)
    return { active, archived }
  }, [reminders, quietHours])

  const dueSoonCount = useMemo(() => {
    const now = Date.now()
    return active.filter((x) => x.next.getTime() - now <= 2 * 3600_000 && x.next.getTime() >= now).length
  }, [active])

  const row = (r: Reminder, next: Date | null) => {
    const area = AREAS[r.category]
    const overdueNotDone = next === null && r.repeat === 'once' && !r.done
    const linkedGoal = r.goalId ? goalById.get(r.goalId) : undefined
    return (
      <li
        key={r.id}
        className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
          r.done ? 'border-border/50 bg-surface/40 opacity-60' : 'border-border bg-surface2/30'
        }`}
      >
        <button
          onClick={() => toggleDone(r.id)}
          className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
            r.done ? 'bg-accent border-accent text-bg' : 'border-border text-transparent hover:border-accent'
          }`}
          title={r.done ? 'Mark not done' : 'Mark done'}
        >
          ✓
        </button>
        <span className="shrink-0 w-1.5 h-9 rounded-full" style={{ background: `rgb(var(--${area.color}))` }} />
        <button onClick={() => setEditing(r)} className="min-w-0 flex-1 text-left">
          <div className={`text-sm truncate flex items-center gap-1.5 ${r.done ? 'line-through text-muted' : 'text-text'}`}>
            {r.priority === 'high' && <Flag className="w-3 h-3 shrink-0 text-red-400" strokeWidth={2.4} />}
            <span className="truncate">{r.title}</span>
          </div>
          <div className="text-[11px] text-muted flex items-center gap-1.5 flex-wrap">
            <Clock className="w-3 h-3" />
            {next
              ? format(next, "EEE, MMM d 'at' h:mm a")
              : `${format(parseISO(r.date), 'MMM d')} ${r.time}${overdueNotDone ? ' · passed' : ''}`}
            <span className="text-muted/40">·</span>
            {area.name}
            {r.repeat !== 'once' && (
              <span className="inline-flex items-center gap-0.5">
                <span className="text-muted/40">·</span>
                <RotateCw className="w-3 h-3" />
                {r.repeat}
              </span>
            )}
            {r.snoozedUntil && <span className="text-accent2/70">· snoozed</span>}
            {linkedGoal && (
              <span className="inline-flex items-center gap-0.5 text-accent2/80">
                <span className="text-muted/40">·</span>
                <Target className="w-3 h-3" />
                {linkedGoal.title}
              </span>
            )}
            {r.source === 'assistant' && <span className="text-accent2/80">· ★ assistant</span>}
          </div>
        </button>
        <button
          onClick={() => snoozeReminder(r.id)}
          className="shrink-0 p-1.5 rounded-lg text-muted hover:text-accent hover:bg-surface2/50"
          title="Snooze 10 min"
        >
          <AlarmClock className="w-4 h-4" />
        </button>
        <button
          onClick={() => deleteReminder(r.id)}
          className="shrink-0 p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-surface2/50"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </li>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl tracking-wide">Reminders</h1>
          <p className="text-sm text-muted mt-1">
            Desktop pings at the right moment.{' '}
            {dueSoonCount > 0 ? (
              <span className="text-accent">{dueSoonCount} in the next 2 hours.</span>
            ) : (
              'Nothing imminent.'
            )}
            {quietHours && (
              <span className="text-muted"> Quiet {quietHours.from}–{quietHours.to}.</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => openAssistant(true)}>
            <Bot className="w-3.5 h-3.5" />
            Ask the assistant
          </Button>
          <Button size="sm" onClick={() => setAdding(true)}>
            <BellPlus className="w-3.5 h-3.5" />
            New reminder
          </Button>
        </div>
      </div>

      {active.length === 0 && archived.length === 0 ? (
        <Empty
          icon={Bell}
          title="No reminders yet."
          body='Add one, or tell the Game Master "remind me to meditate at 7am every day."'
          cta={<Button onClick={() => setAdding(true)}>New reminder</Button>}
        />
      ) : (
        <>
          {active.length > 0 && (
            <Card className="p-4">
              <div className="text-[10px] uppercase tracking-[0.28em] text-muted mb-3 px-1">Upcoming</div>
              <ul className="space-y-2">{active.map((x) => row(x.r, x.next))}</ul>
            </Card>
          )}
          {archived.length > 0 && (
            <Card className="p-4">
              <div className="text-[10px] uppercase tracking-[0.28em] text-muted mb-3 px-1">Done &amp; past</div>
              <ul className="space-y-2">{archived.map((x) => row(x.r, x.next))}</ul>
            </Card>
          )}
        </>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="New reminder" size="sm">
        <ReminderForm
          goals={linkableGoals}
          onSave={(v) => {
            addReminder({
              title: v.title,
              date: v.date,
              time: v.time,
              repeat: v.repeat,
              category: v.category,
              notes: v.notes || undefined,
              priority: v.priority,
              goalId: v.goalId || undefined,
              source: 'manual',
            })
            setAdding(false)
          }}
          onCancel={() => setAdding(false)}
        />
      </Modal>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Edit reminder" size="sm">
        {editing && (
          <ReminderForm
            initial={editing}
            goals={linkableGoals}
            onSave={(v) => {
              updateReminder(editing.id, {
                title: v.title,
                date: v.date,
                time: v.time,
                repeat: v.repeat,
                category: v.category,
                notes: v.notes || undefined,
                priority: v.priority,
                goalId: v.goalId || undefined,
                lastFiredOn: undefined,
                snoozedUntil: undefined,
                done: false,
              })
              setEditing(null)
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  )
}

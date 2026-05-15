import { Fragment, useEffect, useMemo, useState } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckSquare, Bell, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAssistant } from '@/stores/assistantStore'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useSchedule } from '@/stores/scheduleStore'
import { useReminders } from '@/stores/remindersStore'
import { useTasks } from '@/stores/tasksStore'
import { useSettings } from '@/stores/settingsStore'
import { occursOn, fireTimeOn } from '@/engine/remindersEngine'
import { todayISO } from '@/engine/dates'
import { AREAS } from '@/data/areas'
import { EventForm, type EventDraft } from '@/components/schedule/EventForm'
import { TaskForm, type TaskDraft } from './TaskForm'
import { TaskRow } from './TaskRow'
import type { Reminder, ScheduleEvent, Task } from '@/types'

interface AgendaRow {
  type: 'event' | 'reminder'
  time: string // HH:mm or '' (all-day)
  id: string
  payload: ScheduleEvent | Reminder
  // Number of underlying entries this row represents. When the agenda has
  // two events with identical title/start/end we merge them into one row and
  // show a "N sources" badge so duplicates don't clutter the day.
  sources?: number
}

/**
 * Vertical agenda for a single day. Events + reminders ordered by time, tasks
 * due today/overdue grouped below as a focus list. Use the chevron buttons to
 * walk to nearby days; the date stamp resets to today on tab switch.
 */
export function PlanDay() {
  const events = useSchedule((s) => s.events)
  const addEvent = useSchedule((s) => s.addEvent)
  const updateEvent = useSchedule((s) => s.updateEvent)
  const deleteEvent = useSchedule((s) => s.deleteEvent)
  const reminders = useReminders((s) => s.reminders)
  const tasks = useTasks((s) => s.tasks)
  const addTask = useTasks((s) => s.addTask)
  const updateTask = useTasks((s) => s.updateTask)
  const deleteTask = useTasks((s) => s.deleteTask)
  const quietHours = useSettings((s) => s.quietHours)

  const today = todayISO()
  const [date, setDate] = useState<string>(today)
  const [addingEvent, setAddingEvent] = useState(false)
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null)
  const [addingTask, setAddingTask] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const agenda: AgendaRow[] = useMemo(() => {
    const rows: AgendaRow[] = []
    for (const e of events) {
      if (e.date !== date) continue
      rows.push({ type: 'event', time: e.startTime, id: e.id, payload: e })
    }
    for (const r of reminders) {
      if (!occursOn(r, date)) continue
      const t = fireTimeOn(r, date, quietHours)
      const hh = format(t, 'HH:mm')
      rows.push({ type: 'reminder', time: hh, id: r.id, payload: r })
    }
    rows.sort((a, b) => a.time.localeCompare(b.time))

    // Deduplicate identical events (same title + start + end). If two rows
    // overlap on those three keys we keep the first and bump its source
    // count so the UI can render a "N sources" badge.
    const out: AgendaRow[] = []
    const seen = new Map<string, AgendaRow>()
    for (const row of rows) {
      if (row.type !== 'event') {
        out.push(row)
        continue
      }
      const ev = row.payload as ScheduleEvent
      const key = `${ev.title.trim().toLowerCase()}|${ev.startTime}|${ev.endTime}`
      const prior = seen.get(key)
      if (prior) {
        prior.sources = (prior.sources ?? 1) + 1
        continue
      }
      seen.set(key, row)
      out.push(row)
    }
    return out
  }, [events, reminders, date, quietHours])

  const tasksForDay = useMemo(() => {
    const isFocus = (t: Task) =>
      !t.completedAt && !t.assignedTo && (t.dueDate === date || (date === today && !!t.dueDate && t.dueDate < date))
    return tasks
      .filter(isFocus)
      .sort(
        (a, b) =>
          a.priority - b.priority ||
          (a.dueDate ?? '').localeCompare(b.dueDate ?? '') ||
          a.title.localeCompare(b.title)
      )
  }, [tasks, date, today])

  const longLabel = format(parseISO(date), 'EEEE, MMMM d')
  const isToday = date === today

  // Re-tick every minute so the NOW marker slides between rows as time
  // advances. Only matters when viewing today.
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!isToday) return
    const t = setInterval(() => setTick((n) => n + 1), 60_000)
    return () => clearInterval(t)
  }, [isToday])

  const nowHHMM = (() => {
    const d = new Date()
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  })()

  // Index where the NOW line should sit — the first agenda row whose time is
  // strictly after the current time. -1 means NOW is past every row (line
  // renders at the bottom of the agenda).
  const nowIdx = useMemo(() => {
    if (!isToday) return null
    if (agenda.length === 0) return null
    for (let i = 0; i < agenda.length; i++) {
      if (agenda[i].time > nowHHMM) return i
    }
    return agenda.length
  }, [agenda, isToday, nowHHMM])

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setDate(format(addDays(parseISO(date), -1), 'yyyy-MM-dd'))}
          className="w-8 h-8 rounded-lg border border-border bg-surface2/40 text-muted hover:text-text flex items-center justify-center"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="min-w-[12rem] text-center">
          <div className="font-display text-lg tracking-wide">{longLabel}</div>
          {!isToday && (
            <button
              onClick={() => setDate(today)}
              className="text-[10px] uppercase tracking-wider text-accent hover:underline"
            >
              Jump to today
            </button>
          )}
        </div>
        <button
          onClick={() => setDate(format(addDays(parseISO(date), 1), 'yyyy-MM-dd'))}
          className="w-8 h-8 rounded-lg border border-border bg-surface2/40 text-muted hover:text-text flex items-center justify-center"
          aria-label="Next day"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setAddingTask(true)}>
            <Plus className="w-3.5 h-3.5" />
            Task
          </Button>
          <Button size="sm" onClick={() => setAddingEvent(true)}>
            <Plus className="w-3.5 h-3.5" />
            Event
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="text-[10px] uppercase tracking-[0.28em] text-muted mb-3 px-1 flex items-center gap-1.5">
          <CalendarIcon className="w-3 h-3" />
          Agenda
        </div>
        {agenda.length === 0 ? (
          <PlanEmptyState
            kind="agenda"
            title="Nothing scheduled."
            body={isToday ? 'A blank canvas — want a hand?' : 'Free day.'}
          />
        ) : (
          <ul className="relative">
            {/* Vertical rail */}
            <span
              className="absolute left-[58px] top-2 bottom-2 w-px bg-border/50"
              aria-hidden="true"
            />
            {agenda.map((row, i) => (
              <Fragment key={`${row.type}-${row.id}`}>
                {nowIdx === i && <NowLine time={nowHHMM} />}
                <AgendaRowView
                  row={row}
                  isLast={i === agenda.length - 1}
                  onOpenEvent={(e) => setEditingEvent(e)}
                />
              </Fragment>
            ))}
            {nowIdx === agenda.length && <NowLine time={nowHHMM} />}
          </ul>
        )}
      </Card>

      {tasksForDay.length > 0 && (
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-[0.28em] text-muted mb-3 px-1 flex items-center gap-1.5">
            <CheckSquare className="w-3 h-3" />
            Focus tasks {isToday && tasksForDay.some((t) => t.dueDate && t.dueDate < today) && (
              <span className="text-danger/90 normal-case tracking-normal">· overdue first</span>
            )}
          </div>
          <ul className="space-y-2">
            {tasksForDay.map((t) => (
              <TaskRow key={t.id} task={t} onOpen={setEditingTask} />
            ))}
          </ul>
        </Card>
      )}

      <Modal open={addingEvent} onClose={() => setAddingEvent(false)} title="New event" size="sm">
        <EventForm
          defaultDate={date}
          onSave={(draft: EventDraft) => {
            addEvent({ ...draft, notes: draft.notes || undefined, source: 'manual' })
            setAddingEvent(false)
          }}
          onCancel={() => setAddingEvent(false)}
        />
      </Modal>

      <Modal open={editingEvent !== null} onClose={() => setEditingEvent(null)} title="Edit event" size="sm">
        {editingEvent && (
          <EventForm
            initial={editingEvent}
            onSave={(draft) => {
              updateEvent(editingEvent.id, { ...draft, notes: draft.notes || undefined })
              setEditingEvent(null)
            }}
            onCancel={() => setEditingEvent(null)}
            onDelete={() => {
              deleteEvent(editingEvent.id)
              setEditingEvent(null)
            }}
          />
        )}
      </Modal>

      <Modal open={addingTask} onClose={() => setAddingTask(false)} title="New task" size="sm">
        <TaskForm
          initial={{ dueDate: date }}
          onSave={(v: TaskDraft) => {
            addTask({
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
              source: 'manual',
            })
            setAddingTask(false)
          }}
          onCancel={() => setAddingTask(false)}
        />
      </Modal>

      <Modal open={editingTask !== null} onClose={() => setEditingTask(null)} title="Edit task" size="sm">
        {editingTask && (
          <TaskForm
            initial={editingTask}
            onSave={(v) => {
              updateTask(editingTask.id, {
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
              })
              setEditingTask(null)
            }}
            onCancel={() => setEditingTask(null)}
            onDelete={() => {
              deleteTask(editingTask.id)
              setEditingTask(null)
            }}
          />
        )}
      </Modal>
    </div>
  )
}

function AgendaRowView({
  row,
  isLast,
  onOpenEvent,
}: {
  row: AgendaRow
  isLast: boolean
  onOpenEvent: (e: ScheduleEvent) => void
}) {
  if (row.type === 'event') {
    const e = row.payload as ScheduleEvent
    const area = AREAS[e.category]
    return (
      <li className={`flex gap-3 ${isLast ? '' : 'pb-3'} relative`}>
        <div className="shrink-0 w-[58px] pr-2 text-right tabular-nums text-xs text-muted pt-1.5">
          {row.time}
        </div>
        <span
          className="absolute left-[58px] w-2.5 h-2.5 rounded-full ring-2 ring-surface translate-x-[-5px] mt-2"
          style={{ background: `rgb(var(--${area.color}))` }}
          aria-hidden="true"
        />
        <button
          onClick={() => onOpenEvent(e)}
          className="flex-1 ml-3 rounded-lg hover:brightness-110 border border-border/40 px-3 py-2 text-left transition-colors"
          style={{
            // Calendar/time blocks: filled left border + faint category-tinted
            // background so they read as solid commitments distinct from
            // reminders (which are dashed/dim).
            borderLeft: `4px solid rgb(var(--${area.color}))`,
            background: `rgb(var(--${area.color}) / 0.10)`,
          }}
        >
          <div className="flex items-center gap-2 text-[10px] text-muted tabular-nums">
            <span>{e.startTime} – {e.endTime}</span>
            {row.sources && row.sources > 1 && (
              <span className="px-1.5 py-0.5 rounded-full bg-surface2/80 text-muted/90 border border-border/30 normal-case tracking-normal text-[9px]">
                {row.sources} sources
              </span>
            )}
          </div>
          <div className="text-sm text-text leading-snug font-medium">{e.title}</div>
          {e.notes && <div className="text-[11px] text-muted mt-0.5 line-clamp-2">{e.notes}</div>}
        </button>
      </li>
    )
  }
  const r = row.payload as Reminder
  const area = AREAS[r.category]
  return (
    <li className={`flex gap-3 ${isLast ? '' : 'pb-3'} relative`}>
      <div className="shrink-0 w-[58px] pr-2 text-right tabular-nums text-xs text-muted pt-1.5">
        {row.time}
      </div>
      <span
        className="absolute left-[58px] w-2.5 h-2.5 rounded-full ring-2 ring-surface translate-x-[-5px] mt-2 border-2"
        style={{ background: 'rgb(var(--surface))', borderColor: `rgb(var(--${area.color}))` }}
        aria-hidden="true"
      />
      <div
        className="flex-1 ml-3 rounded-lg bg-surface2/20 border border-border/30 px-3 py-2"
        style={{
          // Reminders use a dashed left border to set them apart from solid
          // calendar events at a glance.
          borderLeftWidth: '2px',
          borderLeftStyle: 'dashed',
          borderLeftColor: `rgb(var(--${area.color}) / 0.7)`,
        }}
      >
        <div className="text-[10px] text-muted uppercase tracking-wider flex items-center gap-1">
          <Bell className="w-3 h-3" /> Reminder
        </div>
        <div className={`text-sm leading-snug ${r.done ? 'line-through text-muted' : 'text-text'}`}>
          {r.title}
        </div>
      </div>
    </li>
  )
}

/** Red "NOW" marker line that slides between agenda rows as time advances. */
function NowLine({ time }: { time: string }) {
  return (
    <li
      className="relative flex items-center gap-3 py-1 select-none"
      aria-label={`Current time ${time}`}
    >
      <div className="shrink-0 w-[58px] pr-2 text-right text-[10px] font-bold tracking-wider text-danger">
        NOW
      </div>
      <span
        className="absolute left-[58px] w-2 h-2 rounded-full translate-x-[-4px]"
        style={{ background: 'rgb(var(--color-danger))', boxShadow: '0 0 0 3px rgb(239 68 68 / 0.25)' }}
        aria-hidden="true"
      />
      <div
        className="flex-1 ml-3 h-[2px]"
        style={{ background: 'rgb(var(--color-danger))' }}
        aria-hidden="true"
      />
      <span className="text-[10px] tabular-nums text-danger pr-1">{time}</span>
    </li>
  )
}

/**
 * Empty state for Plan tabs. Centered illustration + "Nothing here yet — want
 * me to help you plan it?" + button that opens the AI assistant.
 */
export function PlanEmptyState({
  kind,
  title,
  body,
}: {
  kind: 'agenda' | 'week' | 'matrix' | 'inbox' | 'notes'
  title: string
  body: string
}) {
  const openAssistant = useAssistant((s) => s.setPanelOpen)
  const nav = useNavigate()
  const emoji = ({
    agenda: '🗓️',
    week: '📆',
    matrix: '🔲',
    inbox: '📥',
    notes: '📝',
  } as const)[kind]
  return (
    <div className="py-10 px-4 text-center">
      <div className="text-4xl mb-3 select-none" aria-hidden="true">{emoji}</div>
      <div className="font-display text-lg text-text mb-1">{title}</div>
      <div className="text-sm text-muted max-w-sm mx-auto mb-4">{body}</div>
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <button
          onClick={() => openAssistant(true)}
          className="px-3 h-9 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5"
          style={{
            background: 'rgb(var(--color-ai))',
            color: 'white',
          }}
        >
          Help me plan it
        </button>
        {kind !== 'agenda' && (
          <button
            onClick={() => nav('/plan')}
            className="px-3 h-9 rounded-lg text-sm text-muted hover:text-text border border-border/40 transition-colors"
          >
            Back to Day
          </button>
        )}
      </div>
    </div>
  )
}

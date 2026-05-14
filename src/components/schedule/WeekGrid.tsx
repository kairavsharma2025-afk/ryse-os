import { useMemo, useState } from 'react'
import { addDays, addWeeks, format, startOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, CalendarPlus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useSchedule } from '@/stores/scheduleStore'
import { AREAS } from '@/data/areas'
import { todayISO } from '@/engine/dates'
import { EventForm, type EventDraft } from './EventForm'
import type { ScheduleEvent } from '@/types'

const fmtISO = (d: Date) => format(d, 'yyyy-MM-dd')

/**
 * The 7-column week grid extracted from the legacy Schedule page so both
 * /schedule and the Plan tab's Week view can drop it in without duplicating
 * the page-level header.
 *
 *   • Mon→Sun columns; today's column carries the accent border + glow
 *   • Per-event tap → edit modal; per-column "add" tap → new-event modal
 *   • Week-pager with "This week" reset
 *   • Sticky in-grid header bar showing the range + nav controls
 */
export function WeekGrid() {
  const events = useSchedule((s) => s.events)
  const addEvent = useSchedule((s) => s.addEvent)
  const updateEvent = useSchedule((s) => s.updateEvent)
  const deleteEvent = useSchedule((s) => s.deleteEvent)

  const [weekOffset, setWeekOffset] = useState(0)
  const [addFor, setAddFor] = useState<string | null>(null)
  const [editing, setEditing] = useState<ScheduleEvent | null>(null)

  const weekStart = useMemo(
    () => startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }),
    [weekOffset]
  )
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  )
  const today = todayISO()

  const byDay = useMemo(() => {
    const map: Record<string, ScheduleEvent[]> = {}
    for (const e of events) (map[e.date] ??= []).push(e)
    for (const k of Object.keys(map)) {
      map[k].sort(
        (a, b) =>
          a.startTime.localeCompare(b.startTime) || a.title.localeCompare(b.title)
      )
    }
    return map
  }, [events])

  const rangeLabel = `${format(weekStart, 'MMM d')} – ${format(addDays(weekStart, 6), 'MMM d')}`

  const handleSave = (draft: EventDraft) => {
    const values = { ...draft, notes: draft.notes || undefined }
    if (editing) updateEvent(editing.id, values)
    else addEvent({ ...values, source: 'manual' })
    setEditing(null)
    setAddFor(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="w-9 h-9 rounded-lg border border-border/40 bg-surface2/40 text-muted hover:text-text hover:border-accent/40 flex items-center justify-center transition-colors"
          aria-label="Previous week"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="font-display tracking-wide text-lg min-w-[10rem] text-center">
          {rangeLabel}
        </div>
        <button
          onClick={() => setWeekOffset((o) => o + 1)}
          className="w-9 h-9 rounded-lg border border-border/40 bg-surface2/40 text-muted hover:text-text hover:border-accent/40 flex items-center justify-center transition-colors"
          aria-label="Next week"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        {weekOffset !== 0 && (
          <Button variant="subtle" size="sm" onClick={() => setWeekOffset(0)}>
            This week
          </Button>
        )}
        <Button size="sm" onClick={() => setAddFor(today)} className="ml-auto">
          <CalendarPlus className="w-3.5 h-3.5" />
          Add event
        </Button>
      </div>

      <div className="overflow-x-auto -mx-1 px-1 py-1">
        <div className="grid grid-cols-[repeat(7,minmax(132px,1fr))] gap-2.5">
          {days.map((d) => {
            const iso = fmtISO(d)
            const isToday = iso === today
            const list = byDay[iso] ?? []
            return (
              <div
                key={iso}
                className={`min-w-[132px] rounded-2xl border p-2.5 min-h-[10rem] flex flex-col transition-colors ${
                  isToday
                    ? 'border-accent/50 bg-accent/[0.06] shadow-glow'
                    : 'border-border/10 bg-surface shadow-card'
                }`}
              >
                <div className="flex items-center justify-between mb-2 px-0.5">
                  <div className="leading-tight">
                    <div
                      className={`text-[10px] uppercase tracking-[0.22em] ${
                        isToday ? 'text-accent' : 'text-muted'
                      }`}
                    >
                      {format(d, 'EEE')}
                    </div>
                    <div
                      className={`text-lg font-display ${
                        isToday ? 'text-accent' : 'text-text'
                      }`}
                    >
                      {format(d, 'd')}
                    </div>
                  </div>
                  {isToday && (
                    <span className="text-[8px] uppercase tracking-wider bg-accent text-white px-1.5 py-0.5 rounded-full font-bold">
                      today
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 flex-1">
                  {list.map((e) => {
                    const area = AREAS[e.category]
                    return (
                      <button
                        key={e.id}
                        onClick={() => setEditing(e)}
                        className="w-full text-left rounded-lg bg-surface2/60 hover:bg-surface2 border border-border/40 hover:border-accent/40 px-2 py-1.5 transition-colors"
                        style={{ borderLeft: `3px solid rgb(var(--${area.color}))` }}
                      >
                        <div className="text-[10px] text-muted tabular-nums">
                          {e.startTime}–{e.endTime}
                        </div>
                        <div className="text-xs text-text leading-snug line-clamp-2">
                          {e.title}
                        </div>
                        {e.source === 'assistant' && (
                          <div className="text-[9px] text-accent2/80 mt-0.5 inline-flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" />
                            assistant
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setAddFor(iso)}
                  className="mt-1.5 text-[10px] text-muted hover:text-accent flex items-center justify-center gap-1 py-1 rounded-md hover:bg-surface2/40 transition-colors"
                >
                  <Plus className="w-3 h-3" /> add
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <Modal open={addFor !== null} onClose={() => setAddFor(null)} title="New event" size="sm">
        <EventForm
          defaultDate={addFor ?? today}
          onSave={handleSave}
          onCancel={() => setAddFor(null)}
        />
      </Modal>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit event"
        size="sm"
      >
        {editing && (
          <EventForm
            initial={editing}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
            onDelete={() => {
              deleteEvent(editing.id)
              setEditing(null)
            }}
          />
        )}
      </Modal>
    </div>
  )
}

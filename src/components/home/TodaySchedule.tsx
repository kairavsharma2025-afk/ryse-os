import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Clock, CalendarPlus } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useSchedule } from '@/stores/scheduleStore'
import { todayISO } from '@/engine/dates'
import { AREAS } from '@/data/areas'

function fmtTime(hm: string): string {
  const [h, m] = hm.split(':').map(Number)
  if (Number.isNaN(h)) return hm
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = ((h + 11) % 12) + 1
  return m === 0 ? `${h12} ${period}` : `${h12}:${String(m).padStart(2, '0')} ${period}`
}

function nowMinutes(): number {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}
const toMin = (hm: string): number => {
  const [h, m] = hm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function TodaySchedule() {
  const events = useSchedule((s) => s.events)
  const today = todayISO()
  const nav = useNavigate()

  const todays = useMemo(
    () =>
      events
        .filter((e) => e.date === today)
        .sort((a, b) => a.startTime.localeCompare(b.startTime) || a.title.localeCompare(b.title)),
    [events, today]
  )

  const minute = nowMinutes()

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-accent" strokeWidth={1.8} />
          <h2 className="font-display text-lg tracking-wide">Today’s Schedule</h2>
        </div>
        <button
          onClick={() => nav('/schedule')}
          className="text-[11px] uppercase tracking-wider text-muted hover:text-accent"
        >
          Open week →
        </button>
      </div>

      {todays.length === 0 ? (
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted">
            No events on the board for today. Open the calendar or ask the assistant to plan it.
          </div>
          <button
            onClick={() => nav('/schedule')}
            className="shrink-0 text-[11px] text-accent hover:text-accent2 inline-flex items-center gap-1"
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            Add event
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          {todays.map((e) => {
            const area = AREAS[e.category]
            const startMin = toMin(e.startTime)
            const endMin = toMin(e.endTime)
            const live = minute >= startMin && minute < endMin
            const past = minute >= endMin
            return (
              <li
                key={e.id}
                className={`flex items-center gap-3 rounded-xl border bg-surface2/30 px-3 py-2.5 transition ${
                  live
                    ? 'border-accent/50 bg-accent/[0.06] shadow-glow'
                    : past
                      ? 'border-border opacity-55'
                      : 'border-border'
                }`}
              >
                <span
                  className="shrink-0 w-1.5 h-9 rounded-full"
                  style={{ background: `rgb(var(--${area.color}))` }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-text truncate flex items-center gap-1.5">
                    <span className="truncate">{e.title}</span>
                    {live && (
                      <span className="text-[9px] uppercase tracking-wider bg-accent text-bg px-1.5 py-0.5 rounded-full font-bold">
                        now
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {fmtTime(e.startTime)} – {fmtTime(e.endTime)}
                    <span className="text-muted/50">·</span>
                    {area.name}
                    {e.source === 'assistant' && (
                      <>
                        <span className="text-muted/50">·</span>
                        <span className="text-accent2/80">★ from assistant</span>
                      </>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

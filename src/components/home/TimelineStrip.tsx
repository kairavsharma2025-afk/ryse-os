import { useMemo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSchedule } from '@/stores/scheduleStore'
import { todayISO } from '@/engine/dates'
import type { AreaId } from '@/types'

/**
 * Horizontal timeline bar spanning 08:00 → 22:00. Events render as colored
 * pills positioned by start time. A red dot marks "now". Gaps wider than
 * 30 min are labeled "Free 45m — try a deep work block".
 *
 * Wave 2 ships it visual-only (tap a pill scrolls Plan to that slot). Wave 3
 * makes the bar draggable for time blocking.
 */
const DAY_START = 8 // 08:00
const DAY_END = 22 // 22:00
const HOURS = DAY_END - DAY_START
const PX_PER_HOUR = 56 // 14h × 56 = 784 px — wider than viewport, scrolls

function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function minutesToPx(min: number): number {
  return (min - DAY_START * 60) * (PX_PER_HOUR / 60)
}

export function TimelineStrip() {
  const nav = useNavigate()
  const events = useSchedule((s) => s.events)
  const today = todayISO()
  const [now, setNow] = useState(() => new Date())

  // Re-tick every minute so the "now" cursor moves.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  const todayEvents = useMemo(() => {
    return events
      .filter((e) => e.date === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }, [events, today])

  // Compute free gaps ≥ 30 min between events.
  const gaps = useMemo(() => {
    const out: Array<{ start: number; end: number; minutes: number }> = []
    let cursor = DAY_START * 60
    for (const e of todayEvents) {
      const s = hhmmToMinutes(e.startTime)
      if (s > cursor + 30) {
        out.push({ start: cursor, end: s, minutes: s - cursor })
      }
      cursor = Math.max(cursor, hhmmToMinutes(e.endTime))
    }
    if (cursor < DAY_END * 60 - 30) {
      out.push({ start: cursor, end: DAY_END * 60, minutes: DAY_END * 60 - cursor })
    }
    return out
  }, [todayEvents])

  if (todayEvents.length === 0) return null

  const nowMin = now.getHours() * 60 + now.getMinutes()
  const nowVisible = nowMin >= DAY_START * 60 && nowMin <= DAY_END * 60
  const nowLeftPx = minutesToPx(nowMin)

  return (
    <div className="rounded-2xl border border-border/10 bg-surface p-4 shadow-card overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-muted uppercase tracking-wider">Today's timeline</div>
        <button
          onClick={() => nav('/plan')}
          className="text-xs text-accent hover:opacity-80"
        >
          Open plan →
        </button>
      </div>
      <div className="relative overflow-x-auto">
        <div className="relative" style={{ width: HOURS * PX_PER_HOUR, height: 64 }}>
          {/* Hour ticks */}
          <div className="absolute inset-x-0 top-7 h-px bg-border/15" />
          {Array.from({ length: HOURS + 1 }).map((_, i) => {
            const hour = DAY_START + i
            return (
              <div
                key={hour}
                className="absolute top-7 -translate-x-1/2"
                style={{ left: i * PX_PER_HOUR }}
              >
                <div className="w-px h-1.5 bg-border/30" />
                <div className="text-[10px] text-muted/70 mt-1 -translate-x-1/2 absolute left-1/2 top-2 whitespace-nowrap">
                  {hour % 12 || 12}
                  <span className="text-[8px] ml-0.5">{hour < 12 ? 'a' : 'p'}</span>
                </div>
              </div>
            )
          })}

          {/* Event pills */}
          {todayEvents.map((e) => {
            const sMin = hhmmToMinutes(e.startTime)
            const eMin = hhmmToMinutes(e.endTime)
            const leftPx = minutesToPx(sMin)
            const widthPx = Math.max(28, ((eMin - sMin) / 60) * PX_PER_HOUR)
            const cat = (e.category ?? 'accent') as AreaId | 'accent'
            return (
              <button
                key={e.id}
                title={`${e.title} · ${e.startTime}–${e.endTime}`}
                onClick={() => nav('/plan')}
                className="absolute top-0 h-6 rounded-md text-[10px] text-white px-2 truncate text-left flex items-center hover:brightness-110 transition-all duration-80"
                style={{
                  left: leftPx,
                  width: widthPx,
                  background: `rgb(var(--${cat}))`,
                }}
              >
                {e.title}
              </button>
            )
          })}

          {/* Free-gap labels */}
          {gaps.map((gap, i) => {
            if (gap.minutes < 30) return null
            return (
              <div
                key={i}
                className="absolute top-9 text-[10px] text-muted/70"
                style={{ left: minutesToPx(gap.start) + 4 }}
              >
                Free · {gap.minutes >= 60 ? `${Math.floor(gap.minutes / 60)}h` : ''}
                {gap.minutes % 60 ? `${gap.minutes % 60}m` : ''}
              </div>
            )
          })}

          {/* Now cursor */}
          {nowVisible && (
            <div
              className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
              style={{ left: nowLeftPx }}
            >
              <div className="w-2 h-2 rounded-full bg-danger ring-2 ring-danger/30" />
              <div className="w-px flex-1 bg-danger/60" style={{ height: 56 }} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

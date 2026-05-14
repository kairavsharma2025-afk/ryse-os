import { useMemo } from 'react'
import { Bot, Activity, Clock, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useSchedule } from '@/stores/scheduleStore'
import { useAssistant } from '@/stores/assistantStore'
import { AREAS, AREA_LIST } from '@/data/areas'
import { todayISO } from '@/engine/dates'
import { addDays, format, startOfWeek } from 'date-fns'
import { WeekGrid } from '@/components/schedule/WeekGrid'

/**
 * Standalone Schedule page. The week grid itself lives in WeekGrid (shared
 * with /plan?v=week); this page wraps it with the page chrome — header,
 * this-week stats, assistant CTA.
 */
export function Schedule() {
  const events = useSchedule((s) => s.events)
  const openAssistant = useAssistant((s) => s.setPanelOpen)

  const stats = useMemo(() => computeWeekStats(events), [events])

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl tracking-wide">Schedule</h1>
          <p className="text-sm text-muted mt-1">
            Time-block the week. The Game Master plans and reminds around what's here.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => openAssistant(true)}>
          <Bot className="w-3.5 h-3.5" />
          Ask to plan it
        </Button>
      </header>

      <WeekStats stats={stats} />
      <WeekGrid />
    </div>
  )
}

interface WeekStats {
  totalEvents: number
  totalMinutes: number
  byCategory: Array<{ id: string; name: string; color: string; minutes: number }>
  todayCount: number
}

function computeWeekStats(events: ReturnType<typeof useSchedule.getState>['events']): WeekStats {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd = addDays(weekStart, 7)
  const wsISO = format(weekStart, 'yyyy-MM-dd')
  const weISO = format(weekEnd, 'yyyy-MM-dd')
  const today = todayISO()

  let totalEvents = 0
  let totalMinutes = 0
  let todayCount = 0
  const catMin = new Map<string, number>()

  for (const e of events) {
    if (e.date < wsISO || e.date >= weISO) continue
    totalEvents++
    if (e.date === today) todayCount++
    const m = minutesBetween(e.startTime, e.endTime)
    totalMinutes += m
    catMin.set(e.category, (catMin.get(e.category) ?? 0) + m)
  }

  const byCategory = AREA_LIST.filter((a) => (catMin.get(a.id) ?? 0) > 0).map((a) => ({
    id: a.id,
    name: a.name,
    color: a.color,
    minutes: catMin.get(a.id) ?? 0,
  }))
  byCategory.sort((a, b) => b.minutes - a.minutes)

  return { totalEvents, totalMinutes, byCategory, todayCount }
}

function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const m = (eh - sh) * 60 + (em - sm)
  return m > 0 ? m : 0
}

function formatHours(minutes: number): string {
  if (minutes === 0) return '0h'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function WeekStats({ stats }: { stats: WeekStats }) {
  if (stats.totalEvents === 0) return null
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
      <Tile icon={Activity} label="Events · week" value={stats.totalEvents} />
      <Tile icon={Clock} label="Blocked time" value={formatHours(stats.totalMinutes)} />
      <Tile icon={BarChart3} label="Today" value={stats.todayCount} />
      {stats.byCategory.length > 0 && (
        <div className="rounded-2xl bg-surface border border-border/10 shadow-card px-3 py-2.5 col-span-2 sm:col-span-3">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted mb-2">
            By category · this week
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.byCategory.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border border-border/30"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: `rgb(var(--${AREAS[c.id as keyof typeof AREAS].color}))` }}
                />
                <span className="text-text">{c.name}</span>
                <span className="text-muted tabular-nums">{formatHours(c.minutes)}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Tile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity
  label: string
  value: number | string
}) {
  return (
    <div className="rounded-2xl bg-surface border border-border/10 shadow-card px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted">
        <Icon className="w-3 h-3" strokeWidth={1.8} />
        <span>{label}</span>
      </div>
      <div className="font-display text-2xl mt-0.5 tabular-nums leading-none text-text">
        {value}
      </div>
    </div>
  )
}

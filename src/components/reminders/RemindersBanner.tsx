import { useMemo } from 'react'
import { Bell, Clock, Sunrise, RotateCw, Moon, AlarmClock } from 'lucide-react'
import { useReminders } from '@/stores/remindersStore'
import { useSettings } from '@/stores/settingsStore'
import { nextFireTime } from '@/engine/remindersEngine'
import { todayISO } from '@/engine/dates'

/**
 * Compact stats strip above the reminders list. Six tiles cover the day:
 *
 *   Active        — anything still scheduled to fire (not done + has next fire)
 *   Due 2h        — fires within the next two hours
 *   Today         — fires before midnight tonight
 *   Recurring     — daily / weekly / monthly entries
 *   Snoozed       — currently overridden by snoozedUntil
 *   Quiet hours   — surfaces the configured window or "none"
 */
export function RemindersBanner() {
  const reminders = useReminders((s) => s.reminders)
  const quietHours = useSettings((s) => s.quietHours)

  const stats = useMemo(() => {
    const now = new Date()
    const todayStr = todayISO()
    const endOfToday = new Date(`${todayStr}T23:59:59`)
    const twoHoursOut = new Date(now.getTime() + 2 * 3600_000)

    let active = 0
    let dueSoon = 0
    let today = 0
    let recurring = 0
    let snoozed = 0
    for (const r of reminders) {
      const next = nextFireTime(r, now, quietHours)
      if (next === null) continue
      active++
      if (next >= now && next <= twoHoursOut) dueSoon++
      if (next <= endOfToday) today++
      if (r.repeat !== 'once') recurring++
      if (r.snoozedUntil) snoozed++
    }
    return { active, dueSoon, today, recurring, snoozed }
  }, [reminders, quietHours])

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
      <Tile icon={Bell} label="Active" value={stats.active} />
      <Tile
        icon={Clock}
        label="Due · 2h"
        value={stats.dueSoon}
        tone={stats.dueSoon > 0 ? 'accent' : undefined}
      />
      <Tile icon={Sunrise} label="Today" value={stats.today} />
      <Tile icon={RotateCw} label="Recurring" value={stats.recurring} />
      <Tile
        icon={AlarmClock}
        label="Snoozed"
        value={stats.snoozed}
        tone={stats.snoozed > 0 ? 'amber' : undefined}
      />
      <QuietHoursTile quietHours={quietHours} />
    </div>
  )
}

function Tile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Bell
  label: string
  value: number
  tone?: 'accent' | 'amber'
}) {
  const color =
    tone === 'accent' ? 'text-accent' : tone === 'amber' ? 'text-amber-400' : 'text-text'
  return (
    <div className="rounded-2xl bg-surface border border-border/10 shadow-card px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted">
        <Icon className="w-3 h-3" strokeWidth={1.8} />
        <span>{label}</span>
      </div>
      <div className={`font-display text-2xl mt-0.5 tabular-nums leading-none ${color}`}>
        {value}
      </div>
    </div>
  )
}

function QuietHoursTile({ quietHours }: { quietHours?: { from: string; to: string } }) {
  const on = !!quietHours
  return (
    <div className="rounded-2xl bg-surface border border-border/10 shadow-card px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted">
        <Moon className="w-3 h-3" strokeWidth={1.8} />
        <span>Quiet</span>
      </div>
      <div
        className={`font-display mt-0.5 leading-none tabular-nums ${
          on ? 'text-accent2 text-md' : 'text-muted text-md'
        }`}
      >
        {on ? `${quietHours!.from}–${quietHours!.to}` : 'none'}
      </div>
      <div className="text-[10px] text-muted/80 mt-1">
        {on ? 'pings deferred' : 'always on'}
      </div>
    </div>
  )
}

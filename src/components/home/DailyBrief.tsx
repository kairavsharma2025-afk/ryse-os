import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGoals } from '@/stores/goalsStore'
import { useQuests } from '@/stores/questsStore'
import { useSchedule } from '@/stores/scheduleStore'
import { useModules } from '@/stores/modulesStore'
import { useSeason, currentSeason } from '@/stores/seasonStore'
import { todayISO } from '@/engine/dates'
import { RITUAL_STEPS } from '@/data/ritual'
import { Flame, Zap, Trophy, Clock, AlertTriangle, Check } from 'lucide-react'
import { NowIndicator } from '@/components/ui/NowIndicator'

/**
 * Two stacked sections:
 *   1. Priority hero — the #1 priority callout with an amber accent rail and
 *      pulsing dot. Sits ABOVE the stats so the eye lands on the next move.
 *   2. Compact stats strip — Day / Energy / Wins in a tight 3-col grid.
 *
 * The stats are the same data the old tall card surfaced, just compressed.
 */
export function DailyBrief() {
  const today = todayISO()
  const events = useSchedule((s) => s.events)
  const todayQuests = useQuests((s) => s.todayQuests)
  const goals = useGoals((s) => s.goals)
  const ritual = useModules((s) => s.ritual.logs)
  const season = useSeason()
  const currentS = currentSeason()
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000)
    return () => clearInterval(t)
  }, [])

  const data = useMemo(() => {
    void tick
    const todayEvents = events.filter((e) => e.date === today)
    const completedQuests = todayQuests.filter((q) => q.completedAt)
    const goalsLoggedToday = goals.filter(
      (g) => g.lastLoggedAt && g.lastLoggedAt.slice(0, 10) === today
    )

    const totalTasks = todayQuests.length + todayEvents.length + goals.filter((g) => g.cadence !== 'weekly' && g.cadence !== 'monthly').length
    const doneTasks = completedQuests.length + goalsLoggedToday.length

    const now = new Date()
    const nextEvent = todayEvents
      .map((e) => ({ e, start: hhmmToDate(today, e.startTime) }))
      .filter((x) => x.start.getTime() > now.getTime())
      .sort((a, b) => a.start.getTime() - b.start.getTime())[0]
    const nextEventMin = nextEvent
      ? Math.max(0, Math.round((nextEvent.start.getTime() - now.getTime()) / 60_000))
      : null

    const overdueCount = goals.filter(
      (g) =>
        g.currentStreak > 0 &&
        g.lastLoggedAt &&
        g.lastLoggedAt.slice(0, 10) !== today &&
        daysSince(g.lastLoggedAt) >= 1
    ).length
    const urgency: 'green' | 'amber' | 'red' = overdueCount === 0 ? 'green' : overdueCount <= 2 ? 'amber' : 'red'

    const ritualToday = ritual.find((l) => l.date === today)
    const ritualDone = ritualToday?.completedStepIds.length ?? 0
    const ritualTotal = RITUAL_STEPS.length
    const ritualPct = ritualTotal === 0 ? 0 : ritualDone / ritualTotal

    const longestStreak = Math.max(0, ...goals.map((g) => g.currentStreak))
    const streakAtRisk = goals.some(
      (g) => g.currentStreak > 0 && g.lastLoggedAt && g.lastLoggedAt.slice(0, 10) !== today
    )

    const xpToday =
      completedQuests.reduce((s, q) => s + q.xpReward + (q.bonusXp ?? 0), 0) +
      goalsLoggedToday.length * 25

    const bossPct =
      currentS.bossInitialHp === 0
        ? 0
        : Math.max(0, season.bossHp / currentS.bossInitialHp)

    const topQuest = todayQuests.find((q) => !q.completedAt && !q.skippedAt)
    const topPriority: string =
      topQuest?.title ??
      nextEvent?.e.title ??
      goals
        .filter((g) => g.currentStreak > 0)
        .sort((a, b) => b.currentStreak - a.currentStreak)[0]?.title ??
      'Pick the one thing that matters most today.'

    return {
      totalTasks,
      doneTasks,
      nextEventTitle: nextEvent?.e.title ?? null,
      nextEventMin,
      urgency,
      overdueCount,
      ritualDone,
      ritualTotal,
      ritualPct,
      longestStreak,
      streakAtRisk,
      xpToday,
      goalsLoggedToday: goalsLoggedToday.length,
      bossPct,
      topPriority,
    }
  }, [events, todayQuests, goals, ritual, today, season, currentS, tick])

  const urgencyColor =
    data.urgency === 'red' ? 'bg-danger' : data.urgency === 'amber' ? 'bg-warning' : 'bg-success'

  const nowContext = data.nextEventTitle
    ? `${data.nextEventTitle}${data.nextEventMin === 0 ? ' now' : ` in ${data.nextEventMin}m`}`
    : null

  return (
    <div className="space-y-3">
      {/* ─── PRIORITY HERO ─── */}
      <div
        className="relative rounded-2xl border border-border/10 bg-surface p-5 md:p-6 shadow-card overflow-hidden"
        style={{
          borderLeft: '4px solid rgb(var(--color-reward))',
          boxShadow:
            '0 0 24px rgb(245 158 11 / 0.15), 0 1px 2px rgb(0 0 0 / 0.30), 0 4px 12px rgb(0 0 0 / 0.40)',
        }}
      >
        <div className="text-[10px] uppercase tracking-[0.22em] text-muted mb-2 flex items-center gap-1.5 font-semibold">
          <span
            className="inline-block w-2 h-2 rounded-full animate-pulseDot"
            style={{ background: 'rgb(var(--color-reward))' }}
            aria-hidden="true"
          />
          <AlertTriangle className="w-3 h-3 text-reward" />
          Your #1 priority right now
        </div>
        <motion.div
          key={data.topPriority}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="font-display text-xl font-bold text-text leading-tight mb-3"
        >
          {data.topPriority}
        </motion.div>
        <NowIndicator context={nowContext} />
      </div>

      {/* ─── COMPACT STATS STRIP ─── */}
      <div
        className="rounded-2xl border border-border/10 bg-surface shadow-card"
        style={{ padding: '12px 16px' }}
      >
        <div className="grid grid-cols-3 gap-3">
          <CompactStat
            label="The Day"
            value={
              <span className="flex items-baseline gap-1">
                <span className="text-md text-text">{data.doneTasks}</span>
                <span className="text-xs text-muted">/ {data.totalTasks}</span>
              </span>
            }
            sub={
              data.nextEventTitle ? (
                <span className="flex items-center gap-1 truncate">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span className="truncate">in {data.nextEventMin}m</span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${urgencyColor}`} />
                  {data.urgency === 'green' ? 'All clear' : `${data.overdueCount} overdue`}
                </span>
              )
            }
          />
          <CompactStat
            label="Energy"
            value={
              <span className="flex items-center gap-1.5">
                <span className="text-md text-text">
                  {data.ritualDone}/{data.ritualTotal}
                </span>
                <span className="text-xs text-muted">ritual</span>
              </span>
            }
            sub={
              data.longestStreak > 0 ? (
                <span
                  className={`inline-flex items-center gap-1 ${
                    data.streakAtRisk ? 'text-danger' : 'text-reward'
                  }`}
                >
                  <Flame className="w-3 h-3" />
                  {data.longestStreak}d streak
                </span>
              ) : (
                <span className="text-muted">Start a streak</span>
              )
            }
          />
          <CompactStat
            label="Wins"
            value={
              <span className="flex items-center gap-1.5 text-md">
                <Zap className="w-3.5 h-3.5 text-reward" />
                <span className="text-text">+{data.xpToday}</span>
                <span className="text-xs text-muted">XP</span>
              </span>
            }
            sub={
              <span className="flex items-center gap-2 truncate">
                <span className="inline-flex items-center gap-1">
                  <Check className="w-3 h-3 text-success" />
                  {data.goalsLoggedToday}
                </span>
                <span className="inline-flex items-center gap-1 text-muted truncate">
                  <Trophy className="w-3 h-3" />
                  Boss {(data.bossPct * 100).toFixed(0)}%
                </span>
              </span>
            }
          />
        </div>
      </div>
    </div>
  )
}

function CompactStat({
  label,
  value,
  sub,
}: {
  label: string
  value: React.ReactNode
  sub: React.ReactNode
}) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-semibold tracking-widest uppercase text-muted mb-1">
        {label}
      </div>
      <div className="text-text mb-0.5">{value}</div>
      <div className="text-[11px] text-muted truncate">{sub}</div>
    </div>
  )
}

function hhmmToDate(dateISO: string, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date(dateISO)
  d.setHours(h || 0, m || 0, 0, 0)
  return d
}

function daysSince(iso: string): number {
  const t = new Date(iso).getTime()
  return Math.floor((Date.now() - t) / 86400000)
}

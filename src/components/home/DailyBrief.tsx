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

/**
 * The command-centre card. Three columns: Day / Energy / Wins. Below the
 * columns: the bold #1 priority callout — one task, not a list.
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

    // "Today's tasks" = quests + events + goals due daily. Done = quests done
    // + goals logged today. This is approximate until the unified task model
    // lands in Wave 3 — close enough for the headline counter.
    const totalTasks = todayQuests.length + todayEvents.length + goals.filter((g) => g.cadence !== 'weekly' && g.cadence !== 'monthly').length
    const doneTasks = completedQuests.length + goalsLoggedToday.length

    // Next event.
    const now = new Date()
    const nextEvent = todayEvents
      .map((e) => ({ e, start: hhmmToDate(today, e.startTime) }))
      .filter((x) => x.start.getTime() > now.getTime())
      .sort((a, b) => a.start.getTime() - b.start.getTime())[0]
    const nextEventMin = nextEvent
      ? Math.max(0, Math.round((nextEvent.start.getTime() - now.getTime()) / 60_000))
      : null

    // Urgency.
    const overdueCount = goals.filter(
      (g) =>
        g.currentStreak > 0 &&
        g.lastLoggedAt &&
        g.lastLoggedAt.slice(0, 10) !== today &&
        daysSince(g.lastLoggedAt) >= 1
    ).length
    const urgency: 'green' | 'amber' | 'red' = overdueCount === 0 ? 'green' : overdueCount <= 2 ? 'amber' : 'red'

    // Ritual ring.
    const ritualToday = ritual.find((l) => l.date === today)
    const ritualDone = ritualToday?.completedStepIds.length ?? 0
    const ritualTotal = RITUAL_STEPS.length
    const ritualPct = ritualTotal === 0 ? 0 : ritualDone / ritualTotal

    // Streak at risk.
    const longestStreak = Math.max(0, ...goals.map((g) => g.currentStreak))
    const streakAtRisk = goals.some(
      (g) => g.currentStreak > 0 && g.lastLoggedAt && g.lastLoggedAt.slice(0, 10) !== today
    )

    // Wins.
    const xpToday =
      completedQuests.reduce((s, q) => s + q.xpReward + (q.bonusXp ?? 0), 0) +
      goalsLoggedToday.length * 25 // approx — exact XP needs a log-time entry

    // Boss HP dealt today — approximation: today's session XP gain × small factor.
    // The seasonStore doesn't keep per-day damage, so we surface boss HP remaining.
    const bossPct =
      currentS.bossInitialHp === 0
        ? 0
        : Math.max(0, season.bossHp / currentS.bossInitialHp)

    // #1 priority — highest-leverage unfinished task.
    const topQuest = todayQuests.find((q) => !q.completedAt && !q.skippedAt)
    const topPriority: string =
      topQuest?.title ??
      // Next event in the future
      nextEvent?.e.title ??
      // Goal with the highest at-risk streak
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

  return (
    <div
      className="rounded-2xl border border-border/10 p-5 md:p-6 shadow-card"
      style={{
        background:
          'linear-gradient(180deg, rgb(var(--accent) / 0.04) 0%, rgb(var(--surface)) 70%)',
      }}
    >
      <div className="grid grid-cols-3 gap-4 md:gap-6">
        {/* Day */}
        <div className="min-w-0">
          <div className="text-xs text-muted mb-2">The Day</div>
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-xl text-text">{data.doneTasks}</span>
            <span className="text-md text-muted">/ {data.totalTasks}</span>
          </div>
          {data.nextEventTitle ? (
            <div className="flex items-center gap-1.5 text-xs text-muted truncate">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {data.nextEventTitle}
                <span className="text-accent ml-1">· in {data.nextEventMin}m</span>
              </span>
            </div>
          ) : (
            <div className="text-xs text-muted">No events scheduled</div>
          )}
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`w-2 h-2 rounded-full ${urgencyColor}`} />
            <span className="text-xs text-muted">
              {data.urgency === 'green' ? 'All clear' : `${data.overdueCount} overdue`}
            </span>
          </div>
        </div>

        {/* Energy */}
        <div className="min-w-0">
          <div className="text-xs text-muted mb-2">Energy</div>
          <div className="flex items-center gap-3 mb-2">
            <RitualRing pct={data.ritualPct} />
            <div className="min-w-0">
              <div className="text-md text-text">{data.ritualDone}/{data.ritualTotal}</div>
              <div className="text-[11px] text-muted">ritual today</div>
            </div>
          </div>
          {data.longestStreak > 0 ? (
            <div
              className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full ${
                data.streakAtRisk
                  ? 'bg-danger/15 text-danger animate-pulseGlow'
                  : 'bg-success/15 text-success'
              }`}
            >
              <Flame className="w-3 h-3" />
              {data.longestStreak}-day streak
            </div>
          ) : (
            <div className="text-xs text-muted">Start a streak today</div>
          )}
        </div>

        {/* Wins */}
        <div className="min-w-0">
          <div className="text-xs text-muted mb-2">Wins</div>
          <div className="flex items-center gap-1.5 text-md mb-1.5">
            <Zap className="w-4 h-4 text-warning" />
            <span className="text-text">+{data.xpToday}</span>
            <span className="text-xs text-muted ml-0.5">XP</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Check className="w-3.5 h-3.5 text-success" />
            {data.goalsLoggedToday} goal{data.goalsLoggedToday === 1 ? '' : 's'} logged
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted mt-1">
            <Trophy className="w-3.5 h-3.5 text-accent2" />
            Boss {(data.bossPct * 100).toFixed(0)}% HP
          </div>
        </div>
      </div>

      {/* #1 priority callout */}
      <div className="mt-5 pt-4 border-t border-border/10">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted mb-1.5 flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3" />
          Your #1 priority right now
        </div>
        <motion.div
          key={data.topPriority}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="text-lg text-text leading-tight"
        >
          {data.topPriority}
        </motion.div>
      </div>
    </div>
  )
}

function RitualRing({ pct }: { pct: number }) {
  // Tiny circular progress ring — 36px outer, 5px stroke.
  const SIZE = 36
  const STROKE = 5
  const RADIUS = (SIZE - STROKE) / 2
  const CIRC = 2 * Math.PI * RADIUS
  const dash = CIRC * (1 - Math.max(0, Math.min(1, pct)))
  return (
    <svg width={SIZE} height={SIZE} className="shrink-0">
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        stroke="rgb(var(--surface2))"
        strokeWidth={STROKE}
        fill="none"
      />
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        stroke="rgb(var(--accent))"
        strokeWidth={STROKE}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={CIRC}
        strokeDashoffset={dash}
        transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      />
    </svg>
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

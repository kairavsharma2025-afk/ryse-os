import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  Flame,
  CalendarClock,
  Trophy,
  Sparkles,
  X as XIcon,
} from 'lucide-react'
import { useGoals } from '@/stores/goalsStore'
import { useQuests } from '@/stores/questsStore'
import { useSchedule } from '@/stores/scheduleStore'
import { useReminders } from '@/stores/remindersStore'
import { useSettings } from '@/stores/settingsStore'
import { todayISO } from '@/engine/dates'
import { isStreakBroken } from '@/engine/streakEngine'
import { upcomingReminders } from '@/engine/remindersEngine'

// "Peak hour" default — Wave 5 can promote this to a user setting alongside the
// stats dashboard. For now: 9am, the most common deep-work start.
const PEAK_HOUR_DEFAULT = 9

/**
 * Priority-queued banner at the top of Home. Picks ONE of (in order):
 *   overdue → streak-at-risk → meeting-soon → win-celebration → ai-insight
 *
 * Dismissals are stored per-banner-kind per-day so the same banner doesn't
 * keep clamoring after the user has actively waved it off.
 */
type BannerKind = 'overdue' | 'streak' | 'meeting' | 'win' | 'insight'

interface BannerSpec {
  kind: BannerKind
  tone: 'danger' | 'warning' | 'accent' | 'success' | 'muted'
  icon: typeof AlertTriangle
  title: string
  action?: { label: string; to: string }
  /** Banners with autoDismiss are removed after `autoDismiss` ms (e.g. celebrations). */
  autoDismiss?: number
}

const TONE_TO_VARS: Record<BannerSpec['tone'], { border: string; bg: string; fg: string }> = {
  danger:  { border: 'border-l-danger',  bg: 'bg-danger/8',  fg: 'text-danger' },
  warning: { border: 'border-l-warning', bg: 'bg-warning/8', fg: 'text-warning' },
  accent:  { border: 'border-l-accent',  bg: 'bg-accent/8',  fg: 'text-accent' },
  success: { border: 'border-l-success', bg: 'bg-success/8', fg: 'text-success' },
  muted:   { border: 'border-l-muted',   bg: 'bg-surface2/40', fg: 'text-muted' },
}

const DISMISS_KEY_PREFIX = 'lifeos:v1:__banner_dismissed:'

function dismissKey(kind: BannerKind): string {
  return `${DISMISS_KEY_PREFIX}${kind}:${todayISO()}`
}

function isDismissedToday(kind: BannerKind): boolean {
  try {
    return localStorage.getItem(dismissKey(kind)) === '1'
  } catch {
    return false
  }
}

function dismissToday(kind: BannerKind): void {
  try {
    localStorage.setItem(dismissKey(kind), '1')
  } catch {
    /* ignore */
  }
}

export function SmartBanner() {
  const nav = useNavigate()
  const goals = useGoals((s) => s.goals)
  const todayQuests = useQuests((s) => s.todayQuests)
  const events = useSchedule((s) => s.events)
  const reminders = useReminders((s) => s.reminders)
  const quietHours = useSettings((s) => s.quietHours)
  const peakHour = PEAK_HOUR_DEFAULT
  const [tick, setTick] = useState(0)

  // 1-minute ticker so "in N min" stays accurate without re-render storms.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60_000)
    return () => clearInterval(t)
  }, [])

  const spec = useMemo<BannerSpec | null>(() => {
    // tick read to silence the linter about exhaustive deps; the ref is the
    // signal that something might've changed since the last evaluation.
    void tick
    const today = todayISO()

    // 1) Overdue tasks — goals with streaks that broke or quests that didn't get done yesterday.
    const overdueGoals = goals.filter((g) => g.currentStreak > 0 && isStreakBroken(g, today))
    if (overdueGoals.length > 0 && !isDismissedToday('overdue')) {
      return {
        kind: 'overdue',
        tone: 'danger',
        icon: AlertTriangle,
        title: `You have ${overdueGoals.length} streak${overdueGoals.length === 1 ? '' : 's'} at risk. Handle them?`,
        action: { label: 'Open goals', to: '/goals' },
      }
    }

    // 2) Streak at risk — any goal whose last log is today missing but streak >0
    //    and clock is past 18:00.
    const hourNow = new Date().getHours()
    if (hourNow >= 18 && !isDismissedToday('streak')) {
      const atRisk = goals.find(
        (g) => g.currentStreak > 0 && g.lastLoggedAt && g.lastLoggedAt.slice(0, 10) !== today
      )
      if (atRisk) {
        const left = 24 - hourNow
        return {
          kind: 'streak',
          tone: 'warning',
          icon: Flame,
          title: `Your "${atRisk.title}" streak ends in ${left}h. Log it to keep ${atRisk.currentStreak} days alive.`,
          action: { label: 'Log it', to: `/goals/${atRisk.id}` },
        }
      }
    }

    // 3) Meeting soon — next event in the next 10 min.
    const now = new Date()
    const todayEvents = events
      .filter((e) => e.date === today)
      .map((e) => ({ e, start: hhmmToDate(today, e.startTime) }))
      .filter((x) => x.start.getTime() > now.getTime())
      .sort((a, b) => a.start.getTime() - b.start.getTime())
    if (todayEvents.length > 0 && !isDismissedToday('meeting')) {
      const next = todayEvents[0]
      const min = Math.round((next.start.getTime() - now.getTime()) / 60_000)
      if (min <= 10) {
        return {
          kind: 'meeting',
          tone: 'accent',
          icon: CalendarClock,
          title: `${next.e.title} in ${min} min.`,
          action: { label: 'Open plan', to: '/plan' },
        }
      }
    }

    // 4) Win — 3+ quests completed before noon.
    const completedToday = todayQuests.filter((q) => q.completedAt && q.completedAt.slice(0, 10) === today)
    if (
      hourNow < 12 &&
      completedToday.length >= 3 &&
      !isDismissedToday('win')
    ) {
      return {
        kind: 'win',
        tone: 'success',
        icon: Trophy,
        title: `${completedToday.length} tasks done before noon. You're crushing it.`,
        autoDismiss: 5000,
      }
    }

    // 5) AI insight — peak-hour suggestion when nothing is scheduled.
    if (!isDismissedToday('insight')) {
      const peakAt = hhmmToDate(today, `${String(peakHour).padStart(2, '0')}:00`)
      const peakStillAhead = peakAt.getTime() > now.getTime()
      const occupied = events.some((e) => {
        if (e.date !== today) return false
        const s = hhmmToDate(today, e.startTime)
        const eTime = hhmmToDate(today, e.endTime)
        return peakAt.getTime() >= s.getTime() && peakAt.getTime() < eTime.getTime()
      })
      if (peakStillAhead && !occupied) {
        return {
          kind: 'insight',
          tone: 'accent',
          icon: Sparkles,
          title: `Your peak hour is ${peakHour}am. It's free today — block it for deep work?`,
          action: { label: 'Block time', to: '/plan' },
        }
      }
    }

    // Upcoming reminders within 30 min as a fallback.
    void quietHours
    const soon = upcomingReminders(reminders, 30 * 60_000, undefined, quietHours)
    if (soon.length > 0 && !isDismissedToday('meeting')) {
      const r = soon[0]
      return {
        kind: 'meeting',
        tone: 'accent',
        icon: CalendarClock,
        title: `Reminder: ${r.reminder.title} — soon.`,
        action: { label: 'Open plan', to: '/plan' },
      }
    }

    return null
  }, [goals, events, todayQuests, reminders, quietHours, peakHour, tick])

  const [dismissedNow, setDismissedNow] = useState<BannerKind | null>(null)

  // Schedule auto-dismiss for celebration banners.
  useEffect(() => {
    if (!spec?.autoDismiss) return
    const t = setTimeout(() => {
      dismissToday(spec.kind)
      setDismissedNow(spec.kind)
    }, spec.autoDismiss)
    return () => clearTimeout(t)
  }, [spec])

  if (!spec || dismissedNow === spec.kind) return null

  const Icon = spec.icon
  const styles = TONE_TO_VARS[spec.tone]

  return (
    <AnimatePresence>
      <motion.div
        key={spec.kind}
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -8, opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className={`flex items-center gap-3 pl-3 pr-2 py-2.5 rounded-xl border-l-4 border border-border/10 ${styles.bg} ${styles.border}`}
        role="status"
      >
        <Icon className={`w-4 h-4 shrink-0 ${styles.fg}`} strokeWidth={2.2} />
        <span className="flex-1 min-w-0 text-sm text-text truncate">{spec.title}</span>
        {spec.action && (
          <button
            onClick={() => nav(spec.action!.to)}
            className={`shrink-0 text-xs font-semibold uppercase tracking-wider hover:opacity-80 ${styles.fg}`}
          >
            {spec.action.label}
          </button>
        )}
        <button
          onClick={() => {
            dismissToday(spec.kind)
            setDismissedNow(spec.kind)
          }}
          className="shrink-0 ml-1 p-1 text-muted hover:text-text transition-colors duration-80"
          aria-label="Dismiss"
        >
          <XIcon className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}

function hhmmToDate(dateISO: string, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date(dateISO)
  d.setHours(h || 0, m || 0, 0, 0)
  return d
}


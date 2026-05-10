import { useGoals } from '@/stores/goalsStore'
import { streakVisualState } from '@/engine/streakEngine'
import { todayISO } from '@/engine/dates'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../ui/Button'
import { STREAK_ICONS, Check, type LucideIcon } from '@/components/icons'

const STATE_COLOR: Record<string, { bg: string; text: string }> = {
  cold: { bg: 'rgb(var(--muted) / 0.2)', text: 'rgb(var(--muted))' },
  building: { bg: 'rgb(245 158 11 / 0.2)', text: 'rgb(245 158 11)' },
  burning: { bg: 'rgb(234 88 12 / 0.25)', text: 'rgb(234 88 12)' },
  inferno: { bg: 'rgb(220 38 38 / 0.25)', text: 'rgb(248 113 113)' },
  legendary: { bg: 'rgb(250 204 21 / 0.25)', text: 'rgb(250 204 21)' },
}

export function StreakDashboard() {
  const goals = useGoals((s) =>
    s.goals.filter((g) => !g.archivedAt && !g.completedAt && g.currentStreak > 0)
  )
  const allGoals = useGoals((s) => s.goals.filter((g) => !g.archivedAt && !g.completedAt))
  const nav = useNavigate()
  const today = todayISO()
  if (goals.length === 0) {
    const hasGoalsToLog = allGoals.length > 0
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-center">
        <div className="text-3xl mb-2 text-muted">·</div>
        <div className="text-sm text-text mb-1">No active streaks.</div>
        <div className="text-xs text-muted mb-4 max-w-sm mx-auto leading-relaxed">
          {hasGoalsToLog
            ? 'Log progress on a goal today to begin a streak. Tomorrow becomes day two.'
            : 'Streaks start when you log a goal two days in a row. Add one to begin.'}
        </div>
        <Button size="sm" onClick={() => nav('/goals')}>
          {hasGoalsToLog ? 'Log a goal →' : 'Start a streak →'}
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-xl tracking-wide">Streaks</h2>
        <span className="text-xs text-muted">{goals.length} active</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {goals.map((g) => {
          const state = streakVisualState(g.currentStreak)
          const c = STATE_COLOR[state]
          const Icon: LucideIcon | null = STREAK_ICONS[state] ?? null
          const loggedToday = g.lastLoggedAt?.slice(0, 10) === today
          return (
            <Link
              key={g.id}
              to={`/goals/${g.id}`}
              className="shrink-0 w-44 rounded-2xl border border-border bg-surface p-3 hover:border-accent/40 transition relative overflow-hidden"
            >
              <div
                className="absolute -top-3 -right-3 w-16 h-16 rounded-full opacity-50 blur-2xl"
                style={{ background: c.bg }}
              />
              <div className="relative">
                <motion.div
                  animate={
                    state === 'inferno' || state === 'legendary'
                      ? { scale: [1, 1.1, 1] }
                      : {}
                  }
                  transition={{ duration: 1.4, repeat: Infinity }}
                  className="mb-1 inline-flex items-center justify-center w-8 h-8 rounded-lg"
                  style={{ background: c.bg, color: c.text }}
                >
                  {Icon ? (
                    <Icon className="w-5 h-5" strokeWidth={1.8} />
                  ) : (
                    <span className="text-lg leading-none">·</span>
                  )}
                </motion.div>
                <div className="font-display text-3xl" style={{ color: c.text }}>
                  {g.currentStreak}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-muted">day streak</div>
                <div className="text-xs text-text mt-2 truncate">{g.title}</div>
                <div
                  className={`text-[10px] mt-1 flex items-center gap-1 ${
                    loggedToday ? 'text-accent' : 'text-muted'
                  }`}
                >
                  {loggedToday ? (
                    <>
                      <Check className="w-3 h-3" strokeWidth={2.6} /> logged today
                    </>
                  ) : (
                    <>· pending today</>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

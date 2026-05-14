import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Skull, Check, Loader2, AlertTriangle } from 'lucide-react'
import { Pill } from '@/components/ui/Pill'
import { AREAS } from '@/data/areas'
import { AREA_ICONS, STREAK_ICONS } from '@/components/icons'
import { streakVisualState } from '@/engine/streakEngine'
import { todayISO } from '@/engine/dates'
import { actionLogGoal } from '@/engine/gameLoop'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { isAtRisk, isNearVictory } from './GoalsBanner'
import type { Goal } from '@/types'

/**
 * Goal card for the redesigned Goals index.
 *
 *  ┌──────────────────────────────────────────┐
 *  │ [area] [boss?]              [streak strip]│
 *  │ ▶ Goal title                              │
 *  │ ─ milestone progress ────────────  3/5    │
 *  │ ─ boss HP bar (only if boss) ────         │
 *  │ last logged · 3d ago · at-risk?           │
 *  │                              [log today]  │
 *  └──────────────────────────────────────────┘
 *
 * Card itself navigates to /goals/:id; the inline Log-today button stops
 * propagation so it doesn't trigger navigation.
 */
export function GoalCard({ goal }: { goal: Goal }) {
  const area = AREAS[goal.area]
  const AreaIcon = AREA_ICONS[area.id]
  const state = streakVisualState(goal.currentStreak)
  const StreakIcon = STREAK_ICONS[state]

  const today = todayISO()
  const loggedToday = goal.lastLoggedAt?.slice(0, 10) === today
  const atRisk = isAtRisk(goal)
  const nearVictory = isNearVictory(goal)

  const milestonesDone = goal.milestones.filter((m) => m.completedAt).length
  const milestonesTotal = goal.milestones.length
  const msPct = milestonesTotal > 0 ? (milestonesDone / milestonesTotal) * 100 : 0

  const boss = goal.isBossBattle ? goal.bossBattleConfig : undefined
  const bossPct = boss ? Math.max(0, Math.min(1, boss.currentHp / Math.max(1, boss.bossHp))) : 0

  const lastAge = goal.lastLoggedAt
    ? Math.max(0, differenceInCalendarDays(new Date(), parseISO(goal.lastLoggedAt)))
    : null

  const [logging, setLogging] = useState(false)
  const [flash, setFlash] = useState<{ xp: number } | null>(null)

  const handleLog = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (loggedToday || logging) return
    setLogging(true)
    const r = actionLogGoal(goal.id)
    setFlash({ xp: r.xp })
    setTimeout(() => setFlash(null), 1200)
    setTimeout(() => setLogging(false), 500)
  }

  const streakTone =
    state === 'legendary'
      ? 'text-legendary'
      : state === 'inferno' || state === 'burning'
        ? 'text-amber-400'
        : state === 'building'
          ? 'text-text/90'
          : 'text-muted'

  return (
    <Link to={`/goals/${goal.id}`} className="group block">
      <div className="relative rounded-2xl bg-surface border border-border/10 shadow-card p-4 overflow-hidden transition-shadow hover:shadow-elevated">
        {/* Soft area tint in the corner. */}
        <div
          aria-hidden
          className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-25 blur-2xl pointer-events-none"
          style={{ background: `rgb(var(--${area.color}))` }}
        />
        {/* Left accent rail keyed to category. */}
        <div
          aria-hidden
          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r"
          style={{ background: `rgb(var(--${area.color}))` }}
        />

        <div className="relative space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Pill color={area.color}>
                <span className="inline-flex items-center gap-1">
                  <AreaIcon className="w-3 h-3" strokeWidth={1.8} />
                  {area.name}
                </span>
              </Pill>
              {goal.isBossBattle && !boss?.defeated && (
                <Pill color="rare">
                  <span className="inline-flex items-center gap-1">
                    <Skull className="w-3 h-3" strokeWidth={1.8} />
                    boss
                  </span>
                </Pill>
              )}
              {nearVictory && (
                <Pill color="health">
                  <span className="inline-flex items-center gap-1">near</span>
                </Pill>
              )}
              {goal.priority === 1 && <Pill color="accent">P1</Pill>}
            </div>

            <div className={`flex items-center gap-1 text-sm shrink-0 ${streakTone}`}>
              {StreakIcon ? (
                <StreakIcon className="w-4 h-4" strokeWidth={2} />
              ) : (
                <Flame className="w-4 h-4 opacity-40" strokeWidth={1.8} />
              )}
              <span className="tabular-nums font-bold">{goal.currentStreak}</span>
            </div>
          </div>

          <div className="font-display text-lg leading-tight line-clamp-2 text-text">
            {goal.title}
          </div>

          {milestonesTotal > 0 && (
            <div>
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted mb-1">
                <span>Milestones</span>
                <span className="tabular-nums">
                  {milestonesDone}/{milestonesTotal}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-surface2/70 overflow-hidden border border-border/30">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{
                    width: `${msPct}%`,
                    background: `linear-gradient(90deg, rgb(var(--${area.color})), rgb(var(--accent2)))`,
                  }}
                />
              </div>
            </div>
          )}

          {boss && !boss.defeated && (
            <div>
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-red-400/90 mb-1">
                <span>{boss.bossName} HP</span>
                <span className="tabular-nums">
                  {boss.currentHp}/{boss.bossHp}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-surface2/70 overflow-hidden border border-border/30">
                <div
                  className="h-full rounded-full transition-[width] duration-500 bg-gradient-to-r from-red-500 to-red-400"
                  style={{ width: `${bossPct * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="text-[11px] text-muted flex items-center gap-1.5 min-w-0">
              {atRisk ? (
                <span className="inline-flex items-center gap-1 text-amber-400">
                  <AlertTriangle className="w-3 h-3" strokeWidth={2.2} />
                  At risk · {lastAge}d
                </span>
              ) : lastAge === null ? (
                <span className="text-muted/70 italic">never logged</span>
              ) : lastAge === 0 ? (
                <span className="text-success">logged today</span>
              ) : (
                <span>last log {lastAge}d ago</span>
              )}
            </div>

            <div className="relative">
              <button
                onClick={handleLog}
                disabled={loggedToday || logging}
                className={`h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors duration-80 ${
                  loggedToday
                    ? 'bg-surface2/60 text-muted'
                    : 'bg-accent text-white hover:bg-accent2'
                } disabled:opacity-60`}
              >
                {logging ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : loggedToday ? (
                  <>
                    <Check className="w-3.5 h-3.5" strokeWidth={2.4} />
                    Logged
                  </>
                ) : (
                  'Log today'
                )}
              </button>
              <AnimatePresence>
                {flash && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: -20 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute right-0 top-0 text-[11px] font-bold text-accent2 pointer-events-none whitespace-nowrap"
                  >
                    +{flash.xp} XP
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

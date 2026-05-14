import { useMemo } from 'react'
import { useGoals } from '@/stores/goalsStore'
import { useQuests } from '@/stores/questsStore'
import { useSeason, currentSeason } from '@/stores/seasonStore'
import { Flame, Target, Swords } from 'lucide-react'
import { AREA_ICONS } from '@/components/icons'
import { AREA_LIST } from '@/data/areas'
import { todayISO } from '@/engine/dates'
import type { AreaId } from '@/types'

/**
 * Three compact cards directly below the task scroller.
 *   1) Today's focus area — by count of touched items today.
 *   2) Boss HP remaining — with a slim HP bar.
 *   3) Active streak count + fire icon, danger-colored if at risk.
 */
export function AtAGlanceMetrics() {
  const goals = useGoals((s) => s.goals)
  const quests = useQuests((s) => s.todayQuests)
  const season = useSeason()
  const currentS = currentSeason()
  const today = todayISO()

  const data = useMemo(() => {
    // Focus area — count by area across today's quests (resolved via their
    // linkedGoalId) + recently-touched goals.
    const counts = new Map<AreaId, number>()
    for (const q of quests) {
      const goal = q.linkedGoalId ? goals.find((g) => g.id === q.linkedGoalId) : undefined
      if (goal?.area) counts.set(goal.area, (counts.get(goal.area) ?? 0) + 1)
    }
    for (const g of goals) {
      const recent = g.lastLoggedAt && g.lastLoggedAt.slice(0, 10) === today
      counts.set(g.area, (counts.get(g.area) ?? 0) + (recent ? 2 : 0))
    }
    let focusArea: AreaId | null = null
    let max = 0
    counts.forEach((v, k) => {
      if (v > max) {
        focusArea = k
        max = v
      }
    })

    // Streak.
    const topStreak = goals.reduce((m, g) => Math.max(m, g.currentStreak), 0)
    const streakAtRisk = goals.some(
      (g) => g.currentStreak > 0 && g.lastLoggedAt && g.lastLoggedAt.slice(0, 10) !== today
    )

    // Boss HP.
    const bossPct =
      currentS.bossInitialHp === 0 ? 0 : Math.max(0, season.bossHp / currentS.bossInitialHp)

    return { focusArea, max, topStreak, streakAtRisk, bossPct, bossHp: season.bossHp, bossMax: currentS.bossInitialHp }
  }, [goals, quests, season, currentS, today])

  const focusAreaMeta = data.focusArea ? AREA_LIST.find((a) => a.id === data.focusArea) : null
  const FocusIcon = data.focusArea ? AREA_ICONS[data.focusArea] : Target

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-3">
      {/* Focus area */}
      <div
        className="rounded-xl border border-border/10 bg-surface p-3 flex items-center gap-2.5 shadow-card"
      >
        <span
          className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center"
          style={{
            background: data.focusArea
              ? `rgb(var(--${data.focusArea}) / 0.12)`
              : 'rgb(var(--surface2))',
            color: data.focusArea ? `rgb(var(--${data.focusArea}))` : 'rgb(var(--muted))',
          }}
        >
          <FocusIcon className="w-4 h-4" strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-muted">Focus</div>
          <div className="text-sm text-text truncate">
            {focusAreaMeta?.name ?? 'No focus yet'}
          </div>
        </div>
      </div>

      {/* Boss HP */}
      <div className="rounded-xl border border-border/10 bg-surface p-3 shadow-card">
        <div className="flex items-center gap-2 mb-1.5">
          <Swords className="w-3.5 h-3.5 text-accent2 shrink-0" strokeWidth={2} />
          <div className="text-[10px] uppercase tracking-wider text-muted">Boss</div>
          <div className="ml-auto text-xs text-text">
            {data.bossHp}/{data.bossMax}
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-surface2 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${(data.bossPct * 100).toFixed(1)}%`,
              background:
                data.bossPct > 0.5
                  ? 'rgb(var(--danger))'
                  : data.bossPct > 0.2
                    ? 'rgb(var(--warning))'
                    : 'rgb(var(--success))',
              transition: 'width 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
        </div>
      </div>

      {/* Streak */}
      <div className="rounded-xl border border-border/10 bg-surface p-3 flex items-center gap-2.5 shadow-card">
        <span
          className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center ${
            data.topStreak === 0
              ? 'bg-surface2 text-muted'
              : data.streakAtRisk
                ? 'bg-danger/15 text-danger animate-pulseGlow'
                : 'bg-warning/15 text-warning'
          }`}
        >
          <Flame className="w-4 h-4" strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-muted">Streak</div>
          <div className="text-sm text-text truncate">
            {data.topStreak > 0 ? `${data.topStreak} day${data.topStreak === 1 ? '' : 's'}` : 'None yet'}
          </div>
        </div>
      </div>
    </div>
  )
}

import { useMemo } from 'react'
import { Flame, Skull, Target, Activity, Trophy } from 'lucide-react'
import { useGoals } from '@/stores/goalsStore'
import { useCharacter } from '@/stores/characterStore'
import { daysBetween, todayISO } from '@/engine/dates'
import { Tooltip } from '@/components/ui/Tooltip'
import type { Goal } from '@/types'

/**
 * Portfolio header for the Goals tab — at-a-glance pulse of every active goal
 * the player is running. Sits above the filter/sort row.
 *
 * Stats:
 *   Active        — non-archived, non-completed goals
 *   Longest fire  — max currentStreak across active goals
 *   Bosses        — total alive boss-battle goals
 *   Near victory  — goals ≥75% milestone-completed (or boss HP ≤ 25%)
 *   Logs / 7d     — progress logs in the last 7 days, all goals
 *   Shields       — character.streakShields (used to revive broken streaks)
 */
export function GoalsBanner() {
  const goals = useGoals((s) => s.goals)
  const shields = useCharacter((s) => s.streakShields)

  const stats = useMemo(() => {
    const today = todayISO()
    const active = goals.filter((g) => !g.archivedAt && !g.completedAt)
    const longestFire = active.reduce((m, g) => Math.max(m, g.currentStreak), 0)
    const livingBosses = active.filter(
      (g) => g.isBossBattle && g.bossBattleConfig && !g.bossBattleConfig.defeated
    ).length
    const nearVictory = active.filter((g) => {
      const ms = g.milestones
      const done = ms.filter((m) => m.completedAt).length
      const msPct = ms.length > 0 ? done / ms.length : 0
      const bossPct =
        g.isBossBattle && g.bossBattleConfig
          ? 1 - g.bossBattleConfig.currentHp / Math.max(1, g.bossBattleConfig.bossHp)
          : 0
      return msPct >= 0.75 || bossPct >= 0.75
    }).length
    const sevenAgo = new Date()
    sevenAgo.setDate(sevenAgo.getDate() - 6)
    const cutoff = sevenAgo.toISOString().slice(0, 10)
    const logsThisWeek = goals.reduce(
      (n, g) => n + g.logs.filter((l) => l.date.slice(0, 10) >= cutoff).length,
      0
    )
    // Goals at risk: had a streak ≥ 2 but missed yesterday + today.
    const atRisk = active.filter((g) => {
      if (g.currentStreak < 2 || !g.lastLoggedAt) return false
      return daysBetween(g.lastLoggedAt.slice(0, 10), today) >= 2
    }).length
    return { active, longestFire, livingBosses, nearVictory, logsThisWeek, atRisk }
  }, [goals])

  if (stats.active.length === 0) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
      <Stat icon={Target} label="Active" value={stats.active.length} />
      <Stat
        icon={Flame}
        label="Longest fire"
        value={stats.longestFire}
        suffix={stats.longestFire > 0 ? 'd' : ''}
        tone={stats.longestFire >= 7 ? 'amber' : undefined}
        tooltip="Your longest streak across any goal, ever."
      />
      <Stat
        icon={Skull}
        label="Bosses"
        value={stats.livingBosses}
        tone={stats.livingBosses > 0 ? 'red' : undefined}
        tooltip="Goals you've promoted to boss battles — finite HP, daily attacks."
      />
      <Stat
        icon={Trophy}
        label="Near victory"
        value={stats.nearVictory}
        tone={stats.nearVictory > 0 ? 'success' : undefined}
        tooltip="Goals ≥ 75% milestone-complete (or boss HP ≤ 25%)."
      />
      <Stat icon={Activity} label="Logs · 7d" value={stats.logsThisWeek} />
      <Stat
        label="Shields"
        value={shields}
        emoji="🛡"
        tone={stats.atRisk > 0 ? 'amber' : undefined}
        sub={stats.atRisk > 0 ? `${stats.atRisk} at risk` : undefined}
        tooltip="Shields protect your streak from a missed day. You earn one each month."
      />
    </div>
  )
}

function Stat({
  icon: Icon,
  emoji,
  label,
  value,
  suffix,
  tone,
  sub,
  tooltip,
}: {
  icon?: typeof Flame
  emoji?: string
  label: string
  value: number
  suffix?: string
  tone?: 'amber' | 'red' | 'success'
  sub?: string
  tooltip?: string
}) {
  const valueColor =
    tone === 'amber'
      ? 'text-amber-400'
      : tone === 'red'
        ? 'text-red-400'
        : tone === 'success'
          ? 'text-success'
          : 'text-text'
  const body = (
    <div className="rounded-2xl bg-surface border border-border/10 shadow-card px-3 py-2.5 flex flex-col w-full">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase text-muted">
        {Icon ? <Icon className="w-3 h-3" strokeWidth={1.8} /> : <span>{emoji}</span>}
        <span>{label}</span>
      </div>
      <div className={`mt-0.5 font-display text-2xl leading-none tabular-nums ${valueColor}`}>
        {value}
        {suffix && <span className="text-sm text-muted ml-0.5 font-sans">{suffix}</span>}
      </div>
      {sub && <div className="text-[10px] text-muted/80 mt-1">{sub}</div>}
    </div>
  )
  if (tooltip) {
    return (
      <Tooltip content={tooltip}>
        <span className="block w-full cursor-help">{body}</span>
      </Tooltip>
    )
  }
  return body
}

// Re-export Goal-derived classifiers for the page filters so the categorisation
// of "near victory" and "at risk" stays in one place.
export function isNearVictory(g: Goal): boolean {
  const done = g.milestones.filter((m) => m.completedAt).length
  const msPct = g.milestones.length > 0 ? done / g.milestones.length : 0
  const bossPct =
    g.isBossBattle && g.bossBattleConfig
      ? 1 - g.bossBattleConfig.currentHp / Math.max(1, g.bossBattleConfig.bossHp)
      : 0
  return msPct >= 0.75 || bossPct >= 0.75
}

export function isAtRisk(g: Goal): boolean {
  if (g.currentStreak < 2 || !g.lastLoggedAt) return false
  return daysBetween(g.lastLoggedAt.slice(0, 10), todayISO()) >= 2
}

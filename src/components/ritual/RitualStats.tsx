import { Flame, Target, Trophy, BarChart3, Star } from 'lucide-react'
import type { RitualMath } from './ritualMath'

/**
 * Quick-glance stats strip — five tiles. Tells you whether the ritual is
 * trending up or you've drifted.
 */
export function RitualStats({ math }: { math: RitualMath }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
      <Tile
        icon={Flame}
        label="Current"
        value={math.currentPerfectStreak}
        suffix="d"
        sub="perfect streak"
        tone={math.currentPerfectStreak >= 7 ? 'amber' : math.currentPerfectStreak >= 3 ? 'accent' : undefined}
      />
      <Tile
        icon={Trophy}
        label="Longest"
        value={math.longestPerfectStreak}
        suffix="d"
        sub="ever"
      />
      <Tile
        icon={Star}
        label="Perfect · 30d"
        value={math.perfectDays30d}
        sub={`/ 30 days`}
        tone={math.perfectDays30d >= 20 ? 'success' : math.perfectDays30d >= 10 ? 'accent' : undefined}
      />
      <Tile
        icon={BarChart3}
        label="Week"
        value={Math.round(math.weeklyCompletionRate * 100)}
        suffix="%"
        sub="completion (7d)"
      />
      <Tile
        icon={Target}
        label="All-time"
        value={math.totalPerfectDays}
        sub="perfect days"
      />
    </div>
  )
}

function Tile({
  icon: Icon,
  label,
  value,
  suffix,
  sub,
  tone,
}: {
  icon: typeof Flame
  label: string
  value: number
  suffix?: string
  sub?: string
  tone?: 'amber' | 'success' | 'accent'
}) {
  const valueColor =
    tone === 'amber'
      ? 'text-amber-400'
      : tone === 'success'
        ? 'text-success'
        : tone === 'accent'
          ? 'text-accent'
          : 'text-text'
  return (
    <div className="rounded-2xl bg-surface border border-border/10 shadow-card px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted">
        <Icon className="w-3 h-3" strokeWidth={1.8} />
        <span>{label}</span>
      </div>
      <div className={`font-display text-2xl mt-0.5 tabular-nums leading-none ${valueColor}`}>
        {value}
        {suffix && <span className="text-sm text-muted ml-0.5 font-sans">{suffix}</span>}
      </div>
      {sub && <div className="text-[10px] text-muted/80 mt-1">{sub}</div>}
    </div>
  )
}

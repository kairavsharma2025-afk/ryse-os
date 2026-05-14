import { useMemo } from 'react'
import { Sparkles, Crown, BarChart3 } from 'lucide-react'
import { useCharacter } from '@/stores/characterStore'
import { useGoals } from '@/stores/goalsStore'
import { AREA_LIST, AREA_PASSIVES, AREAS } from '@/data/areas'
import { AREA_ICONS } from '@/components/icons'
import { masteryForArea } from '@/engine/masteryEngine'
import type { AreaId } from '@/types'

/**
 * Six-area stats card. Each cell shows:
 *   • Area icon (tinted) + name
 *   • 5-dot mastery indicator
 *   • Stat bar normalised to the player's own max stat
 *   • "N skill nodes · mastery N/5"
 *   • Active passive bonuses unlocked at mastery 3 and 5
 */
export function StatsGrid() {
  const stats = useCharacter((s) => s.stats)
  const goals = useGoals((s) => s.goals.filter((g) => !g.archivedAt))
  const max = Math.max(1, ...Object.values(stats))

  const rows = useMemo(
    () =>
      AREA_LIST.map((a) => ({
        area: a.id,
        stat: stats[a.id] ?? 0,
        mastery: masteryForArea(a.id, goals),
      })),
    [stats, goals]
  )

  return (
    <div className="rounded-2xl bg-surface border border-border/10 shadow-card p-5">
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 className="w-4 h-4 text-accent" strokeWidth={1.8} />
        <h2 className="font-display text-xl tracking-wide">Stats &amp; Mastery</h2>
      </div>
      <p className="text-xs text-muted mt-1 mb-4 max-w-prose">
        Rolling 30-day stats per area. Mastery unlocks passive bonuses at M3 and M5 — completed
        goals and boss wins build the nodes.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        {rows.map((row) => (
          <StatCell key={row.area} area={row.area} stat={row.stat} max={max} mastery={row.mastery} />
        ))}
      </div>
    </div>
  )
}

function StatCell({
  area,
  stat,
  max,
  mastery,
}: {
  area: AreaId
  stat: number
  max: number
  mastery: { mastery: number; nodes: number }
}) {
  const meta = AREAS[area]
  const Icon = AREA_ICONS[area]
  const passive3 = AREA_PASSIVES[area].mastery3
  const passive5 = AREA_PASSIVES[area].mastery5
  const pct = (stat / max) * 100
  const toNext = mastery.mastery >= 5 ? null : (mastery.mastery + 1) * 5 - mastery.nodes

  return (
    <div className="rounded-xl border border-border/30 bg-surface2/30 p-3.5">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: `rgb(var(--${meta.color}) / 0.15)`,
              color: `rgb(var(--${meta.color}))`,
            }}
          >
            <Icon className="w-4 h-4" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <div className="text-sm text-text">{meta.name}</div>
            <div className="text-[10px] text-muted">
              <span className="tabular-nums">{stat}</span> stat · M{mastery.mastery}/5
              {toNext !== null && (
                <span className="text-muted/70 tabular-nums"> · {toNext} to M{mastery.mastery + 1}</span>
              )}
            </div>
          </div>
        </div>
        <MasteryDots level={mastery.mastery} color={meta.color} />
      </div>

      <div className="h-1.5 rounded-full bg-surface2/70 border border-border/30 overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, rgb(var(--${meta.color})), rgb(var(--accent2)))`,
          }}
        />
      </div>

      {(mastery.mastery >= 3 || mastery.mastery >= 5) && (
        <div className="mt-2.5 space-y-1.5 text-[11px] leading-snug">
          {mastery.mastery >= 3 && (
            <div className="flex items-start gap-1.5 text-accent2">
              <Sparkles className="w-3 h-3 mt-0.5 shrink-0" strokeWidth={1.8} />
              <div>
                <span className="font-semibold">{passive3.name}</span>{' '}
                <span className="text-muted">— {passive3.effect}</span>
              </div>
            </div>
          )}
          {mastery.mastery >= 5 && (
            <div className="flex items-start gap-1.5 text-legendary">
              <Crown className="w-3 h-3 mt-0.5 shrink-0" strokeWidth={1.8} />
              <div>
                <span className="font-semibold">{passive5.name}</span>{' '}
                <span className="text-muted">— {passive5.effect}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MasteryDots({ level, color }: { level: number; color: string }) {
  return (
    <div
      className="flex items-center gap-0.5 shrink-0"
      title={`Mastery ${level}/5`}
      aria-label={`Mastery ${level} of 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: i <= level ? `rgb(var(--${color}))` : 'rgb(var(--surface2) / 0.9)',
            boxShadow: i <= level ? `0 0 4px rgb(var(--${color}) / 0.55)` : undefined,
          }}
        />
      ))}
    </div>
  )
}

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useCharacter } from '@/stores/characterStore'
import { useGoals } from '@/stores/goalsStore'
import { AREAS, AREA_LIST } from '@/data/areas'
import { AREA_ICONS } from '@/components/icons'
import { masteryForArea } from '@/engine/masteryEngine'
import type { AreaId } from '@/types'

/**
 * Six-area portrait. Per-area row shows:
 *
 *   [icon] Area name · stat                ●●●○○ mastery
 *   ━━━━━━━━━━━━━━━━━━━━━━━━━░░░  (stat bar, normalised to the max stat)
 *
 * The strongest area is highlighted; the weakest gets a "neglected" tag.
 */
export function AreaPortrait() {
  const stats = useCharacter((s) => s.stats)
  const goals = useGoals((s) => s.goals)

  const maxStat = Math.max(1, ...Object.values(stats))
  const ranked = useMemo(() => {
    const rows = AREA_LIST.map((a) => ({
      area: a.id,
      stat: stats[a.id] ?? 0,
      mastery: masteryForArea(a.id, goals),
    }))
    return [...rows].sort((a, b) => b.stat - a.stat)
  }, [stats, goals])

  const strongest = ranked[0]
  const weakest = ranked[ranked.length - 1]

  return (
    <div className="rounded-2xl bg-surface border border-border/10 shadow-card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.28em] text-muted">Portrait</div>
          <div className="font-display text-md text-text">
            Strongest:{' '}
            <span className="text-accent">{AREAS[strongest.area].name}</span>
            {strongest.area !== weakest.area && strongest.stat > 0 && weakest.stat === 0 && (
              <span className="text-muted text-sm">
                {' · '}neglected:{' '}
                <span className="text-amber-400">{AREAS[weakest.area].name}</span>
              </span>
            )}
          </div>
        </div>
        <Link to="/skills" className="text-xs text-accent hover:opacity-80">
          Open skills →
        </Link>
      </div>

      <ul className="space-y-2.5">
        {ranked.map((row) => (
          <AreaRow
            key={row.area}
            area={row.area}
            stat={row.stat}
            maxStat={maxStat}
            mastery={row.mastery.mastery}
            nodes={row.mastery.nodes}
            isStrongest={row.area === strongest.area && strongest.stat > 0}
          />
        ))}
      </ul>
    </div>
  )
}

function AreaRow({
  area,
  stat,
  maxStat,
  mastery,
  nodes,
  isStrongest,
}: {
  area: AreaId
  stat: number
  maxStat: number
  mastery: number
  nodes: number
  isStrongest: boolean
}) {
  const meta = AREAS[area]
  const Icon = AREA_ICONS[area]
  const pct = (stat / maxStat) * 100
  const nextMasteryNodes = mastery >= 5 ? null : (mastery + 1) * 5
  const remaining = nextMasteryNodes ? nextMasteryNodes - nodes : 0

  return (
    <li>
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: `rgb(var(--${meta.color}) / 0.15)`,
              color: `rgb(var(--${meta.color}))`,
            }}
          >
            <Icon className="w-4 h-4" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm text-text">{meta.name}</span>
              {isStrongest && (
                <span className="text-[9px] uppercase tracking-wider text-accent2/80">★</span>
              )}
            </div>
            <div className="text-[10px] text-muted">
              <span className="tabular-nums">{stat}</span> stat
              {nextMasteryNodes !== null && (
                <span className="text-muted/70">
                  {' · '}
                  <span className="tabular-nums">{remaining}</span> to M{mastery + 1}
                </span>
              )}
            </div>
          </div>
        </div>
        <MasteryDots level={mastery} color={meta.color} />
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden bg-surface2/60 border border-border/30"
        aria-label={`${meta.name}: ${stat}`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, rgb(var(--${meta.color})), rgb(var(--accent2)))`,
          }}
        />
      </div>
    </li>
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
            background:
              i <= level
                ? `rgb(var(--${color}))`
                : 'rgb(var(--surface2) / 0.9)',
            boxShadow: i <= level ? `0 0 4px rgb(var(--${color}) / 0.55)` : undefined,
          }}
        />
      ))}
    </div>
  )
}

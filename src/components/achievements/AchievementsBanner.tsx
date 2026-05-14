import { useMemo } from 'react'
import { ACHIEVEMENTS } from '@/data/achievements'
import type { Rarity } from '@/types'

const RARITY_ORDER: Rarity[] = ['common', 'rare', 'epic', 'legendary']
const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
}

/**
 * Four-tile rarity banner that doubles as a filter. Each tile shows
 * unlocked/total + a progress bar in the rarity color. Click a tile to
 * scope the grid to just that rarity; the active tile carries a stronger
 * border so the filter state reads at a glance.
 *
 * Click the active tile again to clear ("All").
 */
export function AchievementsBanner({
  unlockedIds,
  rarityFilter,
  onFilter,
}: {
  unlockedIds: Set<string>
  rarityFilter: Rarity | null
  onFilter: (next: Rarity | null) => void
}) {
  const stats = useMemo(() => {
    const map: Record<Rarity, { unlocked: number; total: number }> = {
      common: { unlocked: 0, total: 0 },
      rare: { unlocked: 0, total: 0 },
      epic: { unlocked: 0, total: 0 },
      legendary: { unlocked: 0, total: 0 },
    }
    for (const a of ACHIEVEMENTS) {
      map[a.rarity].total++
      if (unlockedIds.has(a.id)) map[a.rarity].unlocked++
    }
    return map
  }, [unlockedIds])

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
      {RARITY_ORDER.map((r) => {
        const s = stats[r]
        const active = rarityFilter === r
        const pct = s.total === 0 ? 0 : (s.unlocked / s.total) * 100
        const isComplete = s.unlocked > 0 && s.unlocked === s.total
        return (
          <button
            key={r}
            onClick={() => onFilter(active ? null : r)}
            aria-pressed={active}
            className={`text-left rounded-2xl shadow-card border px-3.5 py-3 transition-colors ${
              active ? 'bg-surface' : 'bg-surface hover:bg-surface2/40'
            }`}
            style={{
              borderColor: active
                ? `rgb(var(--${r}))`
                : 'rgb(var(--border) / 0.1)',
              boxShadow: active ? `0 0 18px rgb(var(--${r}) / 0.25)` : undefined,
            }}
          >
            <div
              className="text-[10px] uppercase tracking-[0.24em]"
              style={{ color: `rgb(var(--${r}))` }}
            >
              {RARITY_LABEL[r]}
            </div>
            <div className="font-display text-2xl mt-0.5 tabular-nums leading-none text-text">
              {s.unlocked}
              <span className="text-sm text-muted ml-0.5 font-sans">/ {s.total}</span>
              {isComplete && (
                <span className="ml-2 text-[10px] uppercase tracking-wider text-success">
                  ★ all
                </span>
              )}
            </div>
            <div className="mt-2 h-1 rounded-full bg-surface2/70 border border-border/30 overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${pct}%`,
                  background: `rgb(var(--${r}))`,
                  boxShadow: `0 0 6px rgb(var(--${r}) / 0.45)`,
                }}
              />
            </div>
          </button>
        )
      })}
    </div>
  )
}

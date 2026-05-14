import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, Lock } from 'lucide-react'
import { useCharacter } from '@/stores/characterStore'
import { ACHIEVEMENTS, getAchievement } from '@/data/achievements'
import type { Rarity } from '@/types'

/**
 * Two-band showcase: most recent unlocks on top, three "next up" locked
 * achievements (with their hint text) underneath. The locked picks try to
 * surface "low effort, high motivation" — common-rarity entries first.
 */
export function AchievementShowcase() {
  const unlocked = useCharacter((s) => s.achievements)

  const recent = useMemo(() => unlocked.slice(-6).reverse(), [unlocked])
  const locked = useMemo(() => {
    const unlockedSet = new Set(unlocked)
    const remaining = ACHIEVEMENTS.filter((a) => !unlockedSet.has(a.id))
    // Prefer commons first so the suggestion stays approachable.
    return remaining
      .sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity])
      .slice(0, 3)
  }, [unlocked])

  if (unlocked.length === 0 && locked.length === 0) return null

  return (
    <div className="rounded-2xl bg-surface border border-border/10 shadow-card p-4 sm:p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-accent" strokeWidth={1.8} />
        <h3 className="font-display text-lg tracking-wide">Achievements</h3>
        <span className="text-xs text-muted ml-1">
          {unlocked.length}/{ACHIEVEMENTS.length}
        </span>
        <Link
          to="/achievements"
          className="ml-auto text-xs text-accent hover:opacity-80"
        >
          See all →
        </Link>
      </div>

      {recent.length > 0 && (
        <section>
          <div className="text-[10px] uppercase tracking-[0.28em] text-muted mb-2 px-0.5">
            Recently unlocked
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {recent.map((id) => {
              const a = getAchievement(id)
              if (!a) return null
              return (
                <div
                  key={id}
                  className="rounded-xl border px-3 py-2.5 flex items-center gap-3"
                  style={{
                    borderColor: `rgb(var(--${RARITY_COLOR[a.rarity]}) / 0.4)`,
                    background: `rgb(var(--${RARITY_COLOR[a.rarity]}) / 0.06)`,
                  }}
                >
                  <span className="text-2xl shrink-0">{a.icon}</span>
                  <div className="min-w-0">
                    <div className="text-sm text-text truncate">{a.name}</div>
                    <div
                      className="text-[10px] uppercase tracking-wider"
                      style={{ color: `rgb(var(--${RARITY_COLOR[a.rarity]}))` }}
                    >
                      {a.rarity}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {locked.length > 0 && (
        <section>
          <div className="text-[10px] uppercase tracking-[0.28em] text-muted mb-2 px-0.5 flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            Up next
          </div>
          <ul className="space-y-2">
            {locked.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 rounded-xl border border-border/30 bg-surface2/30 px-3 py-2"
              >
                <span className="text-xl grayscale opacity-70 shrink-0">{a.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-text">{a.name}</div>
                  <div className="text-[11px] text-muted leading-snug">{a.hint}</div>
                </div>
                <div
                  className="text-[10px] uppercase tracking-wider shrink-0"
                  style={{ color: `rgb(var(--${RARITY_COLOR[a.rarity]}))` }}
                >
                  +{a.xpReward}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

const RARITY_ORDER: Record<Rarity, number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
}

const RARITY_COLOR: Record<Rarity, string> = {
  common: 'muted',
  rare: 'accent',
  epic: 'accent2',
  legendary: 'legendary',
}

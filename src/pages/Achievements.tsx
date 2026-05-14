import { useMemo, useState } from 'react'
import { Trophy, Lock, Sparkles } from 'lucide-react'
import { useCharacter } from '@/stores/characterStore'
import { ACHIEVEMENTS } from '@/data/achievements'
import { AchievementsBanner } from '@/components/achievements/AchievementsBanner'
import { AchievementCard } from '@/components/achievements/AchievementCard'
import type { Rarity } from '@/types'

const RARITY_ORDER: Rarity[] = ['common', 'rare', 'epic', 'legendary']
const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
}

type StatusTab = 'all' | 'unlocked' | 'locked'

const STATUS: { id: StatusTab; label: string; icon: typeof Trophy }[] = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'unlocked', label: 'Unlocked', icon: Trophy },
  { id: 'locked', label: 'Locked', icon: Lock },
]

/**
 * Achievements gallery. Rarity banner doubles as a filter; status segmented
 * control toggles between All / Unlocked / Locked. The grid is grouped by
 * rarity (highest tier first when filtered to legendary; common first
 * otherwise) so the visual hierarchy mirrors the rarity gradient.
 */
export function Achievements() {
  const unlocked = useCharacter((s) => new Set(s.achievements))
  const [rarity, setRarity] = useState<Rarity | null>(null)
  const [status, setStatus] = useState<StatusTab>('all')

  const filtered = useMemo(() => {
    return ACHIEVEMENTS.filter((a) => {
      if (rarity && a.rarity !== rarity) return false
      if (status === 'unlocked') return unlocked.has(a.id)
      if (status === 'locked') return !unlocked.has(a.id)
      return true
    })
  }, [rarity, status, unlocked])

  const byRarity = useMemo(() => {
    const map: Record<Rarity, typeof ACHIEVEMENTS> = {
      common: [],
      rare: [],
      epic: [],
      legendary: [],
    }
    for (const a of filtered) map[a.rarity].push(a)
    return map
  }, [filtered])

  const statusCounts: Record<StatusTab, number> = useMemo(() => {
    let u = 0
    for (const a of ACHIEVEMENTS) if (unlocked.has(a.id)) u++
    return {
      all: ACHIEVEMENTS.length,
      unlocked: u,
      locked: ACHIEVEMENTS.length - u,
    }
  }, [unlocked])

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl tracking-wide">Achievements</h1>
        <p className="text-sm text-muted mt-1">
          {statusCounts.unlocked} of {statusCounts.all} unlocked.{' '}
          {statusCounts.unlocked === statusCounts.all
            ? "Every glyph claimed — you've gone the distance."
            : `${statusCounts.locked} still hidden in the fog.`}
        </p>
      </header>

      <AchievementsBanner
        unlockedIds={unlocked}
        rarityFilter={rarity}
        onFilter={setRarity}
      />

      <div className="flex items-center gap-2 flex-wrap">
        <div
          role="tablist"
          aria-label="Status"
          className="inline-flex p-1 rounded-xl bg-surface2/50 border border-border/10 gap-0.5"
        >
          {STATUS.map((t) => {
            const Icon = t.icon
            const active = status === t.id
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setStatus(t.id)}
                className={`px-3 h-9 rounded-lg text-sm transition-colors duration-80 flex items-center gap-1.5 whitespace-nowrap ${
                  active
                    ? 'bg-accent text-white font-semibold shadow-card'
                    : 'text-muted hover:text-text'
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={active ? 2.2 : 1.8} />
                {t.label}
                <span
                  className={`text-[10px] px-1 rounded-full font-bold ${
                    active ? 'bg-white/25 text-white' : 'bg-surface2 text-muted'
                  }`}
                >
                  {statusCounts[t.id]}
                </span>
              </button>
            )
          })}
        </div>
        {rarity && (
          <button
            onClick={() => setRarity(null)}
            className="text-[11px] text-muted hover:text-text underline-offset-2 hover:underline"
          >
            Clear rarity filter
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border/10 bg-surface shadow-card p-8 text-center">
          <div className="text-sm text-muted">
            Nothing matches. Try clearing a filter.
          </div>
        </div>
      ) : (
        <div className="space-y-7">
          {RARITY_ORDER.map((r) => {
            const list = byRarity[r]
            if (list.length === 0) return null
            return (
              <section key={r}>
                <div
                  className="text-[10px] uppercase tracking-[0.4em] mb-3 flex items-center gap-2"
                  style={{ color: `rgb(var(--${r}))` }}
                >
                  <span>{RARITY_LABEL[r]}</span>
                  <span className="text-muted/60 tracking-normal normal-case">·</span>
                  <span className="text-muted/70 tracking-normal normal-case tabular-nums">
                    {list.filter((a) => unlocked.has(a.id)).length}/{list.length}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {list.map((a) => (
                    <AchievementCard
                      key={a.id}
                      achievement={a}
                      unlocked={unlocked.has(a.id)}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

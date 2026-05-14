import { useMemo, useState } from 'react'
import { Sparkles, Palette, Crown, Lock, Package } from 'lucide-react'
import { useCharacter } from '@/stores/characterStore'
import { THEMES } from '@/data/themes'
import { Button } from '@/components/ui/Button'
import { Pill } from '@/components/ui/Pill'
import { Empty } from '@/components/ui/Empty'
import type { Rarity } from '@/types'

function lockedHint(rarity: Rarity): string {
  switch (rarity) {
    case 'common':
      return 'Earned automatically as you level up early.'
    case 'rare':
      return 'Drops from completing your first boss battle or hitting Lv 10.'
    case 'epic':
      return 'Defeat a seasonal boss or reach Mastery 3 in any area.'
    case 'legendary':
      return 'Reserved for the long path. End-game players only.'
    default:
      return 'Locked. Keep playing.'
  }
}

type TypeTab = 'all' | 'theme' | 'title' | 'frame' | 'other'

const TABS: { id: TypeTab; label: string; icon: typeof Sparkles }[] = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'theme', label: 'Themes', icon: Palette },
  { id: 'title', label: 'Titles', icon: Crown },
  { id: 'frame', label: 'Frames', icon: Package },
]

/**
 * Loot inventory. Banner summarises the haul (drops · themes unlocked ·
 * titles · frames). Theme browser sits on top with active/locked states;
 * the drops feed below shows everything ever awarded.
 */
export function Loot() {
  const c = useCharacter()
  const [tab, setTab] = useState<TypeTab>('all')

  const themesUnlocked = THEMES.filter((t) => c.unlockedThemes.includes(t.id))
  const themesLocked = THEMES.filter((t) => !c.unlockedThemes.includes(t.id))

  const drops = useMemo(() => {
    if (tab === 'all') return c.loot
    return c.loot.filter((l) =>
      tab === 'other' ? l.type !== 'theme' && l.type !== 'title' && l.type !== 'avatarFrame' :
      tab === 'frame' ? l.type === 'avatarFrame' :
      l.type === tab
    )
  }, [c.loot, tab])

  const counts = useMemo(
    () => ({
      themes: c.unlockedThemes.length,
      titles: c.titles.length,
      frames: c.unlockedAvatarFrames.length,
      drops: c.loot.length,
    }),
    [c.unlockedThemes.length, c.titles.length, c.unlockedAvatarFrames.length, c.loot.length]
  )

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl tracking-wide">Loot</h1>
        <p className="text-sm text-muted mt-1">
          Everything you've pulled from this run.
        </p>
      </header>

      {/* Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <Tile icon={Sparkles} label="Drops" value={counts.drops} />
        <Tile
          icon={Palette}
          label="Themes"
          value={`${counts.themes}/${THEMES.length}`}
        />
        <Tile icon={Crown} label="Titles" value={counts.titles} />
        <Tile icon={Package} label="Frames" value={counts.frames} />
      </div>

      {/* Themes browser */}
      <section className="space-y-4">
        <div className="text-[10px] uppercase tracking-[0.28em] text-muted px-1">Themes</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {themesUnlocked.map((t) => {
            const active = c.activeTheme === t.id
            return (
              <div
                key={t.id}
                className={`rounded-2xl border shadow-card p-4 transition-colors ${
                  active ? 'border-accent/50 bg-accent/5' : 'border-border/10 bg-surface'
                }`}
                style={active ? { boxShadow: '0 0 18px rgb(var(--accent) / 0.25)' } : undefined}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="font-display text-lg">{t.name}</div>
                  <Pill color={t.rarity}>{t.rarity}</Pill>
                </div>
                <div
                  className="h-16 rounded-lg mb-3 border border-border/30"
                  style={{
                    background: `linear-gradient(135deg, ${t.preview.bg} 0%, ${t.preview.surface} 50%, ${t.preview.accent} 100%)`,
                  }}
                />
                <div className="text-xs text-muted leading-relaxed mb-3 min-h-[2.5rem]">
                  {t.description}
                </div>
                <Button
                  size="sm"
                  variant={active ? 'ghost' : 'primary'}
                  disabled={active}
                  onClick={() => c.setActiveTheme(t.id)}
                  full
                >
                  {active ? 'Equipped' : 'Equip'}
                </Button>
              </div>
            )
          })}
        </div>
        {themesLocked.length > 0 && (
          <>
            <div className="text-[10px] uppercase tracking-wide text-muted px-1 pt-2 inline-flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              Locked · {themesLocked.length} to earn
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {themesLocked.map((t) => {
                const hint = lockedHint(t.rarity)
                return (
                  <div
                    key={t.id}
                    className="relative rounded-2xl border border-dashed border-border/40 bg-surface/40 p-4 overflow-hidden group hover:border-accent/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2 relative">
                      <div className="font-display text-base text-muted/80">???</div>
                      <Pill color={t.rarity}>{t.rarity}</Pill>
                    </div>
                    <div
                      className="h-12 rounded-md mb-3 border border-border/30 relative overflow-hidden"
                      aria-hidden
                    >
                      <div
                        className="absolute inset-0 blur-md opacity-40 group-hover:opacity-60 transition-opacity"
                        style={{
                          background: `linear-gradient(135deg, ${t.preview.bg} 0%, ${t.preview.surface} 50%, ${t.preview.accent} 100%)`,
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-muted/80">
                        <Lock className="w-5 h-5" strokeWidth={1.6} />
                      </div>
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-muted/80 mb-1">
                      Visual theme
                    </div>
                    <div className="text-[11px] text-muted leading-relaxed">{hint}</div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </section>

      {/* Drops feed */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-[10px] uppercase tracking-[0.28em] text-muted px-1">Drops</div>
          <div className="ml-auto inline-flex p-1 rounded-xl bg-surface2/50 border border-border/10 gap-0.5">
            {TABS.map((t) => {
              const Icon = t.icon
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-3 h-8 rounded-lg text-xs transition-colors flex items-center gap-1.5 ${
                    active
                      ? 'bg-accent text-white font-semibold'
                      : 'text-muted hover:text-text'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={active ? 2.2 : 1.8} />
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>
        {drops.length === 0 ? (
          <Empty
            icon={Sparkles}
            title={tab === 'all' ? 'No drops yet.' : 'Nothing in this lane yet.'}
            body="Defeat a boss. Complete a goal. The first drop is the most exciting."
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...drops].reverse().map((l) => (
              <div
                key={l.id}
                className="rounded-2xl border border-border/10 bg-surface shadow-card p-4"
              >
                <div className="flex items-center justify-between mb-1">
                  <Pill color={l.rarity}>{l.rarity}</Pill>
                  <span className="text-[10px] text-muted uppercase tracking-wider">
                    {l.type === 'avatarFrame' ? 'frame' : l.type}
                  </span>
                </div>
                <div className="font-display text-lg mt-0.5">{l.name}</div>
                <div className="text-xs text-muted leading-relaxed mt-1">{l.description}</div>
                <div className="text-[10px] text-muted/80 mt-3">From: {l.source}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function Tile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Sparkles
  label: string
  value: number | string
}) {
  return (
    <div className="rounded-2xl bg-surface border border-border/10 shadow-card px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted">
        <Icon className="w-3 h-3" strokeWidth={1.8} />
        <span>{label}</span>
      </div>
      <div className="font-display text-2xl mt-0.5 tabular-nums leading-none text-text">
        {value}
      </div>
    </div>
  )
}

import { useCharacter } from '@/stores/characterStore'
import { THEMES } from '@/data/themes'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Pill } from '@/components/ui/Pill'
import { Empty } from '@/components/ui/Empty'
import { Lock } from '@/components/icons'
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

export function Loot() {
  const c = useCharacter()
  const themesUnlocked = THEMES.filter((t) => c.unlockedThemes.includes(t.id))
  const themesLocked = THEMES.filter((t) => !c.unlockedThemes.includes(t.id))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl tracking-wide">Loot</h1>
        <p className="text-muted text-sm">
          {c.loot.length} drops · {c.unlockedThemes.length}/{THEMES.length} themes unlocked
        </p>
      </div>

      <section>
        <h2 className="font-display text-xl tracking-wide mb-3">Themes</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {themesUnlocked.map((t) => (
            <Card
              key={t.id}
              className={`p-4 ${c.activeTheme === t.id ? 'shadow-glow border-accent' : ''}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="font-display text-lg">{t.name}</div>
                <Pill color={t.rarity}>{t.rarity}</Pill>
              </div>
              <div
                className="h-16 rounded-md mb-3 border border-border"
                style={{
                  background: `linear-gradient(135deg, ${t.preview.bg} 0%, ${t.preview.surface} 50%, ${t.preview.accent} 100%)`,
                }}
              />
              <div className="text-xs text-muted leading-relaxed mb-3">
                {t.description}
              </div>
              <Button
                size="sm"
                variant={c.activeTheme === t.id ? 'ghost' : 'primary'}
                disabled={c.activeTheme === t.id}
                onClick={() => c.setActiveTheme(t.id)}
                full
              >
                {c.activeTheme === t.id ? 'Equipped' : 'Equip'}
              </Button>
            </Card>
          ))}
        </div>
        {themesLocked.length > 0 && (
          <>
            <div className="text-[10px] uppercase tracking-wide text-muted mb-2">
              Locked · {themesLocked.length} to earn
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {themesLocked.map((t) => {
                const hint = lockedHint(t.rarity)
                return (
                  <div
                    key={t.id}
                    className="relative rounded-2xl border border-border/70 border-dashed bg-surface/40 p-4 overflow-hidden group hover:border-accent/30 transition"
                  >
                    <div className="flex items-center justify-between mb-2 relative">
                      <div className="font-display text-base text-muted/80">???</div>
                      <Pill color={t.rarity}>{t.rarity}</Pill>
                    </div>
                    {/* Blurred silhouette preview using the theme's actual gradient */}
                    <div
                      className="h-12 rounded-md mb-3 border border-border/50 relative overflow-hidden"
                      aria-hidden
                    >
                      <div
                        className="absolute inset-0 blur-md opacity-40 group-hover:opacity-60 transition"
                        style={{
                          background: `linear-gradient(135deg, ${t.preview.bg} 0%, ${t.preview.surface} 50%, ${t.preview.accent} 100%)`,
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-muted/80">
                        <Lock className="w-5 h-5" strokeWidth={1.6} />
                      </div>
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-muted/80 mb-1">
                      Visual Theme
                    </div>
                    <div className="text-[11px] text-muted leading-relaxed">{hint}</div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl tracking-wide mb-3">All drops</h2>
        {c.loot.length === 0 ? (
          <Empty
            emoji="·"
            title="No drops yet."
            body="Defeat a boss. Complete a goal. The first drop is the most exciting."
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...c.loot].reverse().map((l) => (
              <Card key={l.id} className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <Pill color={l.rarity}>{l.rarity}</Pill>
                  <span className="text-[10px] text-muted">{l.type}</span>
                </div>
                <div className="font-display text-lg">{l.name}</div>
                <div className="text-xs text-muted leading-relaxed mt-1">
                  {l.description}
                </div>
                <div className="text-[10px] text-muted mt-3">From: {l.source}</div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

import { useCharacter } from '@/stores/characterStore'
import { ACHIEVEMENTS } from '@/data/achievements'
import type { Rarity } from '@/types'
import { motion } from 'framer-motion'
import { achievementIcon, Lock } from '@/components/icons'

const RARITY_ORDER: Rarity[] = ['common', 'rare', 'epic', 'legendary']

export function Achievements() {
  const unlocked = useCharacter((s) => new Set(s.achievements))
  const total = ACHIEVEMENTS.length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl tracking-wide">Achievements</h1>
          <p className="text-muted text-sm">
            {unlocked.size} / {total} unlocked
          </p>
        </div>
      </div>

      {RARITY_ORDER.map((rarity) => {
        const list = ACHIEVEMENTS.filter((a) => a.rarity === rarity)
        if (list.length === 0) return null
        return (
          <section key={rarity} className="mb-8">
            <div
              className="text-[10px] uppercase tracking-[0.4em] mb-3"
              style={{ color: `rgb(var(--${rarity}))` }}
            >
              {rarity}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {list.map((a) => {
                const have = unlocked.has(a.id)
                const Icon = achievementIcon(a.id, a.rarity)
                return (
                  <motion.div
                    key={a.id}
                    layout
                    className={`rounded-2xl border p-4 ${
                      have
                        ? `bg-surface border-${rarity}/40`
                        : 'bg-surface/50 border-border opacity-75'
                    }`}
                    style={{
                      borderColor: have ? `rgb(var(--${rarity}) / 0.5)` : undefined,
                      boxShadow:
                        have && rarity === 'legendary'
                          ? `0 0 24px rgb(var(--${rarity}) / 0.3)`
                          : undefined,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{
                          background: have
                            ? `rgb(var(--${rarity}) / 0.15)`
                            : 'rgb(var(--surface2) / 0.6)',
                          color: have
                            ? `rgb(var(--${rarity}))`
                            : 'rgb(var(--muted) / 0.6)',
                        }}
                      >
                        {have ? (
                          <Icon className="w-6 h-6" strokeWidth={1.6} />
                        ) : (
                          <Lock className="w-5 h-5" strokeWidth={1.6} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-display text-lg leading-tight flex items-center gap-2 flex-wrap">
                          {a.name}
                          {!have && (
                            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-surface2/60 border border-border/60 text-muted/70">
                              Locked
                            </span>
                          )}
                        </div>
                        {!have && (
                          <div className="text-[9px] uppercase tracking-[0.18em] text-muted/55 mt-1.5">
                            How to unlock
                          </div>
                        )}
                        <div className={`text-[11px] text-muted leading-relaxed ${have ? 'mt-1' : 'mt-0.5'}`}>
                          {a.description}
                        </div>
                        {!have && a.hint && a.hint !== a.description && (
                          <div className="text-[10px] text-muted/50 italic leading-relaxed mt-1">
                            {a.hint}
                          </div>
                        )}
                        <div className="text-[10px] mt-2 flex items-center gap-2 text-muted">
                          <span>+{a.xpReward} XP</span>
                          {a.unlocksTitle && <span>· title</span>}
                          {a.unlocksTheme && <span>· theme</span>}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}

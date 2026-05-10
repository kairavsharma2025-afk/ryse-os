import { RITUAL_STEPS } from '@/data/ritual'
import { useModules } from '@/stores/modulesStore'
import { todayISO } from '@/engine/dates'
import { actionRitualToggle } from '@/engine/gameLoop'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { RITUAL_ICONS, Check } from '@/components/icons'

export function Ritual() {
  const today = todayISO()
  const log = useModules((s) => s.ritual.logs.find((l) => l.date === today))
  const all = useModules((s) => s.ritual.logs)
  const done = new Set(log?.completedStepIds ?? [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-wide">Daily Ritual</h1>
        <p className="text-muted text-sm">
          Six small things. Done daily, they compound into a different person.
        </p>
      </div>

      <Card className="p-5">
        <div className="space-y-2">
          {(() => {
            const nextIdx = RITUAL_STEPS.findIndex((s) => !done.has(s.id))
            return RITUAL_STEPS.map((s, i) => {
              const isDone = done.has(s.id)
              const isUpNext = nextIdx !== -1 && i === nextIdx
              const Icon = RITUAL_ICONS[s.id]
              return (
                <motion.button
                  key={s.id}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => actionRitualToggle(s.id)}
                  className={`relative w-full text-left flex items-center gap-4 p-4 rounded-xl border transition ${
                    isDone
                      ? 'border-accent/40 bg-accent/10 opacity-70'
                      : isUpNext
                        ? 'border-accent bg-accent/5 shadow-glow ring-1 ring-accent/40'
                        : 'border-border bg-surface2/40 hover:border-accent/30'
                  }`}
                >
                  {isUpNext && (
                    <span className="absolute -top-2 left-4 px-2 py-0.5 rounded-full bg-accent text-bg text-[10px] uppercase tracking-wider font-bold">
                      Do this now →
                    </span>
                  )}
                  <span
                    className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                      isDone
                        ? 'bg-accent/10 text-accent/60'
                        : isUpNext
                          ? 'bg-accent/15 text-accent'
                          : 'bg-surface text-accent2'
                    }`}
                  >
                    {Icon && <Icon className="w-6 h-6" strokeWidth={1.7} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-medium ${isDone ? 'line-through text-muted' : ''}`}
                    >
                      {s.label}
                    </div>
                    <div className="text-xs text-muted leading-relaxed">
                      {s.description}
                    </div>
                  </div>
                  <div className="text-xs text-accent2">+{s.xpReward}</div>
                  {isDone && (
                    <Check className="w-5 h-5 text-accent shrink-0" strokeWidth={2.5} />
                  )}
                </motion.button>
              )
            })
          })()}
        </div>
        <div className="text-xs text-muted mt-4">
          Complete all 6 today for a Perfect Ritual bonus (+50 XP).
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-lg mb-3">History</h3>
        {all.length === 0 ? (
          <div className="text-xs text-muted">No ritual history yet. Today is day one.</div>
        ) : (
          <div className="grid grid-cols-7 gap-1.5 max-w-md">
            {[...all].slice(-49).map((l) => (
              <div
                key={l.date}
                className={`aspect-square rounded text-[9px] flex items-center justify-center ${
                  l.completedStepIds.length >= 6
                    ? 'bg-accent text-bg'
                    : l.completedStepIds.length >= 3
                      ? 'bg-accent/40 text-text'
                      : 'bg-surface2 text-muted'
                }`}
                title={`${l.date} — ${l.completedStepIds.length}/6`}
              >
                {l.completedStepIds.length}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

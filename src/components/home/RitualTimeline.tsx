import { motion } from 'framer-motion'
import { RITUAL_STEPS } from '@/data/ritual'
import { useModules } from '@/stores/modulesStore'
import { todayISO } from '@/engine/dates'
import { actionRitualToggle } from '@/engine/gameLoop'
import { RITUAL_ICONS, Check } from '@/components/icons'

export function RitualTimeline() {
  const today = todayISO()
  const log = useModules((s) => s.ritual.logs.find((l) => l.date === today))
  const done = new Set(log?.completedStepIds ?? [])
  const nextIncompleteIdx = RITUAL_STEPS.findIndex((s) => !done.has(s.id))
  const allDone = nextIncompleteIdx === -1

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-xl tracking-wide">Daily Ritual</h2>
        <span className="text-[10px] text-muted">
          {done.size}/{RITUAL_STEPS.length} done
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {RITUAL_STEPS.map((s, i) => {
          const isDone = done.has(s.id)
          const isUpNext = !allDone && i === nextIncompleteIdx
          const Icon = RITUAL_ICONS[s.id]
          return (
            <motion.button
              key={s.id}
              layout
              onClick={() => actionRitualToggle(s.id)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className={`text-left rounded-xl border p-3 transition relative ${
                isDone
                  ? 'border-accent/40 bg-accent/10 opacity-70'
                  : isUpNext
                    ? 'border-accent bg-accent/5 shadow-glow ring-1 ring-accent/40'
                    : 'border-border bg-surface hover:border-accent/30 opacity-90'
              }`}
            >
              {isUpNext && (
                <span className="absolute -top-2 left-3 px-1.5 py-0.5 rounded-full bg-accent text-bg text-[9px] uppercase tracking-wider font-bold">
                  Up next
                </span>
              )}
              <div className="flex items-start gap-2">
                <div
                  className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                    isDone
                      ? 'bg-accent/10 text-accent/60'
                      : isUpNext
                        ? 'bg-accent/15 text-accent'
                        : 'bg-surface2/60 text-accent2'
                  }`}
                >
                  {Icon && <Icon className="w-5 h-5" strokeWidth={1.7} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase tracking-wide text-muted">
                    Step {i + 1} · +{s.xpReward} XP
                  </div>
                  <div
                    className={`text-sm font-medium truncate ${
                      isDone ? 'line-through text-muted' : ''
                    }`}
                  >
                    {s.label}
                  </div>
                  <div className="text-[11px] text-muted leading-tight line-clamp-2 mt-0.5">
                    {s.description}
                  </div>
                </div>
                {isDone && (
                  <Check className="w-4 h-4 text-accent shrink-0" strokeWidth={2.5} />
                )}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

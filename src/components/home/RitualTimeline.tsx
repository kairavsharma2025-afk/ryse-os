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
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold tabular-nums border-2 ${
                    isDone
                      ? 'bg-success border-success text-white'
                      : isUpNext
                        ? 'border-accent text-accent bg-accent/10'
                        : 'border-border/60 text-muted'
                  }`}
                  aria-hidden="true"
                >
                  {isDone ? <Check className="w-4 h-4" strokeWidth={2.6} /> : i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase tracking-wide text-muted flex items-center gap-1.5">
                    <span>Step {i + 1}</span>
                    <span className="text-reward font-bold">+{s.xpReward} XP</span>
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
                {Icon && (
                  <Icon
                    className={`w-4 h-4 shrink-0 ${isDone ? 'text-accent/50' : 'text-accent2'}`}
                    strokeWidth={1.7}
                  />
                )}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

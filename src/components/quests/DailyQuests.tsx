import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuests } from '@/stores/questsStore'
import { actionCompleteQuest } from '@/engine/gameLoop'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { RotateCcw, Check } from '@/components/icons'
import { Sunrise } from 'lucide-react'

export function DailyQuests() {
  const quests = useQuests((s) => s.todayQuests)
  const ensureToday = useQuests((s) => s.ensureToday)
  const skip = useQuests((s) => s.skipQuest)
  const regenerate = useQuests((s) => s.regenerateToday)
  const nav = useNavigate()
  const [confirmingRegen, setConfirmingRegen] = useState(false)

  useEffect(() => {
    ensureToday()
  }, [ensureToday])

  const allDone = quests.length > 0 && quests.every((q) => q.completedAt)

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-2">
        <h2 className="font-display text-xl tracking-wide">Daily Quests</h2>
        {confirmingRegen ? (
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide">
            <span className="text-muted hidden sm:inline">Replace today's quests?</span>
            <button
              onClick={() => {
                regenerate()
                setConfirmingRegen(false)
              }}
              className="px-2.5 py-1 rounded border border-accent/60 text-accent hover:bg-accent/10 transition"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmingRegen(false)}
              className="px-2.5 py-1 rounded border border-border text-muted hover:text-text transition"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingRegen(true)}
            className="text-[10px] uppercase tracking-wide text-muted hover:text-text border border-transparent hover:border-border rounded px-2 py-1 transition flex items-center gap-1.5"
            title="Replace today's quests with a new set"
          >
            <RotateCcw className="w-3 h-3" strokeWidth={2} />
            Regenerate
          </button>
        )}
      </div>

      {quests.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6 text-center text-muted">
          No quests available. Add a goal first.
        </div>
      )}

      <div
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 snap-x snap-mandatory overflow-x-auto sm:overflow-visible -mx-1 px-1 pb-1"
        style={{ scrollbarGutter: 'stable' }}
      >
        <AnimatePresence>
          {quests.map((q) => {
            const done = !!q.completedAt
            const skipped = !!q.skippedAt
            return (
              <motion.div
                key={q.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 80 }}
                transition={{ type: 'spring', damping: 22 }}
                className={`relative rounded-2xl border p-4 transition snap-start min-w-[260px] sm:min-w-0 flex flex-col ${
                  done
                    ? 'border-accent/40 bg-accent/5'
                    : skipped
                      ? 'border-border/40 bg-surface/50 opacity-60'
                      : 'border-border bg-surface hover:border-accent/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full"
                    style={{
                      background: 'rgb(var(--accent) / 0.12)',
                      color: 'rgb(var(--accent))',
                    }}
                  >
                    +{q.xpReward} XP
                  </span>
                  {q.bonusXp && !done && (
                    <span className="text-[10px] text-accent2">
                      +{q.bonusXp} before noon
                    </span>
                  )}
                </div>
                <div className="font-medium text-sm leading-snug mb-1">{q.title}</div>
                <div className="text-xs text-muted leading-relaxed mb-4 line-clamp-3 flex-1">
                  {q.description}
                </div>
                {!done && !skipped && (
                  <div className="space-y-2 mt-auto">
                    <Button
                      size="sm"
                      full
                      onClick={() => {
                        if (q.linkedGoalId) nav(`/goals/${q.linkedGoalId}`)
                        else if (q.linkedModule) nav(`/${q.linkedModule}`)
                        else actionCompleteQuest(q.id)
                      }}
                    >
                      {q.linkedGoalId ? 'Go to goal' : q.linkedModule ? 'Open' : 'Mark complete'}
                    </Button>
                    <div className="flex gap-2">
                      {q.linkedGoalId || q.linkedModule ? (
                        <button
                          onClick={() => actionCompleteQuest(q.id)}
                          className="flex-1 text-[11px] uppercase tracking-wide text-muted hover:text-accent border border-border/60 hover:border-accent/40 rounded-md py-1.5 transition flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-3 h-3" strokeWidth={2.5} />
                          Complete
                        </button>
                      ) : null}
                      <button
                        onClick={() => skip(q.id)}
                        className="flex-1 text-[11px] uppercase tracking-wide text-muted hover:text-text border border-border/60 hover:border-border rounded-md py-1.5 transition"
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                )}
                {done && (
                  <div className="text-xs text-accent2 flex items-center gap-1.5 mt-auto">
                    <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> Complete
                  </div>
                )}
                {skipped && <div className="text-xs text-muted mt-auto">Skipped</div>}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Mobile-only scroll hint */}
      {quests.length > 1 && (
        <div className="sm:hidden text-center text-[10px] text-muted/70 mt-1">
          ← swipe to see more quests →
        </div>
      )}

      {allDone && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-center flex items-center justify-center gap-2"
        >
          <Sunrise className="w-4 h-4 text-accent2" strokeWidth={1.8} />
          All three quests complete. Today is gold.
        </motion.div>
      )}
    </div>
  )
}

import { motion } from 'framer-motion'
import { addDays, format, parseISO } from 'date-fns'
import { Check } from 'lucide-react'
import { RITUAL_STEPS } from '@/data/ritual'
import { RITUAL_ICONS } from '@/components/icons'
import { actionRitualToggle } from '@/engine/gameLoop'
import { todayISO } from '@/engine/dates'
import type { RitualMath } from './ritualMath'

/**
 * Six step rows. Each row shows the step icon + copy + a trailing 7-day
 * completion strip (last 7 days incl. today). Up-next sits between done and
 * pending — gets the accent border so the eye lands on it.
 */
export function RitualSteps({ math }: { math: RitualMath }) {
  const done = new Set(math.todayLog?.completedStepIds ?? [])
  const nextIdx = RITUAL_STEPS.findIndex((s) => !done.has(s.id))

  return (
    <div className="rounded-2xl bg-surface border border-border/10 shadow-card p-3 sm:p-4">
      <div className="text-[10px] uppercase tracking-[0.28em] text-muted mb-3 px-1">Today</div>
      <ul className="space-y-1.5">
        {RITUAL_STEPS.map((s, i) => {
          const isDone = done.has(s.id)
          const isUpNext = !isDone && i === nextIdx
          const Icon = RITUAL_ICONS[s.id]
          return (
            <li key={s.id}>
              <motion.button
                whileTap={{ scale: 0.985 }}
                onClick={() => actionRitualToggle(s.id)}
                className={`group w-full text-left rounded-xl border px-3 py-2.5 transition-colors duration-150 flex items-center gap-3 hover:bg-surface2/60 ${
                  isDone
                    ? 'border-border/30 bg-surface2/20 opacity-70'
                    : isUpNext
                      ? 'border-accent bg-accent/5 ring-1 ring-accent/30'
                      : 'border-border/40 bg-surface2/30 hover:border-accent/30'
                }`}
              >
                {/* Numbered step circle — fills success-green when done,
                    outlined accent when up-next, plain border otherwise. */}
                <span
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold tabular-nums border-2 transition-colors ${
                    isDone
                      ? 'bg-success border-success text-white'
                      : isUpNext
                        ? 'border-accent text-accent bg-accent/10'
                        : 'border-border/60 text-muted bg-transparent'
                  }`}
                  aria-hidden="true"
                >
                  {isDone ? <Check className="w-4 h-4" strokeWidth={2.6} /> : i + 1}
                </span>

                {/* Step icon — kept as the secondary visual hook. */}
                <span
                  className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                    isDone
                      ? 'bg-accent/10 text-accent/70'
                      : isUpNext
                        ? 'bg-accent/15 text-accent'
                        : 'bg-surface text-accent2'
                  }`}
                >
                  {Icon && <Icon className="w-5 h-5" strokeWidth={1.7} />}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        isDone ? 'line-through text-muted' : 'text-text'
                      }`}
                    >
                      {s.label}
                    </span>
                    {isUpNext && (
                      <span className="text-[9px] uppercase tracking-wider bg-accent text-white px-1.5 py-0.5 rounded-full font-bold">
                        next
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted leading-snug line-clamp-1">
                    {s.description}
                  </div>
                </div>
                <SevenDayStrip stepId={s.id} math={math} />
                <div
                  className={`shrink-0 text-[11px] tabular-nums font-bold text-reward ${
                    isDone ? 'opacity-50' : ''
                  }`}
                >
                  +{s.xpReward} XP
                </div>
              </motion.button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Last 7 days (incl. today) — small dot per day, filled if step done. */
function SevenDayStrip({ stepId, math }: { stepId: string; math: RitualMath }) {
  const today = parseISO(todayISO())
  return (
    <div className="hidden sm:flex shrink-0 items-end gap-0.5">
      {Array.from({ length: 7 }).map((_, i) => {
        const d = format(addDays(today, -(6 - i)), 'yyyy-MM-dd')
        const log = math.logsByDate.get(d)
        const did = !!log?.completedStepIds.includes(stepId)
        const isToday = i === 6
        return (
          <span
            key={i}
            title={`${d}${did ? ' · done' : ''}`}
            className={`w-1.5 h-4 rounded-sm ${
              did
                ? 'bg-accent'
                : isToday
                  ? 'bg-surface2 border border-accent/40'
                  : 'bg-surface2'
            }`}
          />
        )
      })}
    </div>
  )
}

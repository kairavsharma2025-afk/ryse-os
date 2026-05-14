import { motion } from 'framer-motion'
import { Flame, Sparkles, ArrowRight } from 'lucide-react'
import { RITUAL_STEPS, RITUAL_PERFECT_BONUS } from '@/data/ritual'
import { actionRitualToggle } from '@/engine/gameLoop'
import { RITUAL_ICONS } from '@/components/icons'
import type { RitualMath } from './ritualMath'
import { PERFECT } from './ritualMath'

/**
 * Today's ritual front and center. Circular progress ring (X/6), the current
 * "do this now" step with a one-tap CTA, and a status line that switches to
 * a celebratory state once all 6 land.
 */
export function RitualHero({ math }: { math: RitualMath }) {
  const doneCount = math.todayDoneCount
  const done = new Set(math.todayLog?.completedStepIds ?? [])
  const nextIdx = RITUAL_STEPS.findIndex((s) => !done.has(s.id))
  const allDone = nextIdx === -1
  const next = nextIdx === -1 ? null : RITUAL_STEPS[nextIdx]
  const NextIcon = next ? RITUAL_ICONS[next.id] : null

  return (
    <div className="rounded-2xl bg-surface border border-border/10 shadow-card p-5 sm:p-6 relative overflow-hidden">
      {allDone && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.2, 0.45, 0.2] }}
          transition={{ duration: 3.2, repeat: Infinity }}
          className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-accent/30 blur-3xl pointer-events-none"
        />
      )}

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
        <ProgressRing count={doneCount} total={PERFECT} highlight={allDone} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-muted">
            <span>Daily Ritual</span>
            {math.currentPerfectStreak > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-400 normal-case tracking-normal">
                <Flame className="w-3 h-3" strokeWidth={2.2} />
                {math.currentPerfectStreak}-day perfect streak
              </span>
            )}
          </div>

          {allDone ? (
            <>
              <h2 className="font-display text-2xl sm:text-3xl tracking-wide mt-1 text-text">
                Perfect day.
              </h2>
              <p className="text-sm text-muted mt-1">
                All six done. +{RITUAL_PERFECT_BONUS} bonus XP banked.
                {math.xpEarnedToday > 0 && (
                  <span className="text-accent2"> +{math.xpEarnedToday} XP from steps.</span>
                )}
              </p>
            </>
          ) : (
            <>
              <h2 className="font-display text-2xl sm:text-3xl tracking-wide mt-1 text-text">
                {doneCount === 0 ? 'Begin the day.' : `${PERFECT - doneCount} to go.`}
              </h2>
              {next && (
                <p className="text-sm text-muted mt-1">
                  Up next: <span className="text-text">{next.label}</span> · {next.description}
                </p>
              )}
            </>
          )}

          <div className="mt-4 flex items-center gap-3 flex-wrap">
            {next ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.1 }}
                onClick={() => actionRitualToggle(next.id)}
                className="h-10 px-4 rounded-xl bg-accent text-white font-semibold inline-flex items-center gap-2 hover:bg-accent2 transition-colors duration-80 shadow-card"
              >
                {NextIcon && <NextIcon className="w-4 h-4" strokeWidth={2} />}
                Do this now (+{next.xpReward} XP)
                <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
              </motion.button>
            ) : (
              <div className="h-10 px-4 rounded-xl bg-success/15 text-success inline-flex items-center gap-2 text-sm font-semibold border border-success/30">
                <Sparkles className="w-4 h-4" strokeWidth={2} />
                Ritual complete
              </div>
            )}
            <div className="text-[11px] text-muted">
              Hit all six for +{RITUAL_PERFECT_BONUS} bonus.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Stroked circular progress ring with the count inside. */
function ProgressRing({
  count,
  total,
  highlight,
}: {
  count: number
  total: number
  highlight: boolean
}) {
  const size = 116
  const stroke = 8
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = total === 0 ? 0 : Math.min(1, count / total)
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgb(var(--border) / 0.35)"
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={highlight ? 'rgb(var(--success))' : 'rgb(var(--accent))'}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ type: 'spring', damping: 22, stiffness: 110 }}
          style={{
            filter: highlight
              ? 'drop-shadow(0 0 12px rgb(var(--success) / 0.55))'
              : pct > 0
                ? 'drop-shadow(0 0 8px rgb(var(--accent) / 0.4))'
                : undefined,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-3xl tabular-nums leading-none">
          {count}
          <span className="text-base text-muted">/{total}</span>
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted mt-1">
          {Math.round(pct * 100)}%
        </div>
      </div>
    </div>
  )
}

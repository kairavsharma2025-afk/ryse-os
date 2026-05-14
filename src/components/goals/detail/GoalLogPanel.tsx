import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader2, Skull } from 'lucide-react'
import { actionLogGoal } from '@/engine/gameLoop'
import { todayISO } from '@/engine/dates'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { Goal } from '@/types'

interface FlashState {
  xp: number
  bossDmg?: number
}

/**
 * Big log card. Two visual modes from one component:
 *   • Standard goal — quiet card, streak count + optional note input + log
 *     button. Locks out when already logged today.
 *   • Boss battle  — dark gradient, pulsing red glow, HP bar with kill-pct
 *     readout, "Attack" CTA that shows damage dealt + XP gained on press.
 *
 * Both call into actionLogGoal which routes through gameLoop (XP, streak,
 * achievements, boss damage, celebrations).
 */
export function GoalLogPanel({ goal }: { goal: Goal }) {
  const [note, setNote] = useState('')
  const [logging, setLogging] = useState(false)
  const [flash, setFlash] = useState<FlashState | null>(null)

  const today = todayISO()
  const loggedToday = goal.lastLoggedAt?.slice(0, 10) === today
  const isBoss = goal.isBossBattle && !!goal.bossBattleConfig && !goal.bossBattleConfig.defeated

  const handleLog = () => {
    if (loggedToday || logging) return
    setLogging(true)
    const r = actionLogGoal(goal.id, { note: note.trim() || undefined })
    setFlash({ xp: r.xp, bossDmg: r.bossDamageDealt })
    setNote('')
    setTimeout(() => setFlash(null), 1500)
    setTimeout(() => setLogging(false), 500)
  }

  if (isBoss && goal.bossBattleConfig) {
    return <BossAttack goal={goal} flash={flash} logging={logging} loggedToday={loggedToday} onAttack={handleLog} />
  }

  return (
    <StandardLog
      goal={goal}
      note={note}
      setNote={setNote}
      logging={logging}
      loggedToday={loggedToday}
      flash={flash}
      onLog={handleLog}
    />
  )
}

function StandardLog({
  goal,
  note,
  setNote,
  logging,
  loggedToday,
  flash,
  onLog,
}: {
  goal: Goal
  note: string
  setNote: (s: string) => void
  logging: boolean
  loggedToday: boolean
  flash: FlashState | null
  onLog: () => void
}) {
  return (
    <div className="rounded-2xl bg-surface border border-border/10 shadow-card p-5 relative overflow-hidden">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-[0.28em] text-muted">Today</div>
          <div className="font-display text-2xl tracking-wide mt-0.5">
            {loggedToday ? 'Logged.' : 'Log progress'}
          </div>
          <div className="text-xs text-muted mt-1">
            {loggedToday
              ? "Streak preserved. XP capped at one log a day — but come back tomorrow."
              : goal.currentStreak === 0
                ? 'Start the streak. One log = +XP and the chain begins.'
                : `Don't break the ${goal.currentStreak}-day chain. One log keeps it.`}
          </div>
        </div>
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.1 }}
            onClick={onLog}
            disabled={loggedToday || logging}
            className={`h-11 px-5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition-colors duration-80 ${
              loggedToday
                ? 'bg-surface2/60 text-muted border border-border/40'
                : 'bg-accent text-white hover:bg-accent2 shadow-card'
            } disabled:opacity-70`}
          >
            {logging ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : loggedToday ? (
              <>
                <Check className="w-4 h-4" strokeWidth={2.5} />
                Logged today
              </>
            ) : (
              'Log progress'
            )}
          </motion.button>
          <AnimatePresence>
            {flash && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: -24 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55 }}
                className="absolute right-0 top-0 font-display text-lg text-accent2 pointer-events-none whitespace-nowrap"
              >
                +{flash.xp} XP
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {!loggedToday && (
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onLog()
          }}
          placeholder="Note (optional) — what changed?"
          className="mt-4 w-full bg-surface2 border border-border/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors"
        />
      )}
    </div>
  )
}

function BossAttack({
  goal,
  flash,
  logging,
  loggedToday,
  onAttack,
}: {
  goal: Goal
  flash: FlashState | null
  logging: boolean
  loggedToday: boolean
  onAttack: () => void
}) {
  const cfg = goal.bossBattleConfig!
  const pct = cfg.bossHp === 0 ? 0 : cfg.currentHp / cfg.bossHp
  const killProgress = Math.round((1 - pct) * 100)
  const daysLeft = Math.ceil(cfg.currentHp / Math.max(1, cfg.damagePerLog))

  return (
    <div className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/30 via-surface to-surface relative overflow-hidden p-5 sm:p-6">
      <motion.div
        aria-hidden
        animate={{ opacity: [0.25, 0.55, 0.25] }}
        transition={{ duration: 2.4, repeat: Infinity }}
        className="absolute -top-16 -right-16 w-64 h-64 bg-red-600/30 rounded-full blur-3xl pointer-events-none"
      />
      <div className="relative">
        <div className="text-[10px] uppercase tracking-[0.3em] text-red-400/70 mb-1 flex items-center gap-2">
          <Skull className="w-3 h-3" /> Boss battle
        </div>
        <div className="font-display text-3xl sm:text-4xl tracking-wide">{cfg.bossName}</div>
        <p className="text-muted text-sm mt-1.5 leading-relaxed max-w-xl">
          {cfg.bossDescription}
        </p>

        <div className="mt-5">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-red-400 uppercase tracking-wider">Boss HP</span>
            <span className="font-mono tabular-nums">
              {cfg.currentHp} / {cfg.bossHp}
              <span className="text-muted"> · {killProgress}% dealt</span>
            </span>
          </div>
          <ProgressBar
            value={cfg.currentHp}
            max={cfg.bossHp}
            colorVar="relationships"
            height={12}
            glow
          />
        </div>

        <div className="mt-5 flex items-center gap-3 flex-wrap">
          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={loggedToday || logging}
            onClick={onAttack}
            animate={logging ? { x: [-3, 3, -2, 2, 0] } : {}}
            className="h-11 px-5 rounded-xl bg-red-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-glow inline-flex items-center gap-2"
          >
            <Skull className="w-4 h-4" strokeWidth={2} />
            {loggedToday ? 'Already struck today' : `Attack · ${cfg.damagePerLog} dmg`}
          </motion.button>
          <AnimatePresence>
            {flash && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: -8 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="text-red-300 font-display text-lg pointer-events-none whitespace-nowrap"
              >
                -{flash.bossDmg ?? cfg.damagePerLog} HP · +{flash.xp} XP
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-4 text-[11px] text-muted leading-relaxed max-w-xl">
          ~{daysLeft} day{daysLeft === 1 ? '' : 's'} to victory at this damage.{' '}
          {cfg.bossCounterattack && (
            <>
              <span className="text-red-300/80">Miss a day:</span> {cfg.bossCounterattack}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

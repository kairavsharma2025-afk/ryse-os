import { useSeason, currentSeason } from '@/stores/seasonStore'
import { daysLeftInSeason, seasonProgress, SEASON_LENGTH_DAYS } from '@/engine/seasonEngine'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export function SeasonStrip() {
  const state = useSeason()
  const season = currentSeason()
  const left = daysLeftInSeason(state)
  const elapsed = SEASON_LENGTH_DAYS - left
  const prog = seasonProgress(state)
  const hpPct =
    season.bossInitialHp === 0 ? 0 : Math.max(0, Math.min(1, state.bossHp / season.bossInitialHp))

  return (
    <Link
      to="/season"
      className="block rounded-2xl border border-border bg-surface p-4 hover:border-accent/40 transition"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="font-display text-lg tracking-wide">{season.name}</div>
        <div className="text-[10px] uppercase tracking-wide text-muted">
          {left} days left
        </div>
      </div>
      <div className="text-xs text-muted mb-3">
        Boss: <span className="text-text">{season.bossName}</span> · Focus on{' '}
        {season.focusAreas.join(' & ')} (2× XP)
      </div>

      {/* Season progress (days elapsed) */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] uppercase tracking-wide text-muted mb-1 font-mono">
          <span>Season Progress</span>
          <span>
            {elapsed} / {SEASON_LENGTH_DAYS} days
          </span>
        </div>
        <div
          className="w-full h-1.5 rounded-full overflow-hidden border border-border/40"
          style={{ background: 'rgb(var(--bg) / 0.6)' }}
        >
          <motion.div
            className="h-full"
            initial={{ width: 0 }}
            animate={{ width: `${prog * 100}%` }}
            transition={{ type: 'spring', damping: 22, stiffness: 110 }}
            style={{
              background:
                'linear-gradient(90deg, rgb(var(--learning)) 0%, rgb(var(--career)) 100%)',
              boxShadow: '0 0 10px rgb(var(--learning) / 0.5)',
            }}
          />
        </div>
      </div>

      {/* Boss HP bar */}
      <div>
        <div className="flex justify-between text-[10px] uppercase tracking-wide mb-1 font-mono">
          <span className="text-red-300/80">Boss HP</span>
          <span className="text-muted">
            {state.bossHp} / {season.bossInitialHp}
          </span>
        </div>
        <div
          className="w-full h-2 rounded-full overflow-hidden border border-red-900/40"
          style={{ background: 'rgb(40 12 12 / 0.85)' }}
        >
          <motion.div
            className="h-full"
            initial={{ width: '100%' }}
            animate={{ width: `${hpPct * 100}%` }}
            transition={{ type: 'tween', duration: 0.6, ease: 'easeOut' }}
            style={{
              background:
                'linear-gradient(90deg, rgb(220 38 38) 0%, rgb(248 113 113) 100%)',
              boxShadow: '0 0 12px rgb(220 38 38 / 0.55)',
            }}
          />
        </div>
      </div>
    </Link>
  )
}

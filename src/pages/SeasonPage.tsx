import { motion } from 'framer-motion'
import { Skull, Crown, AlertTriangle, Sparkles, Target, Trophy } from 'lucide-react'
import { useSeason, currentSeason } from '@/stores/seasonStore'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { daysLeftInSeason, seasonProgress } from '@/engine/seasonEngine'
import { SEASONS } from '@/data/seasons'

/**
 * Season detail page. Boss panel up top with a pulsing aura, season progress
 * + accumulators in the middle, reward + season ladder underneath.
 */
export function SeasonPage() {
  const state = useSeason()
  const season = currentSeason()
  const left = daysLeftInSeason(state)
  const prog = seasonProgress(state)
  const hpPct = Math.max(
    0,
    Math.min(1, state.bossHp / Math.max(1, season.bossInitialHp))
  )

  return (
    <div className="space-y-6">
      <header>
        <div className="text-[10px] uppercase tracking-[0.4em] text-muted mb-1">
          current chapter
        </div>
        <h1 className="font-display text-4xl tracking-wide">{season.name}</h1>
        <p className="text-sm text-muted mt-1">
          Theme: <span className="text-text">{season.theme}</span> ·{' '}
          <span className="text-text tabular-nums">{left}</span> days remaining
        </p>
      </header>

      {/* Boss hero */}
      <div className="rounded-2xl bg-surface border border-border/10 shadow-card relative overflow-hidden p-6">
        <motion.div
          aria-hidden
          animate={{ opacity: [0.25, 0.6, 0.25] }}
          transition={{ duration: 2.6, repeat: Infinity }}
          className="absolute -top-12 -right-12 w-56 h-56 bg-accent/30 rounded-full blur-3xl pointer-events-none"
        />
        <div className="relative">
          <div className="text-[10px] uppercase tracking-[0.3em] text-red-400/80 mb-1 inline-flex items-center gap-2">
            <Skull className="w-3 h-3" /> Seasonal boss
          </div>
          <div className="font-display text-3xl sm:text-4xl tracking-wide">
            {season.bossName}
          </div>
          <p className="text-sm text-muted mt-2 leading-relaxed max-w-xl">
            {season.bossDescription}
          </p>
          <div className="mt-5">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-red-400 uppercase tracking-wider">Boss HP</span>
              <span className="font-mono tabular-nums">
                {state.bossHp} / {season.bossInitialHp}
                <span className="text-muted">
                  {' '}· {Math.round((1 - hpPct) * 100)}% dealt
                </span>
              </span>
            </div>
            <ProgressBar
              value={state.bossHp}
              max={season.bossInitialHp}
              colorVar="relationships"
              height={12}
              glow
            />
          </div>
          <div className="mt-3 text-xs text-muted">
            Every quest, goal, and boss-battle win chips at the seasonal HP.
          </div>
        </div>
      </div>

      {/* Season progress */}
      <div className="rounded-2xl bg-surface border border-border/10 shadow-card p-5">
        <h2 className="font-display text-xl tracking-wide mb-3">Season progress</h2>
        <ProgressBar value={prog * 100} colorVar="accent" />
        <div className="grid grid-cols-3 gap-3 mt-4">
          <Stat icon={Target} label="Quests" value={state.questsCompleted} />
          <Stat icon={Trophy} label="Goals" value={state.goalsCompleted} />
          <Stat icon={Skull} label="Bosses" value={state.bossBattlesWon} />
        </div>
        <div className="text-xs text-muted mt-4 inline-flex items-center gap-1.5 flex-wrap">
          <span>Focus areas this season:</span>
          {season.focusAreas.map((f) => (
            <span
              key={f}
              className="text-text inline-flex items-center gap-1 rounded-full bg-surface2/60 border border-border/30 px-2 py-0.5 text-[11px]"
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: `rgb(var(--${f}))` }} />
              {f}
            </span>
          ))}
          <span className="text-muted/70">(2× XP)</span>
        </div>
      </div>

      {/* Reward */}
      <div className="rounded-2xl bg-surface border border-border/10 shadow-card p-5">
        <h2 className="font-display text-xl tracking-wide mb-3">Reward</h2>
        <div className="flex items-center gap-4">
          <div className="text-5xl">{season.reward.badgeEmoji}</div>
          <div className="min-w-0">
            <div className="font-display text-xl">{season.reward.title}</div>
            <div className="text-xs text-muted leading-relaxed">
              {season.reward.themeId
                ? `Plus theme: ${season.reward.themeId}`
                : 'Title earned at season end if the boss is felled.'}
            </div>
          </div>
        </div>
      </div>

      {/* All seasons */}
      <div className="rounded-2xl bg-surface border border-border/10 shadow-card p-5">
        <h2 className="font-display text-xl tracking-wide mb-3">All seasons</h2>
        <ul className="space-y-2">
          {SEASONS.map((s) => {
            const past = state.pastSeasons.find((p) => p.seasonId === s.id)
            const isCurrent = s.id === state.currentSeasonId
            return (
              <li
                key={s.id}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-colors ${
                  isCurrent
                    ? 'border-accent/50 bg-accent/10'
                    : 'border-border/30 bg-surface2/30'
                }`}
              >
                <div>
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="text-[11px] text-muted">{s.theme}</div>
                </div>
                <div className="text-xs shrink-0">
                  {past ? (
                    past.rewardClaimed ? (
                      <span className="text-legendary inline-flex items-center gap-1">
                        won <Crown className="w-3 h-3" strokeWidth={1.8} />
                      </span>
                    ) : (
                      <span className="text-muted">survived</span>
                    )
                  ) : isCurrent ? (
                    <span className="text-accent inline-flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> in progress
                    </span>
                  ) : (
                    <span className="text-muted">upcoming</span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Weekly Villain */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-950/10 shadow-card p-5">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" strokeWidth={1.8} />
          <h2 className="font-display text-xl tracking-wide text-amber-300">Weekly Villain</h2>
        </div>
        <p className="text-sm text-muted leading-relaxed">
          Each Sunday, the worst-performing area becomes{' '}
          <span className="text-text">your weekly villain</span>. Defeat it by logging at least once
          in that area during the next week.
        </p>
      </div>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target
  label: string
  value: number
}) {
  return (
    <div className="rounded-xl border border-border/30 bg-surface2/30 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted">
        <Icon className="w-3 h-3" strokeWidth={1.8} />
        <span>{label}</span>
      </div>
      <div className="font-display text-2xl mt-0.5 tabular-nums leading-none text-text">
        {value}
      </div>
    </div>
  )
}

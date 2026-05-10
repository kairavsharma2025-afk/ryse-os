import { useSeason, currentSeason } from '@/stores/seasonStore'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { daysLeftInSeason, seasonProgress } from '@/engine/seasonEngine'
import { SEASONS } from '@/data/seasons'
import { motion } from 'framer-motion'
import { Crown } from '@/components/icons'

export function SeasonPage() {
  const state = useSeason()
  const season = currentSeason()
  const left = daysLeftInSeason(state)
  const prog = seasonProgress(state)

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] uppercase tracking-[0.4em] text-muted mb-1">
          ─── current chapter ───
        </div>
        <h1 className="font-display text-4xl tracking-wide">{season.name}</h1>
        <div className="text-muted text-sm mt-1">
          Theme: {season.theme} · {left} days remaining
        </div>
      </div>

      <Card className="p-6 relative overflow-hidden">
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="absolute -top-12 -right-12 w-48 h-48 bg-accent/30 rounded-full blur-3xl"
        />
        <div className="relative">
          <div className="text-[10px] uppercase tracking-wide text-muted mb-1">
            Seasonal boss
          </div>
          <div className="font-display text-3xl tracking-wide">{season.bossName}</div>
          <div className="text-sm text-muted mt-2 max-w-xl leading-relaxed">
            {season.bossDescription}
          </div>
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span>Boss HP (community simulation)</span>
              <span className="font-mono">
                {state.bossHp} / {season.bossInitialHp}
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
            Every quest, goal, and boss-battle win you complete chips at the seasonal HP.
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-lg mb-3">Season progress</h3>
        <ProgressBar value={prog * 100} colorVar="accent" />
        <div className="grid grid-cols-3 gap-3 mt-4">
          <Stat label="Quests" value={state.questsCompleted} />
          <Stat label="Goals" value={state.goalsCompleted} />
          <Stat label="Bosses" value={state.bossBattlesWon} />
        </div>
        <div className="text-xs text-muted mt-4">
          Focus areas this season:{' '}
          {season.focusAreas.map((f) => (
            <span key={f} className="text-text mr-2">
              {f}
            </span>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-lg mb-3">Reward</h3>
        <div className="flex items-center gap-3">
          <div className="text-4xl">{season.reward.badgeEmoji}</div>
          <div>
            <div className="font-display text-xl">{season.reward.title}</div>
            <div className="text-xs text-muted">
              {season.reward.themeId
                ? `Plus theme: ${season.reward.themeId}`
                : 'Title earned at season end if boss is felled.'}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-lg mb-3">All seasons</h3>
        <div className="space-y-2">
          {SEASONS.map((s) => {
            const past = state.pastSeasons.find((p) => p.seasonId === s.id)
            const isCurrent = s.id === state.currentSeasonId
            return (
              <div
                key={s.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  isCurrent
                    ? 'border-accent bg-accent/10'
                    : 'border-border bg-surface2/40'
                }`}
              >
                <div>
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="text-[11px] text-muted">{s.theme}</div>
                </div>
                <div className="text-xs">
                  {past
                    ? past.rewardClaimed
                      ? (
                        <span className="text-legendary inline-flex items-center gap-1">
                          won <Crown className="w-3 h-3" strokeWidth={1.8} />
                        </span>
                      )
                      : <span className="text-muted">survived</span>
                    : isCurrent
                      ? <span className="text-accent">in progress</span>
                      : <span className="text-muted">upcoming</span>}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card className="p-5 border-amber-500/40 bg-amber-950/10">
        <h3 className="font-display text-lg mb-2">Weekly Villain</h3>
        <p className="text-sm text-muted leading-relaxed">
          Each Sunday, the worst-performing area becomes <span className="text-text">your weekly villain</span>.
          Defeat it by logging at least once in that area during the next week.
        </p>
      </Card>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface2/40 p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className="font-display text-2xl">{value}</div>
    </div>
  )
}

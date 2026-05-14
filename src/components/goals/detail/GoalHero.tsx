import { Flame, Skull, Trophy, Star, Activity } from 'lucide-react'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { Pill } from '@/components/ui/Pill'
import { AREAS } from '@/data/areas'
import { AREA_ICONS, STREAK_ICONS } from '@/components/icons'
import { streakVisualState } from '@/engine/streakEngine'
import { isAtRisk, isNearVictory } from '@/components/goals/GoalsBanner'
import type { Goal } from '@/types'

/**
 * Hero header for the redesigned Goal detail page.
 *
 *   ┌──────────────────────────────────────────────┐
 *   │ ▍ [area] [P1?] [boss?] [near?] [done?]       │
 *   │ ▍ Goal title (display, 4xl)                  │
 *   │ ▍ description…                               │
 *   │ ▍ ─────────────────────────────              │
 *   │ ▍ [Current][Longest][Logs][Days active]      │
 *   └──────────────────────────────────────────────┘
 *
 *   ▍ = the area-coloured rail down the left edge.
 */
export function GoalHero({ goal }: { goal: Goal }) {
  const area = AREAS[goal.area]
  const AreaIcon = AREA_ICONS[area.id]
  const state = streakVisualState(goal.currentStreak)
  const StreakIcon = STREAK_ICONS[state]

  const daysActive = Math.max(
    1,
    differenceInCalendarDays(new Date(), parseISO(goal.createdAt)) + 1
  )
  const totalLogs = goal.logs.length
  const totalXp = goal.logs.reduce((s, l) => s + l.xpAwarded, 0)
  const nearVictory = isNearVictory(goal)
  const atRisk = isAtRisk(goal)
  const livingBoss = goal.isBossBattle && goal.bossBattleConfig && !goal.bossBattleConfig.defeated

  return (
    <div className="rounded-2xl bg-surface border border-border/10 shadow-card overflow-hidden relative">
      {/* Atmospheric area-tinted glow. */}
      <div
        aria-hidden
        className="absolute -top-12 -right-12 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: `rgb(var(--${area.color}))` }}
      />
      {/* Left rail. */}
      <div
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-1.5"
        style={{
          background: `linear-gradient(180deg, rgb(var(--${area.color})), rgb(var(--accent2)))`,
        }}
      />

      <div className="relative p-5 sm:p-6 pl-6 sm:pl-7">
        {/* Status row */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Pill color={area.color}>
              <span className="inline-flex items-center gap-1">
                <AreaIcon className="w-3 h-3" strokeWidth={1.8} />
                {area.name}
              </span>
            </Pill>
            {goal.priority === 1 && <Pill color="accent">P1</Pill>}
            <Pill color="muted">{goal.questType}</Pill>
            <Pill color="accent">
              <span className="inline-flex items-center gap-1">
                <Star className="w-3 h-3" strokeWidth={1.8} fill="currentColor" />
                {goal.difficultyRating}
              </span>
            </Pill>
            {livingBoss && (
              <Pill color="rare">
                <span className="inline-flex items-center gap-1">
                  <Skull className="w-3 h-3" strokeWidth={1.8} />
                  boss
                </span>
              </Pill>
            )}
            {nearVictory && !goal.completedAt && <Pill color="health">near</Pill>}
            {atRisk && <Pill color="finance">at risk</Pill>}
            {goal.completedAt && <Pill color="health">complete</Pill>}
            {goal.archivedAt && <Pill color="muted">archived</Pill>}
          </div>

          <div
            className={`flex items-center gap-1.5 shrink-0 ${streakTone(state)}`}
            title={`${goal.currentStreak}-day streak`}
          >
            {StreakIcon ? (
              <StreakIcon className="w-5 h-5" strokeWidth={2} />
            ) : (
              <Flame className="w-5 h-5 opacity-40" />
            )}
            <span className="tabular-nums font-display text-xl">{goal.currentStreak}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted">streak</span>
          </div>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl tracking-wide leading-tight">
          {goal.title}
        </h1>
        {goal.description && (
          <p className="text-sm text-muted mt-2 max-w-2xl leading-relaxed">{goal.description}</p>
        )}

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <Tile
            icon={Flame}
            label="Current"
            value={goal.currentStreak}
            suffix="d"
            tone={state === 'legendary' ? 'legendary' : state === 'inferno' || state === 'burning' ? 'amber' : undefined}
          />
          <Tile icon={Trophy} label="Longest" value={goal.longestStreak} suffix="d" />
          <Tile icon={Activity} label="Total logs" value={totalLogs} sub={`+${totalXp} XP`} />
          <Tile icon={Star} label="Days active" value={daysActive} sub="since start" />
        </div>
      </div>
    </div>
  )
}

function streakTone(state: ReturnType<typeof streakVisualState>): string {
  if (state === 'legendary') return 'text-legendary'
  if (state === 'inferno' || state === 'burning') return 'text-amber-400'
  if (state === 'building') return 'text-text/90'
  return 'text-muted'
}

function Tile({
  icon: Icon,
  label,
  value,
  suffix,
  sub,
  tone,
}: {
  icon: typeof Flame
  label: string
  value: number
  suffix?: string
  sub?: string
  tone?: 'amber' | 'legendary'
}) {
  const valueColor =
    tone === 'amber'
      ? 'text-amber-400'
      : tone === 'legendary'
        ? 'text-legendary'
        : 'text-text'
  return (
    <div className="rounded-xl bg-surface2/40 border border-border/30 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted">
        <Icon className="w-3 h-3" strokeWidth={1.8} />
        <span>{label}</span>
      </div>
      <div className={`font-display text-xl mt-0.5 tabular-nums leading-none ${valueColor}`}>
        {value}
        {suffix && <span className="text-sm text-muted ml-0.5 font-sans">{suffix}</span>}
      </div>
      {sub && <div className="text-[10px] text-muted/80 mt-1">{sub}</div>}
    </div>
  )
}

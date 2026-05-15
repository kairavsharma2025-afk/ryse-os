import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCharacter } from '@/stores/characterStore'
import { useGoals } from '@/stores/goalsStore'
import { useSchedule } from '@/stores/scheduleStore'
import { currentSeason } from '@/stores/seasonStore'
import { Empty } from '@/components/ui/Empty'
import { Button } from '@/components/ui/Button'
import { Sparkles, Swords } from 'lucide-react'

import { SmartBanner } from '@/components/home/SmartBanner'
import { DailyBrief } from '@/components/home/DailyBrief'
import { TodayTaskList } from '@/components/home/TodayTaskList'
import { TimelineStrip } from '@/components/home/TimelineStrip'
import { AtAGlanceMetrics } from '@/components/home/AtAGlanceMetrics'
import { RitualTimeline } from '@/components/home/RitualTimeline'
import { DailyQuests } from '@/components/quests/DailyQuests'
import { StreakDashboard } from '@/components/streaks/StreakDashboard'
import { AiSuggestionChip } from '@/components/assistant/AiSuggestionChip'
import { todayLongLabel, todayISO } from '@/engine/dates'

/**
 * The 8-section home page from the 2026 redesign:
 *   1. Smart Banner (priority-queued, ONE at a time)
 *   2. Daily Brief (Day / Energy / Wins + #1 priority callout)
 *   3. Task Card Scroller (centerpiece — sits directly under the brief)
 *   4. Timeline strip (auto-promoted if ≥3 events today)
 *   5. At-a-glance metrics (focus / boss / streak)
 *   6. Ritual quick-tap
 *   7. Daily Quests (kept — already a horizontal swipeable strip)
 *   8. Streaks + Boss merge (StreakDashboard)
 *
 * Old widgets (FiniteMini, WeeklyRings, ActiveBoss inline, etc.) moved to the
 * Life tab. ActiveBoss content is now condensed inside StreakDashboard's lane
 * and AtAGlanceMetrics's HP bar.
 */
export function Home() {
  const initialised = useCharacter((s) => s.initialised)
  const name = useCharacter((s) => s.name)
  const goalCount = useGoals((s) => s.goals.length)
  const events = useSchedule((s) => s.events)
  const today = todayISO()
  const nav = useNavigate()

  const timelinePromoted = useMemo(
    () => events.filter((e) => e.date === today).length >= 3,
    [events, today]
  )

  if (!initialised) return null

  // Empty-state for brand-new users: drop the Daily Brief / scroller (they'd
  // both be empty), keep the hero greeting + a single CTA.
  if (goalCount === 0) {
    return (
      <div className="space-y-8">
        <Greeting name={name} />
        <Empty
          icon={Swords}
          title="Your first quest awaits."
          body="Add a goal to begin. Make it slightly scary."
          cta={<Button onClick={() => nav('/goals')}>Add a goal</Button>}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Greeting name={name} />

      {/* SmartBanner is desktop-only: high-context priority alerts are noisy on
          mobile where space is scarce. */}
      <div className="hidden md:block">
        <SmartBanner />
      </div>

      {/* Priority hero + compact stats strip (DailyBrief now renders both). */}
      <DailyBrief />

      {/* Proactive AI suggestion — dismissible per day. */}
      <AiSuggestionChip />

      {/* Vertical task list — replaces the horizontal swipe deck. */}
      <TodayTaskList />

      {/* Timeline is always visible on mobile. On desktop it stays auto-promoted. */}
      <div className="md:hidden">
        <TimelineStrip />
      </div>
      <div className="hidden md:block">{timelinePromoted && <TimelineStrip />}</div>

      {/* Everything below is desktop-only — the mobile Home is intentionally
          trimmed to greeting + brief + tasks + timeline. */}
      <div className="hidden md:block space-y-8">
        <AtAGlanceMetrics />
        <RitualTimeline />
        <DailyQuests />
        <StreakDashboard />
      </div>
    </div>
  )
}

function Greeting({ name }: { name: string }) {
  // Time-of-day greeting that doesn't say "good evening" at 3am.
  const h = new Date().getHours()
  const stamp =
    h < 5
      ? 'Late night'
      : h < 12
        ? 'Good morning'
        : h < 17
          ? 'Good afternoon'
          : 'Good evening'
  const nav = useNavigate()
  const season = currentSeason()
  return (
    <div className="flex items-end justify-between gap-3 flex-wrap">
      <div>
        <div className="text-xs font-semibold tracking-widest uppercase text-muted mb-1">
          {todayLongLabel()}
        </div>
        <h1 className="font-display text-xl text-text">
          {stamp}, {name || 'Hero'}.
        </h1>
      </div>
      <button
        type="button"
        onClick={() => nav('/life')}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-reward/15 border border-reward/30 text-reward text-[11px] font-semibold uppercase tracking-wider hover:bg-reward/25 transition-colors duration-80"
        title={season.name}
      >
        <Sparkles className="w-3 h-3" strokeWidth={2.2} />
        Season {toRoman(season.number)}
      </button>
    </div>
  )
}

function toRoman(n: number): string {
  if (n <= 0) return ''
  const map: [number, string][] = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ]
  let out = ''
  let r = n
  for (const [v, s] of map) {
    while (r >= v) {
      out += s
      r -= v
    }
  }
  return out
}

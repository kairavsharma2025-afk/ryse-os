import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCharacter } from '@/stores/characterStore'
import { useGoals } from '@/stores/goalsStore'
import { useSchedule } from '@/stores/scheduleStore'
import { Empty } from '@/components/ui/Empty'
import { Button } from '@/components/ui/Button'
import { Swords } from 'lucide-react'

import { SmartBanner } from '@/components/home/SmartBanner'
import { DailyBrief } from '@/components/home/DailyBrief'
import { TaskCardScroller } from '@/components/home/TaskCardScroller'
import { TimelineStrip } from '@/components/home/TimelineStrip'
import { AtAGlanceMetrics } from '@/components/home/AtAGlanceMetrics'
import { RitualTimeline } from '@/components/home/RitualTimeline'
import { DailyQuests } from '@/components/quests/DailyQuests'
import { StreakDashboard } from '@/components/streaks/StreakDashboard'
import { todayLongLabel, todayISO } from '@/engine/dates'

/**
 * The 8-section home page from the 2026 redesign:
 *   1. Smart Banner (priority-queued, ONE at a time)
 *   2. Daily Brief (Day / Energy / Wins + #1 priority callout)
 *   3. Task Card Scroller (centerpiece)
 *   4. At-a-glance metrics (focus / boss / streak)
 *   5. Timeline strip (auto-promoted if ≥3 events today)
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
    <div className="space-y-8">
      <Greeting name={name} />
      <SmartBanner />
      <DailyBrief />
      {timelinePromoted && <TimelineStrip />}
      <TaskCardScroller />
      <AtAGlanceMetrics />
      <RitualTimeline />
      <DailyQuests />
      <StreakDashboard />
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
  return (
    <div>
      <div className="text-xs text-muted uppercase tracking-wider mb-1">
        {todayLongLabel()}
      </div>
      <h1 className="text-xl text-text">
        {stamp}, {name || 'Hero'}.
      </h1>
    </div>
  )
}

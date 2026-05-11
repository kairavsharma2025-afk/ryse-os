import { CharacterHeader } from '@/components/character/CharacterHeader'
import { DailyQuests } from '@/components/quests/DailyQuests'
import { StreakDashboard } from '@/components/streaks/StreakDashboard'
import { TodayStats } from '@/components/home/TodayStats'
import { ActiveBoss } from '@/components/home/ActiveBoss'
import { FiniteMini } from '@/components/home/FiniteMini'
import { RitualTimeline } from '@/components/home/RitualTimeline'
import { WeeklyRings } from '@/components/home/WeeklyRings'
import { SeasonStrip } from '@/components/home/SeasonStrip'
import { AiPlanCard } from '@/components/home/AiPlanCard'
import { TodaySchedule } from '@/components/home/TodaySchedule'
import { UpcomingReminders } from '@/components/home/UpcomingReminders'
import { useCharacter } from '@/stores/characterStore'
import { useGoals } from '@/stores/goalsStore'
import { Empty } from '@/components/ui/Empty'
import { Button } from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { todayLongLabel } from '@/engine/dates'
import { Swords } from 'lucide-react'

export function Home() {
  const initialised = useCharacter((s) => s.initialised)
  const goalCount = useGoals((s) => s.goals.length)
  const nav = useNavigate()

  if (!initialised) {
    return null // routed elsewhere
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="text-[11px] uppercase tracking-[0.32em] text-muted/80 -mb-2 font-mono">
        {todayLongLabel()}
      </div>
      <AiPlanCard />
      <CharacterHeader />
      <SeasonStrip />
      <TodaySchedule />
      <UpcomingReminders />

      {goalCount === 0 ? (
        <Empty
          icon={Swords}
          title="Your first quest awaits."
          body="Add a goal to begin. Make it slightly scary."
          cta={<Button onClick={() => nav('/goals')}>Add a goal</Button>}
        />
      ) : (
        <>
          <DailyQuests />
          <TodayStats />
          <ActiveBoss />
          <StreakDashboard />
          <div className="grid md:grid-cols-2 gap-6">
            <FiniteMini />
            <WeeklyRings />
          </div>
          <RitualTimeline />
        </>
      )}
    </div>
  )
}

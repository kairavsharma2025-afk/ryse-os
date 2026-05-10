import { useGoals } from '@/stores/goalsStore'
import { useQuests } from '@/stores/questsStore'
import { useModules } from '@/stores/modulesStore'
import { todayISO } from '@/engine/dates'
import { RITUAL_STEPS } from '@/data/ritual'

export function TodayStats() {
  const today = todayISO()
  const xpToday = useGoals((s) =>
    s.goals.reduce(
      (sum, g) =>
        sum +
        g.logs
          .filter((l) => l.date.slice(0, 10) === today)
          .reduce((acc, l) => acc + l.xpAwarded, 0),
      0
    )
  )
  const goalsLogged = useGoals((s) =>
    s.goals.filter((g) => g.logs.some((l) => l.date.slice(0, 10) === today)).length
  )
  const ritualToday = useModules((s) =>
    s.ritual.logs.find((l) => l.date === today)
  )
  const ritualPct = `${ritualToday?.completedStepIds.length ?? 0}/${RITUAL_STEPS.length}`
  const questsDone = useQuests((s) => s.countCompletedToday())

  const stats = [
    { label: 'XP today', value: xpToday, color: 'accent' },
    { label: 'Goals logged', value: goalsLogged, color: 'health' },
    { label: 'Ritual', value: ritualPct, color: 'mind' },
    { label: 'Quests', value: `${questsDone}/3`, color: 'learning' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-border bg-surface px-4 py-3"
        >
          <div className="text-[10px] uppercase tracking-wide text-muted mb-1">
            {s.label}
          </div>
          <div
            className="font-display text-2xl"
            style={{ color: `rgb(var(--${s.color}))` }}
          >
            {s.value}
          </div>
        </div>
      ))}
    </div>
  )
}

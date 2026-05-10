// Builds the live "what the assistant knows" string injected into every Claude call.

import { format } from 'date-fns'
import { useCharacter } from '@/stores/characterStore'
import { useGoals } from '@/stores/goalsStore'
import { useSeason, currentSeason } from '@/stores/seasonStore'
import { useModules } from '@/stores/modulesStore'
import { useSchedule } from '@/stores/scheduleStore'
import { useReminders } from '@/stores/remindersStore'
import { RITUAL_STEPS } from '@/data/ritual'
import { AREAS } from '@/data/areas'
import { todayISO } from './dates'
import { daysLeftInSeason } from './seasonEngine'
import { todaysUpcomingReminders } from './remindersEngine'

export function buildAssistantContext(): string {
  const c = useCharacter.getState()
  const goals = useGoals
    .getState()
    .goals.filter((g) => !g.archivedAt && !g.completedAt)
  const seasonState = useSeason.getState()
  const season = currentSeason()
  const today = todayISO()
  const now = new Date()

  const ritualLog = useModules.getState().ritual.logs.find((l) => l.date === today)
  const done = new Set(ritualLog?.completedStepIds ?? [])
  const incompleteRitual = RITUAL_STEPS.filter((s) => !done.has(s.id))

  const events = useSchedule.getState().eventsOn(today)
  const reminders = todaysUpcomingReminders(useReminders.getState().reminders, today, now)

  const L: string[] = []
  L.push('# RYSE — LIVE PLAYER CONTEXT')
  L.push(`Now: ${format(now, "EEEE, MMMM d yyyy, HH:mm")} (local).`)
  L.push(
    `Hero: ${c.name || 'Hero'} — Level ${c.level} (${c.xp} XP), class "${c.classId}", active title "${c.activeTitle}".`
  )
  if (season) {
    L.push(
      `Season "${season.name}" — focus areas: ${season.focusAreas
        .map((a) => AREAS[a].name)
        .join(', ')}. Boss: ${season.bossName} (${seasonState.bossHp} HP remaining). ${daysLeftInSeason(
        seasonState
      )} days left this season.`
    )
  }

  L.push('')
  L.push(`## ACTIVE GOALS (${goals.length})`)
  if (goals.length === 0) L.push('- (none yet — encourage the player to add one)')
  for (const g of goals) {
    L.push(
      `- [${AREAS[g.area].name}] "${g.title}" — ${g.cadence}, difficulty ${g.difficultyRating}/5, priority ${g.priority}, ${g.logs.length} logs, current streak ${g.currentStreak}d${
        g.isBossBattle ? ' — ⚔️ BOSS BATTLE' : ''
      }${g.description ? ` — ${g.description}` : ''}`
    )
  }

  L.push('')
  L.push(`## TODAY'S SCHEDULE (${events.length} time-blocked events)`)
  if (events.length === 0) L.push('- (nothing on the calendar today)')
  for (const e of events) {
    L.push(
      `- ${e.startTime}–${e.endTime} ${e.title} [${AREAS[e.category].name}]${e.notes ? ` — ${e.notes}` : ''}`
    )
  }

  L.push('')
  L.push(`## DAILY RITUAL — INCOMPLETE STEPS (${incompleteRitual.length}/${RITUAL_STEPS.length})`)
  if (incompleteRitual.length === 0) L.push('- (ritual already complete today — celebrate it)')
  for (const s of incompleteRitual) L.push(`- ${s.label}: ${s.description}`)

  L.push('')
  L.push(`## UPCOMING REMINDERS TODAY (${reminders.length})`)
  if (reminders.length === 0) L.push('- (none queued)')
  for (const { reminder, at } of reminders) {
    L.push(
      `- ${format(at, 'HH:mm')} ${reminder.title} [${AREAS[reminder.category].name}]${
        reminder.repeat !== 'once' ? ` (${reminder.repeat})` : ''
      }`
    )
  }

  return L.join('\n')
}

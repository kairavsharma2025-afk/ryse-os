import type { Goal, Quest, QuestSource, ModuleId } from '@/types'
import { todayISO, endOfTodayISO, daysBetween } from './dates'
import { mostNeglectedArea } from './statEngine'

interface GenerateContext {
  goals: Goal[]
  ritualDoneToday: boolean
  oneDegreeAnsweredToday: boolean
  unsentDraftsToday: number
  finiteWeekUnmarkedLastWeek: boolean
  silenceLogsLast7d: number
}

function makeQuest(partial: Partial<Quest> & { title: string; description: string; xpReward: number; source: QuestSource }): Quest {
  return {
    id: crypto.randomUUID(),
    generatedFor: todayISO(),
    expiresAt: endOfTodayISO(),
    ...partial,
  } as Quest
}

function pickMostNeglectedGoal(goals: Goal[]): Goal | null {
  const today = todayISO()
  const neglectArea = mostNeglectedArea(goals)
  let pool = goals.filter((g) => !g.archivedAt && !g.completedAt)
  if (neglectArea) pool = pool.filter((g) => g.area === neglectArea)
  if (pool.length === 0) {
    pool = goals.filter((g) => !g.archivedAt && !g.completedAt)
  }
  if (pool.length === 0) return null
  pool.sort((a, b) => {
    const aLast = a.lastLoggedAt ? daysBetween(a.lastLoggedAt.slice(0, 10), today) : 9999
    const bLast = b.lastLoggedAt ? daysBetween(b.lastLoggedAt.slice(0, 10), today) : 9999
    return bLast - aLast
  })
  return pool[0]
}

function pickHighestPriorityGoal(goals: Goal[], excludeId?: string): Goal | null {
  const pool = goals.filter((g) => !g.archivedAt && !g.completedAt && g.id !== excludeId)
  if (pool.length === 0) return null
  pool.sort((a, b) => a.priority - b.priority || (b.difficultyRating - a.difficultyRating))
  return pool[0]
}

export function generateDailyQuests(ctx: GenerateContext): Quest[] {
  const quests: Quest[] = []
  const usedGoalIds = new Set<string>()

  // Quest 1: most neglected
  const q1Goal = pickMostNeglectedGoal(ctx.goals)
  if (q1Goal) {
    usedGoalIds.add(q1Goal.id)
    const lastDays = q1Goal.lastLoggedAt
      ? daysBetween(q1Goal.lastLoggedAt.slice(0, 10), todayISO())
      : null
    quests.push(
      makeQuest({
        title: q1Goal.isBossBattle
          ? `Strike at ${q1Goal.bossBattleConfig?.bossName ?? 'the boss'}`
          : `Show up for: ${q1Goal.title}`,
        description:
          lastDays === null
            ? 'You haven\'t logged this once yet. Today is the day.'
            : lastDays > 1
              ? `${lastDays} days since you last touched this. Time to come back.`
              : 'Keep the momentum.',
        xpReward: 60,
        bonusCondition: 'Complete before noon for +30 XP',
        bonusXp: 30,
        linkedGoalId: q1Goal.id,
        source: 'most-neglected',
      })
    )
  }

  // Quest 2: highest priority
  const q2Goal = pickHighestPriorityGoal(ctx.goals, q1Goal?.id)
  if (q2Goal) {
    usedGoalIds.add(q2Goal.id)
    quests.push(
      makeQuest({
        title: q2Goal.isBossBattle
          ? `Lay damage on ${q2Goal.bossBattleConfig?.bossName ?? 'the boss'}`
          : `Push: ${q2Goal.title}`,
        description: `Your top-priority goal. Streak: ${q2Goal.currentStreak}. Don\'t lose ground.`,
        xpReward: 50,
        linkedGoalId: q2Goal.id,
        source: 'highest-priority',
      })
    )
  }

  // Quest 3: wildcard
  const wildcards: Array<{ ok: boolean; build: () => Quest }> = [
    {
      ok: !ctx.ritualDoneToday,
      build: () =>
        makeQuest({
          title: 'Run the Daily Ritual',
          description: 'All 6 steps. Five minutes each. Compound.',
          xpReward: 70,
          linkedModule: 'ritual' as ModuleId,
          source: 'wildcard-ritual',
        }),
    },
    {
      ok: !ctx.oneDegreeAnsweredToday,
      build: () =>
        makeQuest({
          title: 'Answer today\'s One Degree',
          description: 'A small, slow question. Widen by one degree.',
          xpReward: 25,
          linkedModule: 'onedegree' as ModuleId,
          source: 'wildcard-onedegree',
        }),
    },
    {
      ok: ctx.unsentDraftsToday === 0,
      build: () =>
        makeQuest({
          title: 'Write an Unsent draft',
          description: 'Write what you would never send. Honest. Unedited.',
          xpReward: 30,
          linkedModule: 'unsent' as ModuleId,
          source: 'wildcard-unsent',
        }),
    },
    {
      ok: ctx.finiteWeekUnmarkedLastWeek,
      build: () =>
        makeQuest({
          title: 'Mark last week on the Finite grid',
          description: 'Was last week green, gray, or gold? Be honest.',
          xpReward: 35,
          linkedModule: 'finite' as ModuleId,
          source: 'wildcard-finite',
        }),
    },
    {
      ok: ctx.silenceLogsLast7d === 0,
      build: () =>
        makeQuest({
          title: 'Notice one silence',
          description: 'When did you go quiet today? Log it.',
          xpReward: 25,
          linkedModule: 'silence' as ModuleId,
          source: 'wildcard-silence',
        }),
    },
  ]
  const wc = wildcards.find((w) => w.ok) ?? wildcards[0]
  if (wc) quests.push(wc.build())

  return quests.slice(0, 3)
}

import type { Goal, Achievement, ModuleId } from '@/types'
import { ACHIEVEMENTS } from '@/data/achievements'
import { AREA_IDS } from '@/types'

export interface AchievementContext {
  goals: Goal[]
  unsentCount: number
  unsentToParents: number
  oneDegreeCount: number
  silenceCount: number
  daysOpened: number
  consecutiveDaysOpened: number
  bossBattlesWon: number
  perfectDays: number
  greenWeeksThisYear: number
  graysEver: number
  goldsEver: number
  perfectRitualDaysConsecutive: number
  level: number
  unlockedModules: Set<ModuleId>
  comebackStreakAchieved: boolean
  phoenixCount: number
  eulogyChars: number
  masteredArea: boolean
  seasonalBossesCompleted: number
  // year-day cardinal counts
  totalCompletedGoals: number
  longestEverStreak: number
  longestGoalDurationDays: number
  fiveStreaksAchieved: boolean
}

export function checkAchievements(
  ctx: AchievementContext,
  alreadyUnlocked: Set<string>
): Achievement[] {
  const newly: Achievement[] = []
  const has = (id: string) => alreadyUnlocked.has(id)

  const cond: Record<string, () => boolean> = {
    'first-blood': () => ctx.goals.some((g) => g.logs.length > 0),
    honest: () => ctx.graysEver >= 1,
    'say-it': () => ctx.unsentCount >= 1,
    curious: () => ctx.oneDegreeCount >= 1,
    'still-here': () => ctx.consecutiveDaysOpened >= 7,
    'first-quest': () =>
      ctx.goals.some((g) => g.logs.length > 0) && ctx.daysOpened >= 1,
    'perfect-day': () => ctx.perfectDays >= 1,

    'on-fire': () => ctx.longestEverStreak >= 7,
    'world-wider': () => ctx.oneDegreeCount >= 30,
    'dear-me': () => ctx.unsentCount >= 10,
    planner: () =>
      AREA_IDS.every((a) => ctx.goals.some((g) => g.area === a && !g.archivedAt)),
    unbeaten: () => ctx.bossBattlesWon >= 1,
    'first-green': () => ctx.greenWeeksThisYear >= 1,
    'five-streaks': () => ctx.fiveStreaksAchieved,

    'iron-man': () => ctx.longestEverStreak >= 30,
    scholar: () =>
      ctx.goals.some(
        (g) => g.area === 'learning' && g.completedAt !== undefined
      ),
    'dragon-slayer': () => ctx.bossBattlesWon >= 3,
    'long-game': () => ctx.daysOpened >= 90,
    eulogy: () => ctx.eulogyChars >= 200,
    father: () => ctx.unsentToParents >= 1,
    comeback: () => ctx.comebackStreakAchieved,

    legendary: () => ctx.level >= 50,
    mastery: () => ctx.masteredArea,
    'full-map': () => ctx.oneDegreeCount >= 365,
    'the-life': () => ctx.totalCompletedGoals >= 10,
    'all-seasons': () => ctx.seasonalBossesCompleted >= 4,
    phoenix: () => ctx.phoenixCount >= 1,
    'silent-witness': () => ctx.silenceCount >= 100,
    'green-year': () => ctx.greenWeeksThisYear >= 40,
    cathedral: () => ctx.longestGoalDurationDays >= 365 && ctx.totalCompletedGoals >= 1,
  }

  for (const ach of ACHIEVEMENTS) {
    if (has(ach.id)) continue
    const fn = cond[ach.id]
    if (fn && fn()) newly.push(ach)
  }

  return newly
}

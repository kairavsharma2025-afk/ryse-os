// XP rewards table — single source of truth.

export const XP = {
  logGoalProgress: 30,
  completeStreakDay: 50,
  completeMilestone: 150,
  completeGoal: 400,
  completeBossBattle: 800,
  answerOneDegree: 15,
  writeUnsentDraft: 20,
  markWeekGreen: 40,
  markWeekGray: 10,
  markWeekGold: 80,
  completeRitual: 25,
  completeAllDailyQuests: 100,
  weeklyStreak7: 200,
  weeklyStreak30: 500,
  bossDamage: 60, // per attack landed
  silenceLog: 12,
  valuesScore: 30,
  eulogyUpdate: 20,
  comebackBonusMultiplier: 2,
  comebackBonusDays: 3,
} as const

// Per-day cap to discourage spam logging
export const DAILY_LOG_CAP_PER_GOAL = 1

// Streak shield grants
export const STREAK_SHIELD_PER_MONTH = 1

// Difficulty XP multiplier
export const DIFFICULTY_MULTIPLIER: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 0.7,
  2: 0.85,
  3: 1.0,
  4: 1.25,
  5: 1.6,
}

// Streak XP multiplier — keeps building reasonable
export function streakMultiplier(days: number): number {
  if (days >= 30) return 1.5
  if (days >= 14) return 1.35
  if (days >= 7) return 1.2
  if (days >= 3) return 1.1
  return 1.0
}

// Hard mode penalty
export const HARD_MODE_MULTIPLIER = 0.7

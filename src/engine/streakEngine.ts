import type { Goal } from '@/types'
import { daysBetween, todayISO } from './dates'

export type StreakVisualState = 'cold' | 'building' | 'burning' | 'inferno' | 'legendary'

export function streakVisualState(days: number): StreakVisualState {
  if (days >= 30) return 'legendary'
  if (days >= 14) return 'inferno'
  if (days >= 7) return 'burning'
  if (days >= 3) return 'building'
  return 'cold'
}

export function streakEmoji(days: number): string {
  const s = streakVisualState(days)
  switch (s) {
    case 'legendary':
      return '👑'
    case 'inferno':
      return '🔥'
    case 'burning':
      return '🔥'
    case 'building':
      return '✨'
    default:
      return '·'
  }
}

// Determines whether logging today increments, holds, or breaks the streak.
export function nextStreak(goal: Goal, dateISO = todayISO()): {
  newStreak: number
  longestStreak: number
  isMilestone: boolean
  milestoneDays?: number
  brokeStreak: boolean
} {
  const today = dateISO
  const last = goal.lastLoggedAt?.slice(0, 10)

  if (!last) {
    return {
      newStreak: 1,
      longestStreak: Math.max(1, goal.longestStreak),
      isMilestone: false,
      brokeStreak: false,
    }
  }

  const diff = daysBetween(last, today)
  if (diff === 0) {
    return {
      newStreak: goal.currentStreak,
      longestStreak: goal.longestStreak,
      isMilestone: false,
      brokeStreak: false,
    }
  }

  if (diff === 1) {
    const newStreak = goal.currentStreak + 1
    const milestoneDays = [7, 14, 21, 30, 60, 90, 180, 365]
    const isMilestone = milestoneDays.includes(newStreak)
    return {
      newStreak,
      longestStreak: Math.max(newStreak, goal.longestStreak),
      isMilestone,
      milestoneDays: isMilestone ? newStreak : undefined,
      brokeStreak: false,
    }
  }

  // diff > 1 → streak broken (caller decides whether to apply shield)
  return {
    newStreak: 1,
    longestStreak: goal.longestStreak,
    isMilestone: false,
    brokeStreak: true,
  }
}

// Has the streak been broken passively (i.e. no log today and missed yesterday)?
export function isStreakBroken(goal: Goal, dateISO = todayISO()): boolean {
  if (!goal.lastLoggedAt || goal.currentStreak === 0) return false
  const last = goal.lastLoggedAt.slice(0, 10)
  return daysBetween(last, dateISO) > 1
}

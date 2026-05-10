import { HARD_MODE_MULTIPLIER } from '@/data/xp'

export const MAX_LEVEL = 50

// Level thresholds via exponential curve. xpForLevel(n) = round(50 * n^1.8)
export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  return Math.round(50 * Math.pow(level, 1.8))
}

// Cumulative XP needed to reach `level` from level 1
export function cumulativeXpForLevel(level: number): number {
  let total = 0
  for (let i = 2; i <= level; i++) total += xpForLevel(i)
  return total
}

// Given total XP, compute level + progress within current level
export function levelFromXp(totalXp: number): {
  level: number
  xpIntoLevel: number
  xpForNextLevel: number
  progress: number
} {
  let level = 1
  let xpLeft = totalXp
  while (level < MAX_LEVEL) {
    const need = xpForLevel(level + 1)
    if (xpLeft < need) {
      return {
        level,
        xpIntoLevel: xpLeft,
        xpForNextLevel: need,
        progress: need === 0 ? 1 : xpLeft / need,
      }
    }
    xpLeft -= need
    level++
  }
  return { level: MAX_LEVEL, xpIntoLevel: xpLeft, xpForNextLevel: 0, progress: 1 }
}

export function applyHardMode(xp: number, hardMode: boolean): number {
  return hardMode ? Math.round(xp * HARD_MODE_MULTIPLIER) : xp
}

import type { CharacterStats, Goal, AreaId } from '@/types'
import { AREA_IDS } from '@/types'
import { daysBetween, todayISO } from './dates'

const ROLLING_DAYS = 30

export function emptyStats(): CharacterStats {
  return { career: 0, health: 0, relationships: 0, finance: 0, learning: 0, mind: 0 }
}

// Compute area stat 0..100 from rolling 30-day log activity.
export function computeStats(goals: Goal[], baseline: CharacterStats): CharacterStats {
  const today = todayISO()
  const buckets: Record<AreaId, { days: Set<string>; logCount: number; goalsHere: number }> = {
    career: { days: new Set(), logCount: 0, goalsHere: 0 },
    health: { days: new Set(), logCount: 0, goalsHere: 0 },
    relationships: { days: new Set(), logCount: 0, goalsHere: 0 },
    finance: { days: new Set(), logCount: 0, goalsHere: 0 },
    learning: { days: new Set(), logCount: 0, goalsHere: 0 },
    mind: { days: new Set(), logCount: 0, goalsHere: 0 },
  }

  for (const g of goals) {
    if (g.archivedAt) continue
    buckets[g.area].goalsHere++
    for (const log of g.logs) {
      const days = daysBetween(log.date.slice(0, 10), today)
      if (days >= 0 && days <= ROLLING_DAYS) {
        buckets[g.area].days.add(log.date.slice(0, 10))
        buckets[g.area].logCount++
      }
    }
  }

  const result = { ...baseline }
  for (const area of AREA_IDS) {
    const b = buckets[area]
    // Component 1: distinct days logged in last 30 (max 30 → 60 pts)
    const dayScore = Math.min(60, b.days.size * 2)
    // Component 2: goals here (max 3 → 18 pts)
    const goalScore = Math.min(18, b.goalsHere * 6)
    // Component 3: log frequency (max 16 pts)
    const freqScore = Math.min(16, b.logCount)
    const computed = dayScore + goalScore + freqScore + (baseline[area] ?? 0) * 0.1
    result[area] = Math.max(0, Math.min(100, Math.round(computed)))
  }

  return result
}

// Most-neglected area (longest since last log overall)
export function mostNeglectedArea(goals: Goal[]): AreaId | null {
  const today = todayISO()
  let worst: { area: AreaId; days: number } | null = null
  for (const area of AREA_IDS) {
    const inArea = goals.filter((g) => g.area === area && !g.archivedAt && !g.completedAt)
    if (inArea.length === 0) continue
    const lastDays = inArea.map((g) => {
      if (!g.lastLoggedAt) return 9999
      return daysBetween(g.lastLoggedAt.slice(0, 10), today)
    })
    const oldest = Math.max(...lastDays)
    if (!worst || oldest > worst.days) worst = { area, days: oldest }
  }
  return worst?.area ?? null
}

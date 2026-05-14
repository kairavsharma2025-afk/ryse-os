import { addDays, format, parseISO, startOfWeek } from 'date-fns'
import { RITUAL_STEPS } from '@/data/ritual'
import { todayISO } from '@/engine/dates'
import type { RitualLog } from '@/types'

/**
 * Shared maths for the Ritual page. Keep all date / streak / aggregate logic
 * here so the hero, stats strip, and heatmap can't drift out of sync.
 */

export const PERFECT = RITUAL_STEPS.length // 6

export interface RitualMath {
  todayDoneCount: number
  todayLog?: RitualLog
  xpEarnedToday: number
  /** Consecutive days back from today with PERFECT completion. */
  currentPerfectStreak: number
  /** Longest historical run of consecutive perfect-ritual days. */
  longestPerfectStreak: number
  /** Total all-time perfect days. */
  totalPerfectDays: number
  /** Perfect days in the last 30 calendar days. */
  perfectDays30d: number
  /** Avg fraction of steps done in the trailing 7 days (incl today). */
  weeklyCompletionRate: number
  logsByDate: Map<string, RitualLog>
}

export function computeRitualMath(logs: RitualLog[]): RitualMath {
  const today = todayISO()
  const logsByDate = new Map<string, RitualLog>()
  for (const l of logs) logsByDate.set(l.date, l)

  const todayLog = logsByDate.get(today)
  const todayDoneCount = todayLog?.completedStepIds.length ?? 0
  const xpEarnedToday = todayLog
    ? sumXp(todayLog.completedStepIds)
    : 0

  // Current perfect streak — walk back from today (today counts only if perfect).
  let currentPerfectStreak = 0
  let cursor = parseISO(today)
  while (true) {
    const iso = format(cursor, 'yyyy-MM-dd')
    const log = logsByDate.get(iso)
    if (log && log.completedStepIds.length >= PERFECT) {
      currentPerfectStreak++
      cursor = addDays(cursor, -1)
    } else break
  }

  // Longest perfect streak — single pass over sorted log dates.
  const perfectDates = [...logsByDate.values()]
    .filter((l) => l.completedStepIds.length >= PERFECT)
    .map((l) => l.date)
    .sort()
  let longestPerfectStreak = 0
  let run = 0
  let prev: string | null = null
  for (const d of perfectDates) {
    if (prev && diffDaysISO(prev, d) === 1) run++
    else run = 1
    if (run > longestPerfectStreak) longestPerfectStreak = run
    prev = d
  }

  const totalPerfectDays = perfectDates.length

  // Last 30 days.
  const thirtyAgo = format(addDays(parseISO(today), -29), 'yyyy-MM-dd')
  const perfectDays30d = perfectDates.filter((d) => d >= thirtyAgo).length

  // Weekly completion rate.
  const sevenAgo = format(addDays(parseISO(today), -6), 'yyyy-MM-dd')
  let weeklySum = 0
  for (let i = 0; i < 7; i++) {
    const d = format(addDays(parseISO(sevenAgo), i), 'yyyy-MM-dd')
    const l = logsByDate.get(d)
    weeklySum += l ? l.completedStepIds.length : 0
  }
  const weeklyCompletionRate = weeklySum / (7 * PERFECT)

  return {
    todayDoneCount,
    todayLog,
    xpEarnedToday,
    currentPerfectStreak,
    longestPerfectStreak,
    totalPerfectDays,
    perfectDays30d,
    weeklyCompletionRate,
    logsByDate,
  }
}

function sumXp(stepIds: string[]): number {
  const map = new Map(RITUAL_STEPS.map((s) => [s.id, s.xpReward]))
  return stepIds.reduce((s, id) => s + (map.get(id) ?? 0), 0)
}

function diffDaysISO(a: string, b: string): number {
  const ad = parseISO(a).getTime()
  const bd = parseISO(b).getTime()
  return Math.round((bd - ad) / 86_400_000)
}

/**
 * 13×7 grid for the heatmap. Returns columns left→right by week starting on
 * Monday; each cell is the date + completion fraction (0..1). The most recent
 * week is the rightmost column.
 */
export interface HeatCell {
  date: string
  count: number
  pct: number // 0..1
  isToday: boolean
  isFuture: boolean
}

export function buildHeatmap(logs: RitualLog[], weeks = 13): HeatCell[][] {
  const today = todayISO()
  const todayD = parseISO(today)
  // Anchor: Monday of (today - (weeks-1) * 7 days).
  const startDate = startOfWeek(addDays(todayD, -(weeks - 1) * 7), { weekStartsOn: 1 })
  const map = new Map<string, RitualLog>()
  for (const l of logs) map.set(l.date, l)

  const cols: HeatCell[][] = []
  for (let w = 0; w < weeks; w++) {
    const col: HeatCell[] = []
    for (let d = 0; d < 7; d++) {
      const date = format(addDays(startDate, w * 7 + d), 'yyyy-MM-dd')
      const log = map.get(date)
      const count = log?.completedStepIds.length ?? 0
      col.push({
        date,
        count,
        pct: count / PERFECT,
        isToday: date === today,
        isFuture: date > today,
      })
    }
    cols.push(col)
  }
  return cols
}

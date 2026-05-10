import { addDays, format, parseISO, differenceInCalendarDays } from 'date-fns'
import type { SeasonState, Season } from '@/types'
import { SEASONS } from '@/data/seasons'
import { todayISO } from './dates'

export const SEASON_LENGTH_DAYS = 90

export function makeFreshSeasonState(seasonId = SEASONS[0].id): SeasonState {
  const start = todayISO()
  const end = format(addDays(parseISO(start), SEASON_LENGTH_DAYS), 'yyyy-MM-dd')
  const season = SEASONS.find((s) => s.id === seasonId) ?? SEASONS[0]
  return {
    currentSeasonId: season.id,
    startDate: start,
    endDate: end,
    bossHp: season.bossInitialHp,
    questsCompleted: 0,
    goalsCompleted: 0,
    bossBattlesWon: 0,
    pastSeasons: [],
  }
}

export function daysLeftInSeason(state: SeasonState): number {
  return Math.max(0, differenceInCalendarDays(parseISO(state.endDate), new Date()))
}

export function seasonComplete(state: SeasonState): boolean {
  return daysLeftInSeason(state) === 0
}

export function seasonProgress(state: SeasonState): number {
  const total = differenceInCalendarDays(parseISO(state.endDate), parseISO(state.startDate))
  const elapsed = total - daysLeftInSeason(state)
  return total === 0 ? 1 : Math.min(1, Math.max(0, elapsed / total))
}

// Returns next season after current. Wraps.
export function nextSeasonAfter(currentId: string): Season {
  const idx = SEASONS.findIndex((s) => s.id === currentId)
  return SEASONS[(idx + 1) % SEASONS.length]
}

export function rolloverIfDone(state: SeasonState): SeasonState {
  if (!seasonComplete(state)) return state
  const past = [
    ...state.pastSeasons,
    {
      seasonId: state.currentSeasonId,
      startDate: state.startDate,
      endDate: state.endDate,
      questsCompleted: state.questsCompleted,
      goalsCompleted: state.goalsCompleted,
      bossBattlesWon: state.bossBattlesWon,
      rewardClaimed: state.bossHp <= 0,
    },
  ]
  const nextSeason = nextSeasonAfter(state.currentSeasonId)
  const fresh = makeFreshSeasonState(nextSeason.id)
  fresh.pastSeasons = past
  return fresh
}

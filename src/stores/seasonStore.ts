import { create } from 'zustand'
import type { SeasonState } from '@/types'
import { loadJSON, saveJSON } from './persist'
import { makeFreshSeasonState, rolloverIfDone, seasonComplete } from '@/engine/seasonEngine'
import { getSeason } from '@/data/seasons'

interface SeasonStoreState extends SeasonState {
  damageBoss(amount: number): { defeated: boolean; bossHp: number }
  recordQuestComplete(): void
  recordGoalComplete(): void
  recordBossWin(): void
  ensureNotExpired(): boolean
  reset(): void
}

const persisted = loadJSON<SeasonState>('season', makeFreshSeasonState())

function persist(s: SeasonState) {
  saveJSON('season', {
    currentSeasonId: s.currentSeasonId,
    startDate: s.startDate,
    endDate: s.endDate,
    bossHp: s.bossHp,
    questsCompleted: s.questsCompleted,
    goalsCompleted: s.goalsCompleted,
    bossBattlesWon: s.bossBattlesWon,
    pastSeasons: s.pastSeasons,
  })
}

export const useSeason = create<SeasonStoreState>((set, get) => ({
  ...persisted,

  damageBoss: (amount) => {
    const cur = get()
    const newHp = Math.max(0, cur.bossHp - amount)
    set({ bossHp: newHp })
    persist(get())
    return { defeated: newHp === 0, bossHp: newHp }
  },

  recordQuestComplete: () => {
    set({ questsCompleted: get().questsCompleted + 1 })
    get().damageBoss(2)
    persist(get())
  },

  recordGoalComplete: () => {
    set({ goalsCompleted: get().goalsCompleted + 1 })
    get().damageBoss(8)
    persist(get())
  },

  recordBossWin: () => {
    set({ bossBattlesWon: get().bossBattlesWon + 1 })
    get().damageBoss(15)
    persist(get())
  },

  ensureNotExpired: () => {
    const cur = get()
    if (seasonComplete(cur)) {
      const next = rolloverIfDone(cur)
      set({ ...next })
      persist(get())
      return false
    }
    return true
  },

  reset: () => {
    const fresh = makeFreshSeasonState()
    set({ ...fresh })
    persist(get())
  },
}))

export function currentSeason() {
  return getSeason(useSeason.getState().currentSeasonId)
}

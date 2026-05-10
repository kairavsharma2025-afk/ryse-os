import { create } from 'zustand'
import type { Quest } from '@/types'
import { loadJSON, saveJSON } from './persist'
import { todayISO, nowISO } from '@/engine/dates'
import { generateDailyQuests } from '@/engine/questGenerator'
import { useGoals } from './goalsStore'
import { useModules } from './modulesStore'

interface QuestsState {
  history: Quest[] // all-time, includes completed/skipped
  todayQuests: Quest[]
  generatedFor: string // YYYY-MM-DD
  ensureToday(): void
  completeQuest(id: string): { quest: Quest | undefined; allDone: boolean; xp: number; bonusXp: number }
  skipQuest(id: string): void
  regenerateToday(): void
  countCompletedToday(): number
}

const persisted = loadJSON<{ history: Quest[]; todayQuests: Quest[]; generatedFor: string }>(
  'quests',
  { history: [], todayQuests: [], generatedFor: '' }
)

function persist(state: QuestsState) {
  saveJSON('quests', {
    history: state.history,
    todayQuests: state.todayQuests,
    generatedFor: state.generatedFor,
  })
}

export const useQuests = create<QuestsState>((set, get) => ({
  history: persisted.history,
  todayQuests: persisted.todayQuests,
  generatedFor: persisted.generatedFor,

  ensureToday: () => {
    const today = todayISO()
    if (get().generatedFor === today && get().todayQuests.length > 0) return
    const goals = useGoals.getState().goals
    const m = useModules.getState()
    const fresh = generateDailyQuests({
      goals,
      ritualDoneToday: m.ritual.logs.some((l) => l.date === today && l.completedStepIds.length > 0),
      oneDegreeAnsweredToday: m.oneDegree.answers.some((a) => a.date === today),
      unsentDraftsToday: m.unsent.drafts.filter((d) => d.createdAt.slice(0, 10) === today).length,
      finiteWeekUnmarkedLastWeek: !m.finite.weeks.find((w) => w.status !== 'gray'),
      silenceLogsLast7d: m.silence.logs.filter((l) => {
        const d = new Date(l.createdAt)
        const diff = (Date.now() - d.getTime()) / 86400000
        return diff <= 7
      }).length,
    })
    set({ todayQuests: fresh, generatedFor: today })
    persist(get())
  },

  completeQuest: (id) => {
    let target: Quest | undefined
    let bonusXp = 0
    let xp = 0
    const today = todayISO()
    const updated = get().todayQuests.map((q) => {
      if (q.id !== id || q.completedAt) return q
      target = { ...q, completedAt: nowISO() }
      xp = q.xpReward
      // Bonus before noon?
      if (q.bonusXp && new Date().getHours() < 12) bonusXp = q.bonusXp
      return target
    })
    set({ todayQuests: updated })

    // sync history
    if (target) {
      const hist = get().history.filter((h) => h.id !== target!.id)
      set({ history: [...hist, target] })
    }
    persist(get())

    const allDone =
      updated.length > 0 && updated.every((q) => q.completedAt || q.skippedAt)

    return { quest: target, allDone: allDone && get().generatedFor === today, xp, bonusXp }
  },

  skipQuest: (id) => {
    const updated = get().todayQuests.map((q) =>
      q.id === id ? { ...q, skippedAt: nowISO() } : q
    )
    set({ todayQuests: updated })
    persist(get())
  },

  regenerateToday: () => {
    set({ generatedFor: '', todayQuests: [] })
    get().ensureToday()
  },

  countCompletedToday: () => {
    const today = todayISO()
    if (get().generatedFor !== today) return 0
    return get().todayQuests.filter((q) => q.completedAt).length
  },
}))

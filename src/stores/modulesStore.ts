import { create } from 'zustand'
import { loadJSON, saveJSON } from './persist'
import { nowISO, todayISO, isoWeekNumber, isoWeekYear } from '@/engine/dates'
import type {
  FiniteWeek,
  RitualLog,
  OneDegreeAnswer,
  UnsentDraft,
  SilenceLog,
  ValuesScore,
  Eulogy,
} from '@/types'

interface FiniteState {
  weeks: FiniteWeek[]
}
interface RitualState {
  logs: RitualLog[]
}
interface OneDegreeState {
  answers: OneDegreeAnswer[]
}
interface UnsentState {
  drafts: UnsentDraft[]
}
interface SilenceState {
  logs: SilenceLog[]
}
interface ValuesState {
  scores: ValuesScore[]
  eulogy: Eulogy
}

interface ModulesState {
  finite: FiniteState
  ritual: RitualState
  oneDegree: OneDegreeState
  unsent: UnsentState
  silence: SilenceState
  values: ValuesState

  // ---- finite ----
  setWeekStatus(args: { isoYear: number; isoWeek: number; status: FiniteWeek['status']; note?: string }): void
  thisWeekStatus(): FiniteWeek | undefined

  // ---- ritual ----
  toggleRitualStep(stepId: string): { allCompleted: boolean }
  ritualLogToday(): RitualLog | undefined

  // ---- one degree ----
  saveAnswer(args: { questionId: string; text: string }): OneDegreeAnswer

  // ---- unsent ----
  addDraft(args: { recipient: string; subject?: string; body: string }): UnsentDraft
  updateDraft(id: string, patch: Partial<UnsentDraft>): void
  burnDraft(id: string): void
  draftsCount(): number

  // ---- silence ----
  addSilence(args: { trigger: string; emotion: string; pattern?: string; insight?: string }): SilenceLog

  // ---- values + eulogy ----
  saveValues(ratings: Record<string, number>): ValuesScore
  saveEulogy(body: string): void
}

const persisted = loadJSON<{
  finite: FiniteState
  ritual: RitualState
  oneDegree: OneDegreeState
  unsent: UnsentState
  silence: SilenceState
  values: ValuesState
}>('modules', {
  finite: { weeks: [] },
  ritual: { logs: [] },
  oneDegree: { answers: [] },
  unsent: { drafts: [] },
  silence: { logs: [] },
  values: { scores: [], eulogy: { body: '', updatedAt: '' } },
})

function persist(state: ModulesState) {
  saveJSON('modules', {
    finite: state.finite,
    ritual: state.ritual,
    oneDegree: state.oneDegree,
    unsent: state.unsent,
    silence: state.silence,
    values: state.values,
  })
}

export const useModules = create<ModulesState>((set, get) => ({
  ...persisted,

  // finite
  setWeekStatus: ({ isoYear, isoWeek, status, note }) => {
    const cur = get().finite.weeks
    const idx = cur.findIndex((w) => w.isoYear === isoYear && w.isoWeek === isoWeek)
    let next: FiniteWeek[]
    if (idx >= 0) {
      next = cur.map((w, i) => (i === idx ? { ...w, status, note } : w))
    } else {
      next = [...cur, { isoYear, isoWeek, status, note }]
    }
    set({ finite: { weeks: next } })
    persist(get())
  },
  thisWeekStatus: () => {
    const y = isoWeekYear()
    const w = isoWeekNumber()
    return get().finite.weeks.find((x) => x.isoYear === y && x.isoWeek === w)
  },

  // ritual
  toggleRitualStep: (stepId) => {
    const today = todayISO()
    const cur = get().ritual.logs
    const idx = cur.findIndex((l) => l.date === today)
    let next: RitualLog[]
    let completedSet: Set<string>
    if (idx >= 0) {
      const existing = cur[idx]
      completedSet = new Set(existing.completedStepIds)
      if (completedSet.has(stepId)) completedSet.delete(stepId)
      else completedSet.add(stepId)
      next = cur.map((l, i) =>
        i === idx ? { ...l, completedStepIds: Array.from(completedSet) } : l
      )
    } else {
      completedSet = new Set([stepId])
      next = [...cur, { date: today, completedStepIds: [stepId] }]
    }
    set({ ritual: { logs: next } })
    persist(get())
    return { allCompleted: completedSet.size >= 6 }
  },
  ritualLogToday: () => get().ritual.logs.find((l) => l.date === todayISO()),

  // one degree
  saveAnswer: ({ questionId, text }) => {
    const today = todayISO()
    const ans: OneDegreeAnswer = {
      id: crypto.randomUUID(),
      questionId,
      text,
      date: today,
    }
    // replace any existing for today
    const filtered = get().oneDegree.answers.filter((a) => a.date !== today)
    set({ oneDegree: { answers: [...filtered, ans] } })
    persist(get())
    return ans
  },

  // unsent
  addDraft: ({ recipient, subject, body }) => {
    const draft: UnsentDraft = {
      id: crypto.randomUUID(),
      recipient,
      subject,
      body,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    }
    set({ unsent: { drafts: [draft, ...get().unsent.drafts] } })
    persist(get())
    return draft
  },
  updateDraft: (id, patch) => {
    set({
      unsent: {
        drafts: get().unsent.drafts.map((d) =>
          d.id === id ? { ...d, ...patch, updatedAt: nowISO() } : d
        ),
      },
    })
    persist(get())
  },
  burnDraft: (id) => {
    set({
      unsent: {
        drafts: get().unsent.drafts.map((d) =>
          d.id === id ? { ...d, burnedAt: nowISO() } : d
        ),
      },
    })
    persist(get())
  },
  draftsCount: () => get().unsent.drafts.length,

  // silence
  addSilence: ({ trigger, emotion, pattern, insight }) => {
    const log: SilenceLog = {
      id: crypto.randomUUID(),
      trigger,
      emotion,
      pattern,
      insight,
      createdAt: nowISO(),
    }
    set({ silence: { logs: [log, ...get().silence.logs] } })
    persist(get())
    return log
  },

  // values + eulogy
  saveValues: (ratings) => {
    const score: ValuesScore = {
      id: crypto.randomUUID(),
      ratings,
      date: todayISO(),
    }
    set({ values: { ...get().values, scores: [score, ...get().values.scores] } })
    persist(get())
    return score
  },
  saveEulogy: (body) => {
    set({ values: { ...get().values, eulogy: { body, updatedAt: nowISO() } } })
    persist(get())
  },
}))

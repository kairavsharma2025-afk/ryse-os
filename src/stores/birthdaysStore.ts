import { create } from 'zustand'
import type { Birthday } from '@/types'
import { loadJSON, saveJSON } from './persist'
import { nowISO } from '@/engine/dates'

interface BirthdaysState {
  birthdays: Birthday[]
  addBirthday(input: Omit<Birthday, 'id' | 'createdAt'>): Birthday
  updateBirthday(id: string, patch: Partial<Birthday>): void
  deleteBirthday(id: string): void
  markNotified(id: string, kind: 'today' | 'tomorrow', onDate: string): void
}

const initial = loadJSON<Birthday[]>('birthdays', [])

function persist(s: BirthdaysState) {
  saveJSON('birthdays', s.birthdays)
}

export const useBirthdays = create<BirthdaysState>((set, get) => ({
  birthdays: initial,

  addBirthday: (input) => {
    const b: Birthday = { id: crypto.randomUUID(), createdAt: nowISO(), ...input }
    set({ birthdays: [...get().birthdays, b] })
    persist(get())
    return b
  },

  updateBirthday: (id, patch) => {
    set({ birthdays: get().birthdays.map((b) => (b.id === id ? { ...b, ...patch } : b)) })
    persist(get())
  },

  deleteBirthday: (id) => {
    set({ birthdays: get().birthdays.filter((b) => b.id !== id) })
    persist(get())
  },

  markNotified: (id, kind, onDate) => {
    set({
      birthdays: get().birthdays.map((b) =>
        b.id === id
          ? { ...b, ...(kind === 'today' ? { lastNotifiedOn: onDate } : { lastHeraldedOn: onDate }) }
          : b
      ),
    })
    persist(get())
  },
}))

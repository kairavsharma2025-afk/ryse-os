import { create } from 'zustand'
import type { Reminder } from '@/types'
import { loadJSON, saveJSON } from './persist'
import { nowISO } from '@/engine/dates'
import { nextFireTime } from '@/engine/remindersEngine'

const SNOOZE_MS = 10 * 60_000 // 10 minutes

interface RemindersState {
  reminders: Reminder[]
  addReminder(input: Omit<Reminder, 'id' | 'createdAt'>): Reminder
  updateReminder(id: string, patch: Partial<Reminder>): void
  deleteReminder(id: string): void
  markFired(id: string, onDate: string): void
  toggleDone(id: string): void
  snoozeReminder(id: string): void
}

const initial = loadJSON<Reminder[]>('reminders', [])

function persist(s: RemindersState) {
  saveJSON('reminders', s.reminders)
}

export const useReminders = create<RemindersState>((set, get) => ({
  reminders: initial,

  addReminder: (input) => {
    const r: Reminder = { id: crypto.randomUUID(), createdAt: nowISO(), ...input }
    set({ reminders: [...get().reminders, r] })
    persist(get())
    return r
  },

  updateReminder: (id, patch) => {
    set({ reminders: get().reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)) })
    persist(get())
  },

  deleteReminder: (id) => {
    set({ reminders: get().reminders.filter((r) => r.id !== id) })
    persist(get())
  },

  markFired: (id, onDate) => {
    set({
      reminders: get().reminders.map((r) =>
        r.id === id
          ? { ...r, lastFiredOn: onDate, snoozedUntil: undefined, done: r.repeat === 'once' ? true : r.done }
          : r
      ),
    })
    persist(get())
  },

  toggleDone: (id) => {
    set({ reminders: get().reminders.map((r) => (r.id === id ? { ...r, done: !r.done } : r)) })
    persist(get())
  },

  // Push the reminder's next fire 10 minutes down the road (and revive it if it was done/fired).
  snoozeReminder: (id) => {
    const now = Date.now()
    set({
      reminders: get().reminders.map((r) => {
        if (r.id !== id) return r
        const next = nextFireTime(r, new Date(now))
        const base = Math.max(now, next ? next.getTime() : now)
        return { ...r, snoozedUntil: new Date(base + SNOOZE_MS).toISOString(), done: false, lastFiredOn: undefined }
      }),
    })
    persist(get())
  },
}))

import { create } from 'zustand'
import type { ScheduleEvent } from '@/types'
import { loadJSON, saveJSON } from './persist'
import { nowISO } from '@/engine/dates'

interface ScheduleState {
  events: ScheduleEvent[]
  addEvent(input: Omit<ScheduleEvent, 'id' | 'createdAt'>): ScheduleEvent
  updateEvent(id: string, patch: Partial<ScheduleEvent>): void
  deleteEvent(id: string): void
  eventsOn(dateISO: string): ScheduleEvent[]
  eventsBetween(startISO: string, endISO: string): ScheduleEvent[]
}

const byTime = (a: ScheduleEvent, b: ScheduleEvent) =>
  a.startTime.localeCompare(b.startTime) || a.title.localeCompare(b.title)

const initial = loadJSON<ScheduleEvent[]>('schedule', [])

function persist(s: ScheduleState) {
  saveJSON('schedule', s.events)
}

export const useSchedule = create<ScheduleState>((set, get) => ({
  events: initial,

  addEvent: (input) => {
    const e: ScheduleEvent = { id: crypto.randomUUID(), createdAt: nowISO(), ...input }
    set({ events: [...get().events, e] })
    persist(get())
    return e
  },

  updateEvent: (id, patch) => {
    set({ events: get().events.map((e) => (e.id === id ? { ...e, ...patch } : e)) })
    persist(get())
  },

  deleteEvent: (id) => {
    set({ events: get().events.filter((e) => e.id !== id) })
    persist(get())
  },

  eventsOn: (dateISO) => get().events.filter((e) => e.date === dateISO).sort(byTime),

  eventsBetween: (startISO, endISO) =>
    get()
      .events.filter((e) => e.date >= startISO && e.date <= endISO)
      .sort((a, b) => a.date.localeCompare(b.date) || byTime(a, b)),
}))

import { create } from 'zustand'
import type { Note } from '@/types'
import { loadJSON, saveJSON } from './persist'
import { nowISO } from '@/engine/dates'

interface NotesState {
  notes: Note[]
  addNote(input: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note
  updateNote(id: string, patch: Partial<Note>): void
  deleteNote(id: string): void
  togglePin(id: string): void
}

const initial = loadJSON<Note[]>('notes', [])

function persist(s: NotesState) {
  saveJSON('notes', s.notes)
}

export const useNotes = create<NotesState>((set, get) => ({
  notes: initial,

  addNote: (input) => {
    const now = nowISO()
    const n: Note = { id: crypto.randomUUID(), createdAt: now, updatedAt: now, ...input }
    set({ notes: [...get().notes, n] })
    persist(get())
    return n
  },

  updateNote: (id, patch) => {
    set({
      notes: get().notes.map((n) =>
        n.id === id ? { ...n, ...patch, updatedAt: nowISO() } : n
      ),
    })
    persist(get())
  },

  deleteNote: (id) => {
    set({ notes: get().notes.filter((n) => n.id !== id) })
    persist(get())
  },

  togglePin: (id) => {
    set({
      notes: get().notes.map((n) =>
        n.id === id ? { ...n, pinned: !n.pinned, updatedAt: nowISO() } : n
      ),
    })
    persist(get())
  },
}))

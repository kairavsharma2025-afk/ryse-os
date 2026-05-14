import { create } from 'zustand'
import type { Task } from '@/types'
import { loadJSON, saveJSON } from './persist'
import { nowISO } from '@/engine/dates'

interface TasksState {
  tasks: Task[]
  addTask(input: Omit<Task, 'id' | 'createdAt'>): Task
  updateTask(id: string, patch: Partial<Task>): void
  deleteTask(id: string): void
  toggleDone(id: string): void
  // Delegation: park a task on someone with a follow-up date.
  delegateTask(id: string, assignedTo: string, followUpDate?: string): void
  undelegate(id: string): void
}

const initial = loadJSON<Task[]>('tasks', [])

function persist(s: TasksState) {
  saveJSON('tasks', s.tasks)
}

export const useTasks = create<TasksState>((set, get) => ({
  tasks: initial,

  addTask: (input) => {
    const t: Task = { id: crypto.randomUUID(), createdAt: nowISO(), ...input }
    set({ tasks: [...get().tasks, t] })
    persist(get())
    return t
  },

  updateTask: (id, patch) => {
    set({ tasks: get().tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })
    persist(get())
  },

  deleteTask: (id) => {
    set({ tasks: get().tasks.filter((t) => t.id !== id) })
    persist(get())
  },

  toggleDone: (id) => {
    set({
      tasks: get().tasks.map((t) =>
        t.id === id ? { ...t, completedAt: t.completedAt ? undefined : nowISO() } : t
      ),
    })
    persist(get())
  },

  delegateTask: (id, assignedTo, followUpDate) => {
    set({
      tasks: get().tasks.map((t) =>
        t.id === id ? { ...t, assignedTo, followUpDate } : t
      ),
    })
    persist(get())
  },

  undelegate: (id) => {
    set({
      tasks: get().tasks.map((t) =>
        t.id === id ? { ...t, assignedTo: undefined, followUpDate: undefined } : t
      ),
    })
    persist(get())
  },
}))

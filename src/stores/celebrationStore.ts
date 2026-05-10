import { create } from 'zustand'
import type { Celebration, CelebrationKind } from '@/types'

interface CelebrationStoreState {
  queue: Celebration[]
  push(kind: CelebrationKind, payload?: Record<string, unknown>): void
  shift(): Celebration | undefined
  clear(): void
}

export const useCelebrations = create<CelebrationStoreState>((set, get) => ({
  queue: [],
  push: (kind, payload = {}) => {
    set({ queue: [...get().queue, { id: crypto.randomUUID(), kind, payload }] })
  },
  shift: () => {
    const [head, ...rest] = get().queue
    if (!head) return undefined
    set({ queue: rest })
    return head
  },
  clear: () => set({ queue: [] }),
}))

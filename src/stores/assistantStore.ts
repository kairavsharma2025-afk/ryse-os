import { create } from 'zustand'
import type { ChatMessage, ChatRole, DailyPlan } from '@/types'
import { loadJSON, saveJSON } from './persist'
import { nowISO } from '@/engine/dates'

interface AssistantState {
  messages: ChatMessage[]
  plan?: DailyPlan
  // transient UI state (not persisted)
  panelOpen: boolean
  thinking: boolean
  planLoading: boolean
  error?: string

  setPanelOpen(open: boolean): void
  togglePanel(): void
  setThinking(v: boolean): void
  setPlanLoading(v: boolean): void
  setError(e?: string): void
  addMessage(role: ChatRole, content: string): ChatMessage
  setPlan(plan: DailyPlan): void
  clearChat(): void
}

const persistedMsgs = loadJSON<ChatMessage[]>('assistant_chat', [])
const persistedPlan = loadJSON<DailyPlan | null>('assistant_plan', null)

function persistMsgs(s: AssistantState) {
  saveJSON('assistant_chat', s.messages.slice(-120))
}
function persistPlan(s: AssistantState) {
  saveJSON('assistant_plan', s.plan ?? null)
}

export const useAssistant = create<AssistantState>((set, get) => ({
  messages: persistedMsgs,
  plan: persistedPlan ?? undefined,
  panelOpen: false,
  thinking: false,
  planLoading: false,
  error: undefined,

  setPanelOpen: (open) => set({ panelOpen: open }),
  togglePanel: () => set({ panelOpen: !get().panelOpen }),
  setThinking: (v) => set({ thinking: v }),
  setPlanLoading: (v) => set({ planLoading: v }),
  setError: (e) => set({ error: e }),

  addMessage: (role, content) => {
    const m: ChatMessage = { id: crypto.randomUUID(), role, content, createdAt: nowISO() }
    set({ messages: [...get().messages, m] })
    persistMsgs(get())
    return m
  },

  setPlan: (plan) => {
    set({ plan })
    persistPlan(get())
  },

  clearChat: () => {
    set({ messages: [] })
    persistMsgs(get())
  },
}))

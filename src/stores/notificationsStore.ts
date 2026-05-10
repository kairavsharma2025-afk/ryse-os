import { create } from 'zustand'
import { Capacitor } from '@capacitor/core'
import type { Notification as AppNotification } from '@/types'
import { loadJSON, saveJSON } from './persist'
import { nowISO } from '@/engine/dates'

interface NotificationsState {
  list: AppNotification[]
  push(input: Omit<AppNotification, 'id' | 'createdAt'>): AppNotification
  markRead(id: string): void
  markAllRead(): void
  clear(): void
  unreadCount(): number
}

const persisted = loadJSON<AppNotification[]>('notifications', [])

function persist(s: NotificationsState) {
  saveJSON('notifications', s.list)
}

export const useNotifications = create<NotificationsState>((set, get) => ({
  list: persisted,

  push: (input) => {
    const n: AppNotification = {
      id: crypto.randomUUID(),
      createdAt: nowISO(),
      ...input,
    }
    set({ list: [n, ...get().list].slice(0, 200) })
    persist(get())
    // best-effort browser notification (no service worker required).
    // On the native apps, OS notifications come from scheduled local notifications instead.
    const browserNotif = (typeof window !== 'undefined' ? window.Notification : undefined)
    if (
      browserNotif &&
      !Capacitor.isNativePlatform() &&
      browserNotif.permission === 'granted' &&
      document.visibilityState !== 'visible'
    ) {
      try {
        new browserNotif(`${n.emoji ?? ''} ${n.title}`.trim(), { body: n.body })
      } catch {
        /* ignore */
      }
    }
    return n
  },

  markRead: (id) => {
    set({
      list: get().list.map((n) => (n.id === id ? { ...n, readAt: nowISO() } : n)),
    })
    persist(get())
  },

  markAllRead: () => {
    set({
      list: get().list.map((n) => ({ ...n, readAt: n.readAt ?? nowISO() })),
    })
    persist(get())
  },

  clear: () => {
    set({ list: [] })
    persist(get())
  },

  unreadCount: () => get().list.filter((n) => !n.readAt).length,
}))

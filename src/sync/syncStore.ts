import { create } from 'zustand'

export type SyncPhase = 'disabled' | 'idle' | 'syncing' | 'error'

interface SyncState {
  /** True when this device has a signed-in user with a valid session token. */
  enabled: boolean
  phase: SyncPhase
  /** ms epoch of the last successful push/pull, or null. */
  lastSyncedAt: number | null
  error: string | null
  /** Label shown in the UI — the signed-in email when available, else the user id prefix. */
  userLabel: string | null

  setEnabled(v: boolean, userLabel?: string | null): void
  setPhase(p: SyncPhase): void
  markSynced(): void
  setError(message: string): void
}

// Read the initial signed-in state directly from localStorage so App can route
// correctly on the very first render — without it, returning users would see a
// flash of the SignIn screen before SyncProvider's effect fires.
function initialIdentity(): { enabled: boolean; userLabel: string | null } {
  try {
    const userId = localStorage.getItem('lifeos:v1:__sync_user_id')
    const token = localStorage.getItem('lifeos:v1:__sync_token')
    if (userId && token) {
      const email = localStorage.getItem('lifeos:v1:__sync_email')
      return { enabled: true, userLabel: email ?? userId.slice(0, 8) }
    }
  } catch {
    /* localStorage blocked */
  }
  return { enabled: false, userLabel: null }
}

const initial = initialIdentity()

export const useSync = create<SyncState>((set) => ({
  enabled: initial.enabled,
  phase: initial.enabled ? 'idle' : 'disabled',
  lastSyncedAt: null,
  error: null,
  userLabel: initial.userLabel,

  setEnabled: (v, userLabel) =>
    set((s) => ({
      enabled: v,
      phase: v ? (s.phase === 'disabled' ? 'idle' : s.phase) : 'disabled',
      error: v ? s.error : null,
      userLabel: userLabel === undefined ? s.userLabel : userLabel,
    })),
  setPhase: (p) => set({ phase: p }),
  markSynced: () => set({ phase: 'idle', lastSyncedAt: Date.now(), error: null }),
  setError: (message) => set({ phase: 'error', error: message }),
}))

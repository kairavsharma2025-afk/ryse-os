import { create } from 'zustand'

export type SyncPhase = 'disabled' | 'idle' | 'syncing' | 'error'

interface SyncState {
  /** True when a Clerk session is active and sync is operating. */
  enabled: boolean
  phase: SyncPhase
  /** ms epoch of the last successful push/pull, or null. */
  lastSyncedAt: number | null
  error: string | null
  /** Display name for the signed-in account (email / username). */
  userLabel: string | null

  setEnabled(v: boolean, userLabel?: string | null): void
  setPhase(p: SyncPhase): void
  markSynced(): void
  setError(message: string): void
}

export const useSync = create<SyncState>((set) => ({
  enabled: false,
  phase: 'disabled',
  lastSyncedAt: null,
  error: null,
  userLabel: null,

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

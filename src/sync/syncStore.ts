import { create } from 'zustand'

export type SyncPhase = 'disabled' | 'idle' | 'syncing' | 'error'

interface SyncState {
  /** True when this device is paired (a user id is stored locally). */
  enabled: boolean
  phase: SyncPhase
  /** ms epoch of the last successful push/pull, or null. */
  lastSyncedAt: number | null
  error: string | null
  /** Short suffix of the paired user id, shown in the UI. */
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

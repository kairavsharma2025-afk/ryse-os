import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { bootstrapSync, pullRemote } from './engine'
import { getSyncUserId } from './client'
import { useSync } from './syncStore'

const POLL_INTERVAL_MS = 30_000

const shortLabel = (id: string): string => `device · ${id.slice(0, 4)}…${id.slice(-4)}`

/**
 * Watches the paired sync user id in localStorage and runs the sync engine
 * when it changes:
 *
 *   • on mount, if a user id is stored, bootstrap (pull remote, push stale local)
 *     unless main.tsx already did it before render (flagged via the global below);
 *   • when the id changes mid-session (e.g. the user pairs/disconnects), bootstrap
 *     again and reload once if local data was wiped/changed.
 *
 * Listens to `storage` events too so a "Disconnect" tap on one tab is picked up
 * by other tabs in the same browser.
 */
export function SyncProvider({ children }: { children: ReactNode }) {
  const bootstrappedFor = useRef<string | null>(null)

  useEffect(() => {
    function reconcile() {
      const userId = getSyncUserId()
      if (userId) {
        useSync.getState().setEnabled(true, shortLabel(userId))

        const preBootstrapped =
          (window as unknown as { __ryseBootstrappedUserId?: string }).__ryseBootstrappedUserId ===
          userId

        if (bootstrappedFor.current !== userId) {
          bootstrappedFor.current = userId
          if (!preBootstrapped) {
            void bootstrapSync(userId).then((res) => {
              if (res.ok && (res.changedKeys.length > 0 || res.wipedLocal)) {
                window.location.reload()
              }
            })
          }
        }
      } else {
        useSync.getState().setEnabled(false, null)
        bootstrappedFor.current = null
      }
    }

    reconcile()

    // Cross-tab + same-tab updates: 'storage' for other tabs, the custom event for
    // this tab (window.dispatchEvent on every setSyncUserId call).
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'lifeos:v1:__sync_user_id') reconcile()
    }
    const onPaired = () => reconcile()

    // Pull remote state on focus / visibility-change and every 30s while visible,
    // so changes made on the other paired device (phone ↔ laptop) show up here
    // without a manual refresh. Reload on change so Zustand stores rehydrate.
    let pulling = false
    async function pullIfPaired() {
      if (pulling) return
      if (!getSyncUserId()) return
      pulling = true
      try {
        const changed = await pullRemote()
        if (changed.length > 0) window.location.reload()
      } finally {
        pulling = false
      }
    }
    const onFocus = () => void pullIfPaired()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void pullIfPaired()
    }
    const pollTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void pullIfPaired()
    }, POLL_INTERVAL_MS)

    window.addEventListener('storage', onStorage)
    window.addEventListener('ryse:sync-identity-changed', onPaired)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('ryse:sync-identity-changed', onPaired)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
      window.clearInterval(pollTimer)
    }
  }, [])

  return <>{children}</>
}

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { setTokenGetter } from './client'
import { bootstrapSync } from './engine'
import { useSync } from './syncStore'

/**
 * Bridges Clerk auth state into the sync engine:
 *   • registers a token getter so background pushes can authenticate;
 *   • runs `bootstrapSync` when the user signs in mid-session (the initial
 *     page-load case is handled in main.tsx before render, and flagged via
 *     `window.__ryseBootstrappedUserId` so we don't do it twice);
 *   • after a mid-session bootstrap that changed local data, reloads once so the
 *     in-memory Zustand stores pick up the merged state.
 *
 * Renders its children unchanged — sync never gates the UI.
 */
export function SyncProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth()
  const { user } = useUser()
  const bootstrappedFor = useRef<string | null>(null)

  useEffect(() => {
    if (!isLoaded) return

    if (isSignedIn && userId) {
      setTokenGetter(() => getToken())
      const label =
        user?.primaryEmailAddress?.emailAddress ??
        user?.emailAddresses?.[0]?.emailAddress ??
        user?.username ??
        null
      useSync.getState().setEnabled(true, label)

      const preBootstrapped = (window as unknown as { __ryseBootstrappedUserId?: string }).__ryseBootstrappedUserId === userId

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
      // Signed out: stop syncing but keep local data on the device. We deliberately
      // keep the recorded owner so that if a *different* account signs in next,
      // bootstrapSync detects the mismatch and wipes this account's data first.
      setTokenGetter(null)
      useSync.getState().setEnabled(false, null)
      bootstrappedFor.current = null
    }
  }, [isLoaded, isSignedIn, userId, getToken, user])

  return <>{children}</>
}

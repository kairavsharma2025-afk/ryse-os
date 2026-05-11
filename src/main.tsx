import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App'
import { SyncProvider, setTokenGetter, bootstrapSync } from './sync'
import './index.css'

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim()

declare global {
  interface Window {
    /** Set by the pre-render bootstrap so <SyncProvider> doesn't re-sync the same user. */
    __ryseBootstrappedUserId?: string
  }
}

/**
 * Before React mounts, if there's an active Clerk session, pull the user's state
 * from the server into localStorage so the Zustand stores hydrate from it (no flash,
 * no reload). Returns the loaded Clerk instance so <ClerkProvider> can reuse it.
 */
async function preBootstrap() {
  if (!CLERK_KEY) return undefined
  try {
    const { Clerk } = await import('@clerk/clerk-js')
    const clerk = new Clerk(CLERK_KEY)
    await clerk.load()
    const session = clerk.session
    const userId = session?.user?.id
    if (session && userId) {
      setTokenGetter(() => session.getToken())
      window.__ryseBootstrappedUserId = userId
      try {
        await bootstrapSync(userId)
      } catch {
        /* offline → fall back to local data */
      }
    }
    return clerk
  } catch {
    return undefined
  }
}

async function main() {
  const clerk = await preBootstrap()

  const app = <App />
  const withSync = CLERK_KEY ? <SyncProvider>{app}</SyncProvider> : app
  const tree = <BrowserRouter>{withSync}</BrowserRouter>

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      {CLERK_KEY ? (
        <ClerkProvider publishableKey={CLERK_KEY} Clerk={clerk}>
          {tree}
        </ClerkProvider>
      ) : (
        tree
      )}
    </StrictMode>
  )

  // Register the PWA service worker in production builds only (it would serve stale
  // assets during `vite dev`).
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* offline support is best-effort */
      })
    })
  }
}

void main()

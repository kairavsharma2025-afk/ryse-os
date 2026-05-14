import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { SyncProvider, bootstrapSync, getSyncUserId } from './sync'
import { ToastHost } from './components/ui/Toast'
import './index.css'

declare global {
  interface Window {
    /** Set by the pre-render bootstrap so <SyncProvider> doesn't re-sync the same user. */
    __ryseBootstrappedUserId?: string
  }
}

/**
 * Before React mounts, if this device is paired (a sync user id is stored
 * locally), pull the user's state from the server into localStorage so the
 * Zustand stores hydrate from it — no flash, no reload.
 */
async function preBootstrap(): Promise<void> {
  const userId = getSyncUserId()
  if (!userId) return
  window.__ryseBootstrappedUserId = userId
  try {
    await bootstrapSync(userId)
  } catch {
    /* offline → fall back to local data */
  }
}

async function main() {
  await preBootstrap()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <SyncProvider>
          <App />
        </SyncProvider>
        <ToastHost />
      </BrowserRouter>
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

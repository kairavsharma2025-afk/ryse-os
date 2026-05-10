import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Chrome/Android fire `beforeinstallprompt` very early — capture it at module load
// (before React mounts) so the Install button can use it later.
let captured: BeforeInstallPromptEvent | null = null
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    captured = e as BeforeInstallPromptEvent
    window.dispatchEvent(new Event('ryse:installprompt'))
  })
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

const isIOSSafari =
  typeof navigator !== 'undefined' &&
  /iphone|ipad|ipod/i.test(navigator.userAgent) &&
  !/crios|fxios|edgios/i.test(navigator.userAgent)

export function useInstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(captured)
  const [installed, setInstalled] = useState(isStandalone())

  useEffect(() => {
    const onPrompt = () => setEvt(captured)
    const onInstalled = () => {
      captured = null
      setEvt(null)
      setInstalled(true)
    }
    window.addEventListener('ryse:installprompt', onPrompt)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('ryse:installprompt', onPrompt)
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const promptInstall = async (): Promise<boolean> => {
    if (!evt) return false
    await evt.prompt()
    const { outcome } = await evt.userChoice
    captured = null
    setEvt(null)
    return outcome === 'accepted'
  }

  return { canPrompt: !!evt, promptInstall, installed, isIOSSafari }
}

import { Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'
import { SettingsSection } from './SettingsSection'

export function InstallSection() {
  const { canPrompt, promptInstall, installed, isIOSSafari } = useInstallPrompt()
  if (installed) return null
  return (
    <SettingsSection
      id="install"
      icon={Smartphone}
      title="Install Ryse"
      description="Add Ryse to your home screen — full-screen, own icon, works offline-ish."
    >
      {canPrompt ? (
        <Button onClick={() => void promptInstall()}>
          <Smartphone className="w-3.5 h-3.5" />
          Install on this device
        </Button>
      ) : isIOSSafari ? (
        <p className="text-xs text-muted leading-relaxed">
          On iPhone/iPad: tap <span className="text-text">Share</span>, then{' '}
          <span className="text-text">"Add to Home Screen"</span>. Ryse then opens full-screen with
          its own icon.
        </p>
      ) : (
        <p className="text-xs text-muted leading-relaxed">
          Use your browser's menu → <span className="text-text">"Install app"</span> /{' '}
          <span className="text-text">"Add to Home Screen"</span> to run Ryse as a standalone app.
        </p>
      )}
    </SettingsSection>
  )
}

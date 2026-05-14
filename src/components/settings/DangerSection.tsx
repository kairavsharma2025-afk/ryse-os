import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { clearAll } from '@/stores/persist'
import { wipeRemoteState } from '@/sync'
import { SettingsSection } from './SettingsSection'

export function DangerSection() {
  const reset = async () => {
    if (!confirm('This will erase your character, goals, and all progress. Continue?')) return
    try {
      await wipeRemoteState() // no-op when signed out
    } catch {
      /* best effort — proceed with local wipe regardless */
    }
    clearAll()
    location.reload()
  }
  return (
    <SettingsSection
      id="danger"
      icon={AlertTriangle}
      tone="danger"
      title="Danger zone"
      description="Erase your character and start over. This cannot be undone."
    >
      <Button variant="danger" onClick={() => void reset()}>
        Reset everything
      </Button>
    </SettingsSection>
  )
}

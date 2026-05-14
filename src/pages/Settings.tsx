import { Link } from 'react-router-dom'
import { AccountCard } from '@/components/account/AccountCard'
import { SettingsNav, SETTINGS_SECTIONS } from '@/components/settings/SettingsNav'
import { AssistantSection } from '@/components/settings/AssistantSection'
import { AppearanceSection } from '@/components/settings/AppearanceSection'
import { NotificationsSection } from '@/components/settings/NotificationsSection'
import { RoutineSection } from '@/components/settings/RoutineSection'
import { GameSection } from '@/components/settings/GameSection'
import { InstallSection } from '@/components/settings/InstallSection'
import { DangerSection } from '@/components/settings/DangerSection'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

/**
 * Settings — the redesigned page splits the long stack into focused
 * sections, each rendered by its own component under components/settings.
 *
 *   Account · Assistant · Appearance · Notifications · Routine · Game ·
 *   Install · Danger
 *
 * SettingsNav is a sticky pill row up top: tap → smooth-scroll to the
 * matching section; IntersectionObserver highlights the active pill as
 * you scroll. The Install section vanishes when the app is already
 * installed, so the nav filters it out too.
 */
export function Settings() {
  const { installed } = useInstallPrompt()
  const visibleIds = SETTINGS_SECTIONS.filter((s) => s.id !== 'install' || !installed).map(
    (s) => s.id
  )

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl tracking-wide">Settings</h1>
        <p className="text-sm text-muted mt-1">
          Tune Ryse. Everything here stays on your device unless you've signed in.
        </p>
      </header>

      <SettingsNav visibleIds={visibleIds} />

      <section id="settings-account" className="scroll-mt-24">
        <AccountCard />
      </section>

      <AssistantSection />
      <AppearanceSection />
      <NotificationsSection />
      <RoutineSection />
      <GameSection />
      {!installed && <InstallSection />}
      <DangerSection />

      <div className="text-center text-[11px] text-muted/70 pt-2">
        <Link to="/privacy" className="hover:text-accent transition-colors">
          Privacy policy
        </Link>{' '}
        · Ryse keeps everything on your device.
      </div>
    </div>
  )
}

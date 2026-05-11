import { Cloud } from 'lucide-react'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import { Card } from '@/components/ui/Card'
import { useSync } from '@/sync'

const CLERK_ENABLED = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim())

function SyncStatus() {
  const enabled = useSync((s) => s.enabled)
  const phase = useSync((s) => s.phase)
  const lastSyncedAt = useSync((s) => s.lastSyncedAt)
  const error = useSync((s) => s.error)
  const userLabel = useSync((s) => s.userLabel)

  if (!enabled) {
    return (
      <p className="text-xs text-muted leading-relaxed">
        Sign in to back up your progress and pick it up on another device. Until then, everything
        stays on this device only.
      </p>
    )
  }

  const when = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  let line: React.ReactNode
  if (phase === 'syncing') line = 'Syncing…'
  else if (phase === 'error') line = <span className="text-red-400">Sync error{error ? `: ${error}` : ''}</span>
  else line = when ? `Synced at ${when}` : 'Sync ready'

  return (
    <p className="text-xs text-muted leading-relaxed">
      {line}
      {userLabel ? <span className="text-muted/70"> · {userLabel}</span> : null}
    </p>
  )
}

export function AccountCard() {
  if (!CLERK_ENABLED) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <Cloud className="w-5 h-5 text-accent" strokeWidth={1.8} />
          <h3 className="font-display text-lg">Account &amp; sync</h3>
          <span className="ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full border border-border bg-surface2/40 text-muted">
            ● not configured
          </span>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Cross-device sync ships in this build but isn&apos;t switched on here. Set{' '}
          <code className="text-accent2">VITE_CLERK_PUBLISHABLE_KEY</code> (and the backend env vars —
          see <code className="text-accent2">.env.example</code>) to enable it.
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <Cloud className="w-5 h-5 text-accent" strokeWidth={1.8} />
        <h3 className="font-display text-lg">Account &amp; sync</h3>
        <div className="ml-auto flex items-center">
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-[11px] font-medium px-3 py-1 rounded-full border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 transition">
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
      <SyncStatus />
      <p className="text-xs text-muted/80 leading-relaxed mt-3">
        Your character, goals, schedule, reminders and everything else are mirrored to your account so
        you can continue on another device. Sign out any time — your data stays on this device too.
      </p>
    </Card>
  )
}

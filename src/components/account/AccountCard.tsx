import { Cloud, Mail, Smartphone } from 'lucide-react'
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react'
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
          Cross-device sync ships in this build but auth isn&apos;t configured yet. Install the{' '}
          <span className="text-text">Clerk</span> integration from the Vercel Marketplace — that
          auto-sets <code className="text-accent2">VITE_CLERK_PUBLISHABLE_KEY</code> and{' '}
          <code className="text-accent2">CLERK_SECRET_KEY</code> on every environment. Run{' '}
          <code className="text-accent2">vercel env pull</code> after, then redeploy.
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <Cloud className="w-5 h-5 text-accent" strokeWidth={1.8} />
        <h3 className="font-display text-lg">Account &amp; sync</h3>
        <SignedIn>
          <div className="ml-auto flex items-center">
            <UserButton afterSignOutUrl="/" />
          </div>
        </SignedIn>
      </div>

      <SignedOut>
        <p className="text-sm text-text/90 leading-relaxed mb-3">
          Create an account with your <span className="text-accent2">email</span> or{' '}
          <span className="text-accent2">phone number</span> to sync your character, goals, and
          progress across every device you sign in on.
        </p>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <SignUpButton mode="modal">
            <button className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full bg-gradient-to-r from-accent to-accent2 text-bg shadow-glow hover:opacity-90 transition">
              <Mail className="w-4 h-4" />
              Create account
            </button>
          </SignUpButton>
          <SignInButton mode="modal">
            <button className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full border border-border bg-surface2/40 text-text hover:border-accent/40 transition">
              Sign in
            </button>
          </SignInButton>
        </div>
        <p className="text-[11px] text-muted/80 leading-relaxed flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <Mail className="w-3 h-3" />
            Email + verification code
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Smartphone className="w-3 h-3" />
            Phone number + SMS code
          </span>
        </p>
      </SignedOut>

      <SignedIn>
        <SyncStatus />
        <p className="text-xs text-muted/80 leading-relaxed mt-3">
          Your character, goals, schedule, reminders and everything else are mirrored to your account
          so you can continue on another device. Sign out any time — your data stays on this device
          too.
        </p>
      </SignedIn>
    </Card>
  )
}

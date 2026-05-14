import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  apiSignIn,
  apiSignUp,
  bootstrapSync,
  getSyncUserId,
  setSyncIdentity,
} from '@/sync'

/**
 * Gate screen shown before Onboarding when the device has no session.
 *
 * Two modes — Sign in / Create account — selected via top tabs. Successful
 * auth stamps the session into localStorage, runs bootstrapSync once so the
 * Zustand stores get the latest server state, and then the app routes to
 * Onboarding (new user) or Home (returning user) on its own.
 */
export function SignIn() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasPairingUserId = !!getSyncUserId()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const identity =
        mode === 'signup'
          ? await apiSignUp(email.trim(), password)
          : await apiSignIn(email.trim(), password)
      setSyncIdentity(identity)
      // Pull whatever the server already has for this account, then let
      // SyncProvider take over and re-render the app.
      try {
        await bootstrapSync(identity.userId)
      } catch {
        /* offline — local data still loads */
      }
      window.location.reload()
    } catch (err) {
      setError((err as Error).message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-sm w-full"
      >
        <div className="text-center mb-6">
          <div className="text-[10px] uppercase tracking-[0.5em] text-muted mb-3">
            ─── enter the game ───
          </div>
          <h1 className="font-display text-5xl tracking-[0.06em] text-accent mb-1">RYSE</h1>
          <p className="text-muted text-sm">
            Your character. Your goals. Synced to every device you sign in on.
          </p>
        </div>

        <Card className="p-6">
          <div className="grid grid-cols-2 gap-1 p-1 bg-surface2/40 rounded-lg mb-5 text-sm">
            <button
              type="button"
              onClick={() => {
                setMode('signup')
                setError(null)
              }}
              className={`py-2 rounded-md transition ${
                mode === 'signup'
                  ? 'bg-accent/15 text-accent shadow-inner'
                  : 'text-muted hover:text-text'
              }`}
            >
              Create account
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signin')
                setError(null)
              }}
              className={`py-2 rounded-md transition ${
                mode === 'signin'
                  ? 'bg-accent/15 text-accent shadow-inner'
                  : 'text-muted hover:text-text'
              }`}
            >
              Sign in
            </button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted mb-1.5">Email</div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted mb-1.5">Password</div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'At least 8 characters' : '•••••••••'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
                minLength={mode === 'signup' ? 8 : undefined}
                className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </div>
            )}

            <Button type="submit" disabled={busy || !email || !password} full size="lg">
              {busy
                ? 'One moment…'
                : mode === 'signup'
                  ? 'Create my account →'
                  : 'Sign in →'}
            </Button>
          </form>

          {mode === 'signup' && hasPairingUserId && (
            <p className="text-[11px] text-muted/80 mt-4 leading-relaxed">
              We&apos;ll attach your existing local data to this new account, so your
              level, goals, schedule, and progress all carry over.
            </p>
          )}
          {mode === 'signin' && (
            <p className="text-[11px] text-muted/80 mt-4 leading-relaxed">
              Signing in on a new device will pull your character, goals, schedule
              and progress from your account.
            </p>
          )}
        </Card>

        <p className="text-[10px] text-center text-muted/60 mt-4 leading-relaxed">
          Real life is the most important game you&apos;ll ever play.
        </p>
      </motion.div>
    </div>
  )
}

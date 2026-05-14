import { useEffect, useRef, useState } from 'react'
import { Cloud, Copy, Check, RotateCw, X as XIcon, LogOut, User } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  apiCreatePairing,
  apiRedeemPairing,
  apiSignOut,
  bootstrapSync,
  getSyncEmail,
  setSyncIdentity,
  useSync,
  type PairingCode,
} from '@/sync'

function SyncStatus() {
  const enabled = useSync((s) => s.enabled)
  const phase = useSync((s) => s.phase)
  const lastSyncedAt = useSync((s) => s.lastSyncedAt)
  const error = useSync((s) => s.error)

  if (!enabled) return null

  const when = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  let line: React.ReactNode
  if (phase === 'syncing') line = 'Syncing…'
  else if (phase === 'error')
    line = <span className="text-red-400">Sync error{error ? `: ${error}` : ''}</span>
  else line = when ? `Synced at ${when}` : 'Sync ready'

  return <p className="text-xs text-muted leading-relaxed">{line}</p>
}

function formatMmSs(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function AccountCard() {
  const signedIn = useSync((s) => s.enabled)
  const email = getSyncEmail()

  const [mode, setMode] = useState<'idle' | 'create' | 'enter'>('idle')
  const [pairing, setPairing] = useState<PairingCode | null>(null)
  const [remaining, setRemaining] = useState(0)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!pairing) {
      setRemaining(0)
      return
    }
    setRemaining(pairing.expiresInSec)
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(t)
          setPairing(null)
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [pairing])

  useEffect(() => {
    if (mode === 'enter') requestAnimationFrame(() => inputRef.current?.focus())
  }, [mode])

  const createCode = async () => {
    setBusy(true)
    setError(null)
    try {
      const p = await apiCreatePairing()
      setPairing(p)
      setMode('create')
    } catch (e) {
      setError((e as Error).message || 'Failed to create code')
    } finally {
      setBusy(false)
    }
  }

  const redeemCode = async () => {
    const trimmed = code.replace(/\D/g, '').slice(0, 6)
    if (trimmed.length !== 6) {
      setError('Enter the 6-digit code')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const identity = await apiRedeemPairing(trimmed)
      setSyncIdentity(identity)
      try {
        await bootstrapSync(identity.userId)
      } catch {
        /* offline */
      }
      window.location.reload()
    } catch (e) {
      setError((e as Error).message || 'Failed to redeem code')
    } finally {
      setBusy(false)
    }
  }

  const copyCode = async () => {
    if (!pairing) return
    try {
      await navigator.clipboard.writeText(pairing.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked */
    }
  }

  const signOut = async () => {
    if (
      !confirm(
        'Sign out of this device? Your data stays on the server — sign in again on any device to pick it up.'
      )
    )
      return
    await apiSignOut()
    window.location.reload()
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <Cloud className="w-5 h-5 text-accent" strokeWidth={1.8} />
        <h3 className="font-display text-lg">Account</h3>
        {signedIn && (
          <span className="ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full border border-accent/40 bg-accent/10 text-accent2">
            ● Signed in
          </span>
        )}
      </div>

      {signedIn ? (
        <>
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-accent2" strokeWidth={1.8} />
            <span className="text-sm text-text">{email ?? 'Signed in'}</span>
          </div>
          <SyncStatus />
          <p className="text-xs text-muted/80 leading-relaxed mt-3">
            Your character, goals, schedule, reminders and progress are mirrored to your
            account. Sign in on any device to pick up where you left off, or generate a
            6-digit code to add another device without typing your password.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={createCode} disabled={busy}>
              <RotateCw className="w-3.5 h-3.5" />
              Add another device
            </Button>
            <Button variant="subtle" size="sm" onClick={signOut}>
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-text/90 leading-relaxed mb-3">
            Sign in to sync your character, goals, and progress across every device.
          </p>
          {mode === 'idle' && (
            <button
              onClick={() => setMode('enter')}
              disabled={busy}
              className="rounded-xl border border-border bg-surface2/40 hover:border-accent/40 p-4 text-left transition disabled:opacity-50 w-full"
            >
              <div className="font-display text-base text-text mb-1">
                Enter a sync code
              </div>
              <div className="text-[11px] text-muted leading-relaxed">
                Sign in here by entering a 6-digit code from another signed-in device.
              </div>
            </button>
          )}
        </>
      )}

      {mode === 'create' && pairing && (
        <div className="mt-4 rounded-xl border border-accent/40 bg-accent/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] uppercase tracking-[0.28em] text-muted">
              Type this on your other device
            </div>
            <button
              onClick={() => {
                setMode('idle')
                setPairing(null)
              }}
              className="text-muted hover:text-text"
              title="Close"
              aria-label="Close"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="font-mono text-3xl tracking-[0.4em] font-bold text-accent2 select-all">
              {pairing.code}
            </div>
            <button
              onClick={copyCode}
              className="ml-auto inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-border bg-surface2/40 hover:border-accent/40 transition"
              title="Copy"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-accent2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
          <div className="text-[11px] text-muted mt-2">
            Expires in {formatMmSs(remaining)}. Single use — generate another if you miss it.
          </div>
        </div>
      )}

      {mode === 'enter' && (
        <div className="mt-4 rounded-xl border border-border bg-surface2/40 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] uppercase tracking-[0.28em] text-muted">
              Enter the 6-digit code from your other device
            </div>
            <button
              onClick={() => {
                setMode('idle')
                setCode('')
                setError(null)
              }}
              className="text-muted hover:text-text"
              title="Close"
              aria-label="Close"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void redeemCode()
              }}
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-lg font-mono tracking-[0.3em] focus:outline-none focus:border-accent"
            />
            <Button onClick={() => void redeemCode()} disabled={busy || code.length !== 6}>
              Pair
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}
    </Card>
  )
}

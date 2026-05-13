import { useEffect, useRef, useState } from 'react'
import { Cloud, Copy, Check, RotateCw, X as XIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  apiCreatePairing,
  apiRedeemPairing,
  getSyncUserId,
  setSyncUserId,
  useSync,
  type PairingCode,
} from '@/sync'
import { forgetOwner } from '@/sync'

function SyncStatus() {
  const enabled = useSync((s) => s.enabled)
  const phase = useSync((s) => s.phase)
  const lastSyncedAt = useSync((s) => s.lastSyncedAt)
  const error = useSync((s) => s.error)
  const userLabel = useSync((s) => s.userLabel)

  if (!enabled) return null

  const when = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  let line: React.ReactNode
  if (phase === 'syncing') line = 'Syncing…'
  else if (phase === 'error')
    line = (
      <span className="text-red-400">Sync error{error ? `: ${error}` : ''}</span>
    )
  else line = when ? `Synced at ${when}` : 'Sync ready'

  return (
    <p className="text-xs text-muted leading-relaxed">
      {line}
      {userLabel ? <span className="text-muted/70"> · {userLabel}</span> : null}
    </p>
  )
}

function formatMmSs(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function AccountCard() {
  const userId = useSync((s) => (s.enabled ? getSyncUserId() : null))

  // Pairing flow state — only one of these is active at a time.
  const [mode, setMode] = useState<'idle' | 'create' | 'enter'>('idle')
  const [pairing, setPairing] = useState<PairingCode | null>(null)
  const [remaining, setRemaining] = useState(0)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Countdown for the displayed pairing code.
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
      const remoteUserId = await apiRedeemPairing(trimmed)
      setSyncUserId(remoteUserId)
      setMode('idle')
      setCode('')
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
      /* clipboard blocked — user can read the digits */
    }
  }

  const disconnect = () => {
    if (!confirm('Stop syncing this device? Your data stays here — but new changes stop being mirrored.')) return
    setSyncUserId(null)
    forgetOwner()
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <Cloud className="w-5 h-5 text-accent" strokeWidth={1.8} />
        <h3 className="font-display text-lg">Cross-device sync</h3>
        {userId && (
          <span className="ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full border border-accent/40 bg-accent/10 text-accent2">
            ● Paired
          </span>
        )}
      </div>

      {userId ? (
        <>
          <SyncStatus />
          <p className="text-xs text-muted/80 leading-relaxed mt-3">
            Your character, goals, schedule, reminders and everything else are mirrored to this
            account so you can continue on another device. Tap{' '}
            <span className="text-text">Get a sync code</span> on this device to add another, or{' '}
            <span className="text-text">Enter a sync code</span> to switch this device to a code
            from somewhere else.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={createCode} disabled={busy}>
              <RotateCw className="w-3.5 h-3.5" />
              Get a sync code
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setMode('enter')} disabled={busy}>
              Enter a sync code
            </Button>
            <Button variant="subtle" size="sm" onClick={disconnect}>
              Disconnect
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-text/90 leading-relaxed mb-3">
            Sync your character, goals, and progress across every device — phone, laptop, tablet.
            No account, no password: pair a device by code.
          </p>
          {mode === 'idle' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={createCode}
                disabled={busy}
                className="rounded-xl border border-accent/40 bg-gradient-to-br from-accent/10 to-accent2/5 hover:from-accent/15 hover:to-accent2/10 p-4 text-left transition disabled:opacity-50"
              >
                <div className="font-display text-base text-text mb-1">Get a sync code</div>
                <div className="text-[11px] text-muted leading-relaxed">
                  Use this on the first device. We&apos;ll give you a 6-digit code to type on the
                  next one.
                </div>
              </button>
              <button
                onClick={() => setMode('enter')}
                disabled={busy}
                className="rounded-xl border border-border bg-surface2/40 hover:border-accent/40 p-4 text-left transition disabled:opacity-50"
              >
                <div className="font-display text-base text-text mb-1">Enter a sync code</div>
                <div className="text-[11px] text-muted leading-relaxed">
                  Use this on the second device. Type the code from your first device.
                </div>
              </button>
            </div>
          )}
        </>
      )}

      {/* Show generated code */}
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

      {/* Enter code form */}
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

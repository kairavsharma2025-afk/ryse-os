import { useEffect, useState } from 'react'

/**
 * "Now: 4:00 PM — Demo & ship in 0m"-style pill with a pulsing green dot.
 * Re-renders every minute so the time stays current without a parent tick.
 * `context` is the optional trailing copy (e.g. the next event).
 */
export function NowIndicator({ context, className = '' }: { context?: string | null; className?: string }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])
  const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  return (
    <span
      className={`inline-flex items-center gap-2 text-[11px] text-muted ${className}`}
      aria-live="polite"
    >
      <span
        className="inline-block w-2 h-2 rounded-full animate-pulseDot"
        style={{ background: 'rgb(var(--color-success))' }}
        aria-hidden="true"
      />
      <span className="font-semibold text-text/90 tabular-nums">Now: {time}</span>
      {context && (
        <>
          <span className="text-muted/50">—</span>
          <span className="truncate">{context}</span>
        </>
      )}
    </span>
  )
}

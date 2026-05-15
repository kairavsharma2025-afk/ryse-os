import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom'
  delay?: number
}

/**
 * Lightweight hover/focus tooltip. Built in-house (no Radix dep) — matches
 * the spec's style: zinc-tone pill with a thin border, fades in on hover.
 *
 * Behaviour:
 *   - shows on mouseenter + focus (keyboard accessible)
 *   - hides on mouseleave + blur + Escape
 *   - delay default 120ms so quick mouse-by sweeps don't trigger
 */
export function Tooltip({ content, children, side = 'top', delay = 120 }: TooltipProps) {
  const [open, setOpen] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const id = useId()

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const show = () => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setOpen(true), delay)
  }
  const hide = () => {
    window.clearTimeout(timer.current)
    setOpen(false)
  }

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <span aria-describedby={open ? id : undefined}>{children}</span>
      {open && (
        <span
          id={id}
          role="tooltip"
          className={`pointer-events-none absolute left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-zinc-800 text-zinc-200 border border-zinc-700 shadow-elevated whitespace-nowrap max-w-[260px] ${
            side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
          style={{ whiteSpace: 'normal', textAlign: 'center' }}
        >
          {content}
        </span>
      )}
    </span>
  )
}

import { useEffect, useState } from 'react'

/**
 * +N XP float — pops above its anchor on completion events.
 *
 * Trigger pattern (parent owns the visibility flag):
 *   {showXp != null && <XPFloat amount={showXp} onDone={() => setShowXp(null)} />}
 *
 * Renders absolute-positioned so the parent needs `position: relative`. Honors
 * prefers-reduced-motion via the global override in index.css.
 */
export function XPFloat({
  amount,
  onDone,
  className = '',
}: {
  amount: number
  onDone?: () => void
  className?: string
}) {
  const [mounted, setMounted] = useState(true)
  useEffect(() => {
    const t = window.setTimeout(() => {
      setMounted(false)
      onDone?.()
    }, 1200)
    return () => window.clearTimeout(t)
  }, [onDone])

  if (!mounted) return null
  return (
    <span
      className={`pointer-events-none absolute -top-2 right-2 text-[12px] font-bold text-reward whitespace-nowrap animate-xpFloat select-none ${className}`}
      style={{ textShadow: '0 0 12px rgb(245 158 11 / 0.55)' }}
      aria-hidden="true"
    >
      +{amount} XP
    </span>
  )
}

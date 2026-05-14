import type { ReactNode } from 'react'

/**
 * Small categorical pill — labels, tags, category badges.
 * 11px / weight 500 / 0.06em tracking / uppercase, per the design brief.
 *
 * `color` accepts any CSS-var token name in the theme palette (accent, career,
 * health, learning, mind, finance, relationships, common/rare/epic/legendary,
 * success, warning, danger).
 */
interface Props {
  children: ReactNode
  color?: string
  className?: string
}

export function Pill({ children, color = 'accent', className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs uppercase ${className}`}
      style={{
        background: `rgb(var(--${color}) / 0.12)`,
        color: `rgb(var(--${color}))`,
        border: `1px solid rgb(var(--${color}) / 0.30)`,
      }}
    >
      {children}
    </span>
  )
}

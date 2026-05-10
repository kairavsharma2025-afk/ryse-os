import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  color?: string // tailwind colour token name (e.g. 'accent', 'rare')
  className?: string
}

export function Pill({ children, color = 'accent', className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase ${className}`}
      style={{
        background: `rgb(var(--${color}) / 0.15)`,
        color: `rgb(var(--${color}))`,
        border: `1px solid rgb(var(--${color}) / 0.4)`,
      }}
    >
      {children}
    </span>
  )
}

import type { HTMLAttributes, ReactNode } from 'react'

/**
 * Surface card primitive. Default uses shadow-card + hairline border + rounded-2xl
 * for the Ryse design language. The `glow` and `ghost` variants stay for legacy
 * callers (achievement reveals, glass overlays); prefer `default` everywhere new.
 */
interface Props extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glow' | 'ghost' | 'flat'
  children?: ReactNode
}

const VARIANTS: Record<NonNullable<Props['variant']>, string> = {
  default: 'bg-surface border border-border/10 shadow-card',
  flat: 'bg-surface border border-border/10',
  glow: 'bg-surface border border-accent/40 shadow-glow',
  ghost: 'bg-surface/40 border border-border/40 backdrop-blur',
}

export function Card({ variant = 'default', className = '', children, ...rest }: Props) {
  return (
    <div className={`ryse-card rounded-2xl ${VARIANTS[variant]} ${className}`} {...rest}>
      {children}
    </div>
  )
}

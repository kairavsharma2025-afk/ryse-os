import type { HTMLAttributes, ReactNode } from 'react'

interface Props extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glow' | 'ghost'
  children?: ReactNode
}

export function Card({ variant = 'default', className = '', children, ...rest }: Props) {
  const variants = {
    default: 'bg-surface border border-border',
    glow: 'bg-surface border border-accent/40 shadow-glow',
    ghost: 'bg-surface/40 border border-border/40 backdrop-blur',
  }
  return (
    <div
      className={`ryse-card rounded-2xl ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

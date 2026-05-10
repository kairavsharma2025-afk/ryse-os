import type { ReactNode } from 'react'
import type { LucideIcon } from '@/components/icons'

interface Props {
  /** @deprecated use `icon` instead */
  emoji?: string
  icon?: LucideIcon
  title: string
  body?: string
  cta?: ReactNode
}

export function Empty({ emoji, icon: Icon, title, body, cta }: Props) {
  return (
    <div className="text-center py-12 px-6">
      <div className="mb-4 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-surface2/40 border border-border/60 text-accent2 mx-auto">
        {Icon ? (
          <Icon className="w-7 h-7" strokeWidth={1.5} />
        ) : (
          <span className="text-3xl text-muted">{emoji ?? '·'}</span>
        )}
      </div>
      <h3 className="font-display text-xl tracking-wide mb-2">{title}</h3>
      {body && <p className="text-muted text-sm max-w-sm mx-auto leading-relaxed">{body}</p>}
      {cta && <div className="mt-5">{cta}</div>}
    </div>
  )
}

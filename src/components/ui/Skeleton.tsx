import type { CSSProperties } from 'react'

/**
 * Animated shimmer placeholder. Use anywhere data loads — never a spinner.
 *
 * Common shapes:
 *   <Skeleton className="h-4 w-32" />        line of text
 *   <Skeleton className="h-32 w-full" />     card
 *   <Skeleton variant="circle" className="h-10 w-10" />   avatar
 */
interface Props {
  className?: string
  variant?: 'rect' | 'circle' | 'text'
  style?: CSSProperties
}

const SHIMMER_BG =
  'linear-gradient(90deg, rgb(var(--surface2) / 0.4) 0%, rgb(var(--surface2) / 0.9) 50%, rgb(var(--surface2) / 0.4) 100%)'

export function Skeleton({ className = '', variant = 'rect', style }: Props) {
  const radius =
    variant === 'circle' ? 'rounded-full' : variant === 'text' ? 'rounded' : 'rounded-lg'
  return (
    <div
      className={`animate-skeleton ${radius} ${className}`}
      style={{
        background: SHIMMER_BG,
        backgroundSize: '200% 100%',
        ...style,
      }}
      aria-hidden="true"
    />
  )
}

/** A common shape: 3 lines of text. */
export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={`h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  )
}

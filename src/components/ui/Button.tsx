import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'

/**
 * Button primitive. Press feel = scale(0.97) at 80ms; hover is a quiet bg shift
 * (no transform) per the design language — buttons aren't trampolines.
 */
type Variant = 'primary' | 'ghost' | 'danger' | 'subtle' | 'outline'

interface Props extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
  full?: boolean
}

const VAR: Record<Variant, string> = {
  primary:
    'bg-accent text-white hover:bg-accent2 border border-accent/40 shadow-card',
  ghost:
    'bg-surface2/60 text-text hover:bg-surface2 border border-border/10',
  danger:
    'bg-danger text-white hover:opacity-90 border border-danger/40 shadow-card',
  subtle:
    'bg-transparent text-muted hover:text-text hover:bg-surface2/50',
  outline:
    'bg-transparent text-text border border-border/15 hover:border-accent hover:text-accent',
}

const SIZE = {
  sm: 'h-8 px-3 text-sm rounded-md',
  md: 'h-10 px-4 text-sm rounded-lg',
  lg: 'h-12 px-6 text-base rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', full, className = '', children, ...rest },
  ref
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.08 }}
      className={`inline-flex items-center justify-center gap-2 font-medium tracking-tight transition-colors duration-80 ease-out disabled:opacity-50 disabled:pointer-events-none ${VAR[variant]} ${SIZE[size]} ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  )
})

import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'

type Variant = 'primary' | 'ghost' | 'danger' | 'subtle' | 'outline'

interface Props extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
  full?: boolean
}

const VAR: Record<Variant, string> = {
  primary:
    'bg-accent text-bg hover:bg-accent2 shadow-glow border border-accent/40',
  ghost:
    'bg-surface2/50 text-text hover:bg-surface2 border border-border/60',
  danger:
    'bg-red-600/80 text-white hover:bg-red-500 border border-red-500/40',
  subtle:
    'bg-transparent text-muted hover:text-text hover:bg-surface2/50',
  outline:
    'bg-transparent text-text border border-border hover:border-accent hover:text-accent',
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
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.12 }}
      className={`inline-flex items-center justify-center gap-2 font-medium tracking-tight transition-colors disabled:opacity-50 disabled:pointer-events-none ${VAR[variant]} ${SIZE[size]} ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  )
})

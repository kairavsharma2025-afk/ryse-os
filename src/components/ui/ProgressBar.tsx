import { motion } from 'framer-motion'

interface Props {
  value: number
  max?: number
  height?: number
  label?: string
  className?: string
  /** colour token name (e.g. 'accent', 'health') */
  colorVar?: string
  glow?: boolean
}

export function ProgressBar({
  value,
  max = 100,
  height = 8,
  label,
  className = '',
  colorVar = 'accent',
  glow,
}: Props) {
  const pct = Math.max(0, Math.min(1, max === 0 ? 0 : value / max))
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between text-xs text-muted mb-1 font-mono">
          <span>{label}</span>
          <span>{Math.round(pct * 100)}%</span>
        </div>
      )}
      <div
        className="w-full bg-surface2/70 rounded-full overflow-hidden border border-border/40"
        style={{ height }}
      >
        <motion.div
          className="h-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ type: 'spring', damping: 22, stiffness: 110 }}
          style={{
            background: `linear-gradient(90deg, rgb(var(--${colorVar})) 0%, rgb(var(--accent2)) 100%)`,
            boxShadow: glow ? `0 0 16px rgb(var(--${colorVar}) / 0.6)` : undefined,
          }}
        />
      </div>
    </div>
  )
}

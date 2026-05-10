import { motion } from 'framer-motion'

interface Props {
  count?: number
  spread?: number
  duration?: number
  color?: string
}

// Pure-CSS-ish particle burst using motion. Fired from center of parent.
export function Particles({
  count = 24,
  spread = 200,
  duration = 1.2,
  color = 'var(--accent2)',
}: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2
        const r = spread * (0.6 + Math.random() * 0.4)
        const x = Math.cos(angle) * r
        const y = Math.sin(angle) * r
        const size = 4 + Math.random() * 4
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: size,
              height: size,
              background: `rgb(${color})`,
              boxShadow: `0 0 12px rgb(${color})`,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x, y, opacity: 0, scale: 0.4 }}
            transition={{ duration, ease: 'easeOut' }}
          />
        )
      })}
    </div>
  )
}

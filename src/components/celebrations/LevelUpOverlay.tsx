import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { Particles } from '../ui/Particles'

interface Props {
  payload: { oldLevel: number; newLevel: number }
  onDone: () => void
}

export function LevelUpOverlay({ payload, onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative">
        <Particles count={40} spread={300} duration={1.6} color="var(--accent2)" />
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 14, stiffness: 200 }}
          className="text-center px-12"
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[10px] uppercase tracking-[0.4em] text-muted mb-3"
          >
            ──── level up ────
          </motion.div>
          <div className="flex items-center gap-6 justify-center">
            <div className="font-display text-5xl text-muted line-through opacity-60">
              {payload.oldLevel}
            </div>
            <motion.div
              initial={{ scale: 0.6 }}
              animate={{ scale: [0.6, 1.25, 1] }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="font-display text-8xl text-accent drop-shadow-[0_0_40px_rgba(184,148,84,0.7)]"
            >
              {payload.newLevel}
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-4 text-accent2 font-display tracking-wide"
          >
            You crossed a threshold.
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}

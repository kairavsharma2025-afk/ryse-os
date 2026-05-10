import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { Particles } from '../ui/Particles'
import { Sunrise } from 'lucide-react'

interface Props {
  onDone: () => void
}

export function PerfectDayOverlay({ onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/80" />
      <div className="relative text-center">
        <Particles count={50} spread={320} duration={1.4} color="var(--accent2)" />
        <motion.div
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: [0, 1.4, 1], rotate: [-90, 0] }}
          transition={{ duration: 0.7 }}
          className="mb-3 text-accent2 drop-shadow-[0_0_60px_rgba(230,200,130,0.7)]"
        >
          <Sunrise className="w-32 h-32 mx-auto" strokeWidth={1.4} />
        </motion.div>
        <div className="font-display text-5xl text-accent2 tracking-wide">
          PERFECT DAY
        </div>
        <div className="text-muted mt-3 max-w-md mx-auto">
          All three quests completed. +100 bonus XP. Today is gold on the grid.
        </div>
      </div>
    </motion.div>
  )
}

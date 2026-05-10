import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { Crown, Flame } from '@/components/icons'

interface Props {
  payload: { days: number }
  onDone: () => void
}

export function StreakMilestoneOverlay({ payload, onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800)
    return () => clearTimeout(t)
  }, [onDone])

  const isLegendary = payload.days >= 90
  const isInferno = payload.days >= 30

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/80" />
      <div className="relative text-center">
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: [0, 1.5, 1], rotate: [-45, 8, 0] }}
          transition={{ duration: 0.7 }}
          className="leading-none drop-shadow-[0_0_60px_rgba(255,80,0,0.8)]"
          style={{ color: isLegendary ? 'rgb(var(--legendary))' : 'rgb(234 88 12)' }}
        >
          {isLegendary ? (
            <Crown className="w-40 h-40 mx-auto" strokeWidth={1.4} />
          ) : (
            <Flame className="w-40 h-40 mx-auto" strokeWidth={1.4} />
          )}
        </motion.div>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="font-display text-6xl tracking-wide"
          style={{ color: isInferno ? 'rgb(var(--legendary))' : 'rgb(var(--accent2))' }}
        >
          {payload.days}-DAY STREAK
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-3 text-muted tracking-wide"
        >
          {isLegendary
            ? 'You are no longer the same person who started.'
            : isInferno
              ? 'A month. Most people stop. You did not.'
              : 'You showed up. Again. And again. And again.'}
        </motion.div>
      </div>
    </motion.div>
  )
}

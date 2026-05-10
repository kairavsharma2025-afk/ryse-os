import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { useGoals } from '@/stores/goalsStore'
import { Particles } from '../ui/Particles'

interface Props {
  payload: { goalId: string }
  onDone: () => void
}

export function BossDefeatedOverlay({ payload, onDone }: Props) {
  const goal = useGoals((s) => s.goalById(payload.goalId))
  useEffect(() => {
    const t = setTimeout(onDone, 4000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/90 backdrop-blur" />
      <div className="relative">
        <Particles count={70} spread={420} duration={2} color="var(--legendary)" />
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 16 }}
          className="text-center px-12 max-w-xl"
        >
          <div className="text-[10px] uppercase tracking-[0.5em] text-rare mb-2">
            ─── boss defeated ───
          </div>
          <motion.div
            initial={{ rotate: -20, scale: 0.5 }}
            animate={{ rotate: [-20, 12, 0], scale: [0.5, 1.4, 1] }}
            transition={{ duration: 0.8 }}
            className="text-[8rem] mb-3 drop-shadow-[0_0_60px_rgba(250,204,21,0.7)]"
          >
            🛡️
          </motion.div>
          <div className="font-display text-4xl tracking-wide text-legendary mb-3">
            {goal?.bossBattleConfig?.bossName ?? 'The Boss'} falls.
          </div>
          <div className="text-muted leading-relaxed">
            What used to live in your head as fear now lives in the past as victory.
            The shape of you has changed.
          </div>
          <div className="mt-6 text-accent2 text-sm">+800 XP · Loot dropped</div>
        </motion.div>
      </div>
    </motion.div>
  )
}

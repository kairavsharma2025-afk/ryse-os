import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { getAchievement } from '@/data/achievements'
import { Particles } from '../ui/Particles'
import type { Rarity } from '@/types'

const RARITY_COLOR: Record<Rarity, string> = {
  common: 'common',
  rare: 'rare',
  epic: 'epic',
  legendary: 'legendary',
}

interface Props {
  payload: { id: string }
  onDone: () => void
}

export function AchievementOverlay({ payload, onDone }: Props) {
  const ach = getAchievement(payload.id)
  useEffect(() => {
    const t = setTimeout(onDone, 3800)
    return () => clearTimeout(t)
  }, [onDone])

  if (!ach) return null
  const colorVar = RARITY_COLOR[ach.rarity]

  const onShare = async () => {
    const text = `I just earned "${ach.name}" in Ryse — ${ach.description}`
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      /* ignore */
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/85 backdrop-blur" />
      <div className="relative">
        <Particles
          count={ach.rarity === 'legendary' ? 60 : 30}
          spread={ach.rarity === 'legendary' ? 360 : 240}
          duration={1.4}
          color={`var(--${colorVar})`}
        />
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 220 }}
          className={`relative bg-surface rounded-3xl px-10 py-8 text-center max-w-md mx-4 border-2 ${ach.rarity === 'legendary' ? 'shadow-legendary' : 'shadow-glow'}`}
          style={{
            borderColor: `rgb(var(--${colorVar}))`,
          }}
        >
          <div
            className="text-[10px] uppercase tracking-[0.4em] mb-3"
            style={{ color: `rgb(var(--${colorVar}))` }}
          >
            ─── {ach.rarity} achievement unlocked ───
          </div>
          <motion.div
            initial={{ scale: 0.4, rotate: -20 }}
            animate={{ scale: [0.4, 1.3, 1], rotate: [-20, 10, 0] }}
            transition={{ duration: 0.8 }}
            className="text-7xl mb-3"
          >
            {ach.icon}
          </motion.div>
          <div className="font-display text-3xl tracking-wide mb-2">
            {ach.name}
          </div>
          <div className="text-sm text-muted leading-relaxed mb-5">
            {ach.description}
          </div>
          <div className="flex items-center justify-center gap-4 text-xs">
            <span className="text-accent2">+{ach.xpReward} XP</span>
            {ach.unlocksTitle && (
              <span className="text-muted">
                Title: <span className="text-text">{ach.unlocksTitle}</span>
              </span>
            )}
            {ach.unlocksTheme && (
              <span className="text-muted">Theme unlocked</span>
            )}
          </div>
          <button
            onClick={onShare}
            className="mt-5 text-xs text-muted hover:text-text transition"
          >
            Copy share text
          </button>
        </motion.div>
      </div>
    </motion.div>
  )
}

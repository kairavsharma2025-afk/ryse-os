import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useCharacter } from '@/stores/characterStore'
import type { LootType, Rarity } from '@/types'
import { Particles } from '../ui/Particles'
import { Palette, Frame, Scroll, Sparkles } from 'lucide-react'
import type { LucideIcon } from '@/components/icons'

const RARITY_COLOR: Record<Rarity, string> = {
  common: 'common',
  rare: 'rare',
  epic: 'epic',
  legendary: 'legendary',
}

const LOOT_ICON: Record<LootType, LucideIcon> = {
  theme: Palette,
  avatarFrame: Frame,
  title: Scroll,
  quoteSet: Scroll,
  effect: Sparkles,
}

interface Props {
  payload: { lootId: string }
  onDone: () => void
}

export function LootOverlay({ payload, onDone }: Props) {
  const loot = useCharacter((s) => s.loot.find((l) => l.id === payload.lootId))
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const r = setTimeout(() => setRevealed(true), 700)
    const t = setTimeout(onDone, 4200)
    return () => {
      clearTimeout(r)
      clearTimeout(t)
    }
  }, [onDone])

  if (!loot) return null
  const colorVar = RARITY_COLOR[loot.rarity]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/85 backdrop-blur" />
      <div className="relative">
        {revealed && (
          <Particles
            count={loot.rarity === 'legendary' ? 80 : 40}
            spread={loot.rarity === 'legendary' ? 400 : 280}
            duration={1.6}
            color={`var(--${colorVar})`}
          />
        )}
        <div className="text-center" style={{ perspective: '1000px' }}>
          <div className="text-[10px] uppercase tracking-[0.4em] text-muted mb-4">
            ─── loot dropped ───
          </div>
          <motion.div
            initial={{ rotateY: 0, scale: 0.9 }}
            animate={{ rotateY: revealed ? 180 : 0, scale: 1 }}
            transition={{ duration: 0.7, type: 'spring', damping: 18 }}
            style={{ transformStyle: 'preserve-3d' }}
            className="relative w-72 h-96 mx-auto"
          >
            {/* Back */}
            <div
              className="absolute inset-0 rounded-2xl bg-surface border border-border flex items-center justify-center"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="text-6xl opacity-40">?</div>
            </div>
            {/* Front */}
            <div
              className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center px-6 py-8"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                background: `linear-gradient(180deg, rgb(var(--surface)), rgb(var(--${colorVar}) / 0.15))`,
                border: `2px solid rgb(var(--${colorVar}))`,
                boxShadow: `0 0 60px -8px rgb(var(--${colorVar}) / 0.6)`,
              }}
            >
              <div
                className="text-[10px] uppercase tracking-[0.4em] mb-3"
                style={{ color: `rgb(var(--${colorVar}))` }}
              >
                {loot.rarity}
              </div>
              <div
                className="mb-4 inline-flex items-center justify-center w-20 h-20 rounded-2xl"
                style={{
                  background: `rgb(var(--${colorVar}) / 0.15)`,
                  color: `rgb(var(--${colorVar}))`,
                }}
              >
                {(() => {
                  const Icon = LOOT_ICON[loot.type] ?? Sparkles
                  return <Icon className="w-10 h-10" strokeWidth={1.5} />
                })()}
              </div>
              <div className="font-display text-2xl text-center">{loot.name}</div>
              <div className="text-xs text-muted text-center mt-3 leading-relaxed">
                {loot.description}
              </div>
              <div className="text-[10px] text-muted mt-5">From: {loot.source}</div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

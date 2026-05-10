import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useCelebrations } from '@/stores/celebrationStore'
import type { Celebration } from '@/types'
import { LevelUpOverlay } from './LevelUpOverlay'
import { AchievementOverlay } from './AchievementOverlay'
import { LootOverlay } from './LootOverlay'
import { QuestCompleteToast } from './QuestCompleteToast'
import { StreakMilestoneOverlay } from './StreakMilestoneOverlay'
import { BossDefeatedOverlay } from './BossDefeatedOverlay'
import { PerfectDayOverlay } from './PerfectDayOverlay'

// Pulls one celebration at a time. Toasts run alongside heavy overlays.
export function CelebrationHost() {
  const queue = useCelebrations((s) => s.queue)
  const shift = useCelebrations((s) => s.shift)
  const [active, setActive] = useState<Celebration | null>(null)
  const [toast, setToast] = useState<Celebration | null>(null)

  // Pump from queue
  useEffect(() => {
    if (active || queue.length === 0) return
    // questComplete is light → can run as toast even if heavy is active
    const next = queue[0]
    if (next.kind === 'questComplete') {
      setToast(next)
      shift()
      const t = setTimeout(() => setToast(null), 2200)
      return () => clearTimeout(t)
    }
    setActive(next)
    shift()
  }, [queue, active, shift])

  return (
    <>
      <AnimatePresence>
        {active?.kind === 'levelUp' && (
          <LevelUpOverlay
            key={active.id}
            payload={active.payload as { oldLevel: number; newLevel: number }}
            onDone={() => setActive(null)}
          />
        )}
        {active?.kind === 'achievement' && (
          <AchievementOverlay
            key={active.id}
            payload={active.payload as { id: string }}
            onDone={() => setActive(null)}
          />
        )}
        {active?.kind === 'loot' && (
          <LootOverlay
            key={active.id}
            payload={active.payload as { lootId: string }}
            onDone={() => setActive(null)}
          />
        )}
        {active?.kind === 'streakMilestone' && (
          <StreakMilestoneOverlay
            key={active.id}
            payload={active.payload as { days: number }}
            onDone={() => setActive(null)}
          />
        )}
        {active?.kind === 'bossDefeated' && (
          <BossDefeatedOverlay
            key={active.id}
            payload={active.payload as { goalId: string }}
            onDone={() => setActive(null)}
          />
        )}
        {active?.kind === 'perfectDay' && (
          <PerfectDayOverlay key={active.id} onDone={() => setActive(null)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {toast?.kind === 'questComplete' && (
          <QuestCompleteToast
            key={toast.id}
            payload={toast.payload as { id: string; xp: number }}
          />
        )}
      </AnimatePresence>
    </>
  )
}

import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { Pill } from '@/components/ui/Pill'
import { achievementIcon } from '@/components/icons'
import type { Achievement } from '@/types'

/**
 * Single achievement tile. Unlocked entries glow softly in their rarity color
 * (legendary gets the strongest aura). Locked entries fade to a dashed
 * silhouette with a Lock glyph and the hint copy underneath so the player
 * knows what to chase.
 */
export function AchievementCard({
  achievement,
  unlocked,
}: {
  achievement: Achievement
  unlocked: boolean
}) {
  const Icon = achievementIcon(achievement.id, achievement.rarity)
  return (
    <motion.div
      layout
      className={`relative rounded-2xl border p-4 transition-colors ${
        unlocked
          ? 'bg-surface shadow-card'
          : 'bg-surface/40 border-dashed shadow-card'
      }`}
      style={{
        borderColor: unlocked
          ? `rgb(var(--${achievement.rarity}) / 0.4)`
          : 'rgb(var(--border) / 0.5)',
        boxShadow:
          unlocked && achievement.rarity === 'legendary'
            ? `0 0 22px rgb(var(--${achievement.rarity}) / 0.35)`
            : undefined,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: unlocked
              ? `rgb(var(--${achievement.rarity}) / 0.15)`
              : 'rgb(var(--surface2) / 0.6)',
            color: unlocked
              ? `rgb(var(--${achievement.rarity}))`
              : 'rgb(var(--muted) / 0.6)',
          }}
        >
          {unlocked ? (
            <Icon className="w-6 h-6" strokeWidth={1.6} />
          ) : (
            <Lock className="w-5 h-5" strokeWidth={1.6} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className={`font-display text-lg leading-tight ${
                unlocked ? 'text-text' : 'text-muted'
              }`}
            >
              {achievement.name}
            </div>
            <Pill color={achievement.rarity}>{achievement.rarity}</Pill>
          </div>
          {unlocked ? (
            <div className="text-[11px] text-muted leading-relaxed mt-1">
              {achievement.description}
            </div>
          ) : (
            <>
              <div className="text-[9px] uppercase tracking-[0.18em] text-muted/55 mt-1.5">
                How to unlock
              </div>
              <div className="text-[11px] text-muted leading-relaxed mt-0.5">
                {achievement.hint || achievement.description}
              </div>
            </>
          )}
          <div className="text-[10px] mt-2.5 flex items-center gap-2 text-muted">
            <span className="tabular-nums">+{achievement.xpReward} XP</span>
            {achievement.unlocksTitle && (
              <>
                <span className="text-muted/40">·</span>
                <span>title</span>
              </>
            )}
            {achievement.unlocksTheme && (
              <>
                <span className="text-muted/40">·</span>
                <span>theme</span>
              </>
            )}
            {achievement.unlocksFrame && (
              <>
                <span className="text-muted/40">·</span>
                <span>frame</span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

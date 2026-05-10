import { useGoals } from '@/stores/goalsStore'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ProgressBar } from '../ui/ProgressBar'

export function ActiveBoss() {
  const boss = useGoals((s) =>
    s.goals.find(
      (g) =>
        g.isBossBattle &&
        g.bossBattleConfig &&
        !g.bossBattleConfig.defeated &&
        !g.archivedAt
    )
  )
  if (!boss || !boss.bossBattleConfig) return null

  const { bossName, bossDescription, currentHp, bossHp } = boss.bossBattleConfig
  const pct = bossHp === 0 ? 0 : currentHp / bossHp

  return (
    <Link
      to={`/goals/${boss.id}`}
      className="block rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/20 to-surface p-5 relative overflow-hidden hover:border-red-500/60 transition"
    >
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity }}
        className="absolute -top-12 -right-12 w-40 h-40 bg-red-600/30 rounded-full blur-3xl"
      />
      <div className="relative">
        <div className="text-[10px] uppercase tracking-[0.3em] text-red-400/70 mb-1">
          ─── boss battle ───
        </div>
        <div className="font-display text-2xl tracking-wide mb-1">{bossName}</div>
        <div className="text-xs text-muted leading-relaxed mb-4 max-w-md">
          {bossDescription}
        </div>
        <div className="text-[10px] uppercase tracking-wide text-muted mb-1 flex justify-between">
          <span>Boss HP</span>
          <span>{currentHp} / {bossHp}</span>
        </div>
        <ProgressBar value={currentHp} max={bossHp} colorVar="relationships" height={10} glow />
        <div className="mt-3 text-xs text-text/80">
          Each log deals {boss.bossBattleConfig.damagePerLog} damage. Strike today.
        </div>
      </div>
    </Link>
  )
}

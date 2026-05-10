import { useCharacter } from '@/stores/characterStore'
import { xpForLevel, levelFromXp, MAX_LEVEL } from '@/engine/xpEngine'
import { CLASSES } from '@/data/classes'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Pencil, Shield } from '@/components/icons'
import { Avatar } from '@/components/character/Avatar'

export function CharacterHeader() {
  const c = useCharacter()
  const lv = levelFromXp(c.xp)
  const isMax = c.level >= MAX_LEVEL
  const next = isMax ? 0 : xpForLevel(c.level + 1)
  const cls = CLASSES[c.classId]
  const pct = next === 0 ? 0 : Math.max(0, Math.min(1, lv.xpIntoLevel / next))

  return (
    <div className="rounded-2xl bg-surface border border-border p-5 md:p-6 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top right, rgb(var(--accent) / 0.4), transparent 60%)`,
        }}
      />
      <div className="relative flex items-center gap-4 md:gap-6">
        <Link
          to="/profile"
          aria-label="Edit character profile"
          className="group relative shrink-0 rounded-full focus-visible:outline-none"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 18 }}
            whileHover={{ scale: 1.05 }}
            className="rounded-full text-accent transition shadow-glow group-hover:shadow-[0_0_28px_rgb(var(--accent)/0.55)]"
          >
            <Avatar
              id={c.avatar}
              className="w-16 h-16 md:w-20 md:h-20 border-2 border-accent/40 transition group-hover:border-accent"
            />
          </motion.div>
          <span className="pointer-events-none absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-surface border border-accent/60 text-accent flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
            <Pencil className="w-3 h-3" />
          </span>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted mb-0.5">
            {cls.name} · Lv {c.level}{isMax && ' · MAX'}
          </div>
          <div className="font-display text-2xl md:text-3xl tracking-wide truncate">
            {c.name || 'Hero'}
          </div>
          <div className="text-xs text-accent2 mb-3">{c.activeTitle}</div>
          {!isMax && (
            <div>
              <div className="flex justify-between items-baseline text-[11px] text-muted font-mono mb-1">
                <span>
                  <span className="text-accent">{lv.xpIntoLevel}</span>
                  <span className="text-muted/70"> / {next}</span>{' '}
                  <span className="uppercase tracking-wider text-[9px]">XP to Lv {c.level + 1}</span>
                </span>
                <span>{Math.round(pct * 100)}%</span>
              </div>
              <div
                className="w-full h-2 rounded-full overflow-hidden border border-border/60"
                style={{ background: 'rgb(var(--bg) / 0.6)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct * 100}%` }}
                  transition={{ type: 'spring', damping: 22, stiffness: 110 }}
                  style={{
                    background:
                      'linear-gradient(90deg, rgb(var(--accent)) 0%, rgb(var(--accent2)) 100%)',
                    boxShadow: '0 0 12px rgb(var(--accent) / 0.55)',
                  }}
                />
              </div>
            </div>
          )}
        </div>
        <div className="hidden md:flex flex-col items-end gap-1 text-right">
          <div className="text-[10px] uppercase tracking-wide text-muted">Shields</div>
          <div className="flex items-center gap-1.5 text-accent">
            <Shield className="w-5 h-5" strokeWidth={1.6} />
            <span className="font-display text-2xl text-text">×&nbsp;{c.streakShields}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Trophy, Flame, Skull, Sparkles, Pencil } from 'lucide-react'
import { useCharacter } from '@/stores/characterStore'
import { useGoals } from '@/stores/goalsStore'
import { useSeason, currentSeason } from '@/stores/seasonStore'
import { Avatar } from '@/components/character/Avatar'
import { CLASSES } from '@/data/classes'
import { levelFromXp, xpForLevel, MAX_LEVEL } from '@/engine/xpEngine'
import { daysBetween } from '@/engine/dates'

/**
 * The hero panel for the redesigned Life tab. A statement of who the player
 * is right now: avatar at scale, level/class/title, XP-to-next ring, and a
 * four-stat strip beneath that summarises the long-run picture.
 */
export function LifeHero() {
  const c = useCharacter()
  const goals = useGoals((s) => s.goals)
  const season = useSeason()
  const seasonDef = currentSeason()

  const cls = CLASSES[c.classId]
  const lv = levelFromXp(c.xp)
  const isMax = c.level >= MAX_LEVEL
  const need = isMax ? 0 : xpForLevel(c.level + 1)
  const pct = isMax ? 1 : need === 0 ? 0 : Math.max(0, Math.min(1, lv.xpIntoLevel / need))

  const longestStreak = useMemo(
    () => goals.reduce((m, g) => Math.max(m, g.longestStreak), 0),
    [goals]
  )
  const bossWins = useMemo(
    () => goals.filter((g) => g.bossBattleConfig?.defeated).length,
    [goals]
  )

  const daysJourneyed = useMemo(() => {
    if (!c.createdAt) return 0
    return Math.max(1, daysBetween(c.createdAt.slice(0, 10), new Date().toISOString().slice(0, 10)) + 1)
  }, [c.createdAt])

  return (
    <div className="rounded-2xl bg-surface border border-border/10 shadow-card overflow-hidden relative">
      {/* Atmospheric glow keyed to the active season focus area. */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 20% 10%, rgb(var(--${
            seasonDef.focusAreas[0] ?? 'accent'
          }) / 0.4), transparent 55%), radial-gradient(circle at 80% 90%, rgb(var(--accent2) / 0.35), transparent 60%)`,
        }}
      />

      <div className="relative p-5 sm:p-6">
        <div className="flex items-center gap-5">
          <Link
            to="/profile"
            aria-label="Edit profile"
            className="group relative shrink-0 rounded-full focus-visible:outline-none"
          >
            <RingFrame pct={pct} highlight={isMax}>
              <Avatar
                id={c.avatar}
                className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-accent/40 group-hover:border-accent transition"
              />
            </RingFrame>
            <span className="pointer-events-none absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-surface border border-accent/60 text-accent flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <Pencil className="w-3 h-3" />
            </span>
          </Link>

          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted mb-0.5">
              {cls.name} · Lv {c.level}{isMax && ' · MAX'}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl tracking-wide truncate">
              {c.name || 'Hero'}
            </h1>
            <div className="text-xs text-accent2 mt-0.5 mb-2">{c.activeTitle}</div>
            {!isMax ? (
              <div className="text-[11px] text-muted">
                <span className="text-accent tabular-nums">{lv.xpIntoLevel}</span>
                <span className="text-muted/70 tabular-nums"> / {need}</span>{' '}
                XP to Lv {c.level + 1} ·{' '}
                <span className="text-text tabular-nums">{Math.round(pct * 100)}%</span>
              </div>
            ) : (
              <div className="text-[11px] text-success">Maxed. Welcome to the long game.</div>
            )}
          </div>

          <div className="hidden sm:flex flex-col items-end gap-1 text-right shrink-0">
            <div className="text-[10px] uppercase tracking-wide text-muted">Shields</div>
            <div className="flex items-center gap-1.5 text-accent">
              <Shield className="w-5 h-5" strokeWidth={1.6} />
              <span className="font-display text-2xl text-text tabular-nums">
                ×&nbsp;{c.streakShields}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <StatTile
            icon={Trophy}
            label="Achievements"
            value={c.achievements.length}
            sub="unlocked"
          />
          <StatTile
            icon={Flame}
            label="Longest fire"
            value={longestStreak}
            suffix="d"
            sub="any goal, ever"
            tone={longestStreak >= 30 ? 'amber' : undefined}
          />
          <StatTile
            icon={Skull}
            label="Bosses"
            value={bossWins}
            sub="defeated"
          />
          <StatTile
            icon={Sparkles}
            label="Days journeyed"
            value={daysJourneyed}
            sub={`since ${new Date(c.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              year: 'numeric',
            })}`}
          />
        </div>

        {/* Season standing — compact, deep-link to the Season page. */}
        <Link
          to="/season"
          className="mt-4 block rounded-xl border border-border/30 bg-surface2/40 px-3 py-2.5 hover:border-accent/40 transition-colors"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-muted">
                Season {seasonDef.number}
              </div>
              <div className="text-sm text-text truncate">
                {seasonDef.name} · vs {seasonDef.bossName}
              </div>
            </div>
            <div className="text-[11px] text-muted shrink-0 text-right">
              <div>
                Boss HP{' '}
                <span className="tabular-nums text-red-400">
                  {Math.round(
                    100 *
                      Math.max(
                        0,
                        Math.min(1, season.bossHp / Math.max(1, seasonDef.bossInitialHp))
                      )
                  )}
                  %
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}

function RingFrame({
  pct,
  highlight,
  children,
}: {
  pct: number
  highlight: boolean
  children: React.ReactNode
}) {
  const size = 116
  const stroke = 4
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="absolute inset-0 rotate-[-90deg] pointer-events-none"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgb(var(--border) / 0.4)"
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={highlight ? 'rgb(var(--legendary))' : 'rgb(var(--accent))'}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ type: 'spring', damping: 22, stiffness: 110 }}
          style={{
            filter: 'drop-shadow(0 0 10px rgb(var(--accent) / 0.45))',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}

function StatTile({
  icon: Icon,
  label,
  value,
  suffix,
  sub,
  tone,
}: {
  icon: typeof Trophy
  label: string
  value: number
  suffix?: string
  sub?: string
  tone?: 'amber'
}) {
  const valueColor = tone === 'amber' ? 'text-amber-400' : 'text-text'
  return (
    <div className="rounded-xl bg-surface2/40 border border-border/30 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted">
        <Icon className="w-3 h-3" strokeWidth={1.8} />
        <span>{label}</span>
      </div>
      <div className={`font-display text-xl mt-0.5 tabular-nums leading-none ${valueColor}`}>
        {value}
        {suffix && <span className="text-sm text-muted ml-0.5 font-sans">{suffix}</span>}
      </div>
      {sub && <div className="text-[10px] text-muted/80 mt-1 truncate">{sub}</div>}
    </div>
  )
}

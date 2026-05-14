import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Pencil, Check, X as XIcon } from 'lucide-react'
import { Avatar } from '@/components/character/Avatar'
import { useCharacter } from '@/stores/characterStore'
import { CLASSES } from '@/data/classes'
import { CLASS_ICONS } from '@/components/icons'
import { levelFromXp, xpForLevel, MAX_LEVEL } from '@/engine/xpEngine'

/**
 * Profile hero. Builds on the language of LifeHero but adds the full edit
 * affordances since this is the page where the player tweaks their identity:
 *
 *   • Avatar inside an XP ring (jump to AvatarPicker below via a click hint)
 *   • Inline editable name (click pencil → input + Enter to save / Esc to cancel)
 *   • Class badge with class icon
 *   • Active-title <select> — switches the badge subtitle instantly
 *   • Shields tile on the right
 */
export function ProfileHero() {
  const c = useCharacter()
  const cls = CLASSES[c.classId]
  const ClsIcon = CLASS_ICONS[cls.id]
  const lv = levelFromXp(c.xp)
  const isMax = c.level >= MAX_LEVEL
  const next = isMax ? 0 : xpForLevel(c.level + 1)
  const pct = isMax ? 1 : next === 0 ? 0 : Math.max(0, Math.min(1, lv.xpIntoLevel / next))

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(c.name)

  useEffect(() => {
    setDraft(c.name)
  }, [c.name])

  const commit = () => {
    const v = draft.trim()
    if (v && v !== c.name) c.setName(v)
    setEditing(false)
  }
  const cancel = () => {
    setDraft(c.name)
    setEditing(false)
  }

  return (
    <div className="rounded-2xl bg-surface border border-border/10 shadow-card relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 18% 12%, rgb(var(--accent) / 0.4), transparent 55%), radial-gradient(circle at 82% 88%, rgb(var(--accent2) / 0.35), transparent 60%)',
        }}
      />

      <div className="relative p-5 sm:p-6 flex items-start gap-5">
        <RingFrame pct={pct} highlight={isMax}>
          <Avatar
            id={c.avatar}
            className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-accent/40 transition"
          />
        </RingFrame>

        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted mb-0.5 inline-flex items-center gap-2">
            <ClsIcon className="w-3 h-3" strokeWidth={1.8} />
            <span>{cls.name} · Lv {c.level}{isMax && ' · MAX'}</span>
          </div>

          {editing ? (
            <div className="flex items-center gap-2 mt-0.5">
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commit()
                  if (e.key === 'Escape') cancel()
                }}
                className="flex-1 min-w-0 bg-surface2 border border-border/40 rounded-lg px-3 py-1.5 text-2xl sm:text-3xl font-display tracking-wide focus:outline-none focus:border-accent/60"
                placeholder="Your name"
              />
              <button
                onClick={commit}
                aria-label="Save name"
                className="shrink-0 w-9 h-9 rounded-lg bg-accent text-white flex items-center justify-center hover:bg-accent2 transition-colors"
              >
                <Check className="w-4 h-4" strokeWidth={2.4} />
              </button>
              <button
                onClick={cancel}
                aria-label="Cancel"
                className="shrink-0 w-9 h-9 rounded-lg bg-surface2/60 text-muted hover:text-text flex items-center justify-center transition-colors"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl sm:text-4xl tracking-wide truncate">
                {c.name || 'Hero'}
              </h1>
              <button
                onClick={() => setEditing(true)}
                className="shrink-0 w-7 h-7 rounded-md text-muted hover:text-accent hover:bg-surface2/60 flex items-center justify-center"
                aria-label="Edit name"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted">Title</span>
            <select
              value={c.activeTitle}
              onChange={(e) => c.setActiveTitle(e.target.value)}
              className="bg-surface2 border border-border/40 rounded-md px-2 py-1 text-xs text-accent2 focus:outline-none focus:border-accent/60"
            >
              {c.titles.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {!isMax ? (
            <div className="text-[11px] text-muted mt-3">
              <span className="text-accent tabular-nums">{lv.xpIntoLevel}</span>
              <span className="text-muted/70 tabular-nums"> / {next}</span>{' '}
              XP to Lv {c.level + 1} ·{' '}
              <span className="text-text tabular-nums">{Math.round(pct * 100)}%</span>
            </div>
          ) : (
            <div className="text-[11px] text-success mt-3">Maxed. Welcome to the long game.</div>
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

      <div className="relative px-5 sm:px-6 pb-5 pt-1 text-xs text-muted leading-relaxed max-w-2xl">
        {cls.tagline} <span className="text-muted/70">— {cls.description}</span>
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
    <div className="relative shrink-0" style={{ width: size, height: size }}>
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
          style={{ filter: 'drop-shadow(0 0 10px rgb(var(--accent) / 0.45))' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}

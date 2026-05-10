import { useCharacter } from '@/stores/characterStore'
import { AREA_LIST } from '@/data/areas'
import { motion } from 'framer-motion'
import { AREA_ICONS, type LucideIcon } from '@/components/icons'

const SHORT_LABEL: Record<string, string> = {
  relationships: 'Relations',
}

export function WeeklyRings() {
  const stats = useCharacter((s) => s.stats)
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-xl tracking-wide">Weekly Snapshot</h2>
        <span className="text-[10px] text-muted">rolling 30 days</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
        {AREA_LIST.map((a) => {
          const v = stats[a.id]
          const pct = v / 100
          const label = SHORT_LABEL[a.id] ?? a.name
          const Icon = AREA_ICONS[a.id]
          return (
            <div
              key={a.id}
              className="rounded-xl border border-border bg-surface px-2 py-3 flex flex-col items-center min-w-0"
              title={`${a.name}: ${v}/100`}
            >
              <Ring pct={pct} colorVar={a.color} Icon={Icon} />
              <div className="mt-2 text-[9px] sm:text-[10px] uppercase tracking-wide text-muted text-center w-full truncate">
                {label}
              </div>
              <div
                className="text-sm font-mono"
                style={{ color: `rgb(var(--${a.color}))` }}
              >
                {v}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Ring({ pct, colorVar, Icon }: { pct: number; colorVar: string; Icon: LucideIcon }) {
  const radius = 26
  const circ = 2 * Math.PI * radius
  const offset = circ * (1 - pct)
  return (
    <div className="relative w-16 h-16">
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle cx="32" cy="32" r={radius} stroke="rgb(var(--surface2))" strokeWidth="6" fill="none" />
        <motion.circle
          cx="32"
          cy="32"
          r={radius}
          stroke={`rgb(var(--${colorVar}))`}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, type: 'spring', damping: 22 }}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ color: `rgb(var(--${colorVar}))` }}
      >
        <Icon className="w-5 h-5" strokeWidth={1.8} />
      </div>
    </div>
  )
}

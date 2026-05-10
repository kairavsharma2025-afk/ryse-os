import { Link } from 'react-router-dom'
import { isoWeekNumber, isoWeekYear, weekDateRange } from '@/engine/dates'
import { useModules } from '@/stores/modulesStore'

const STATUS_COLOR: Record<string, string> = {
  gray: 'rgb(var(--muted) / 0.4)',
  green: 'rgb(var(--health))',
  amber: 'rgb(var(--finance))',
  gold: 'rgb(var(--legendary))',
  boss: 'rgb(var(--relationships))',
  broken: 'rgb(var(--muted) / 0.2)',
}

export function FiniteMini() {
  const year = isoWeekYear()
  const currentWeek = isoWeekNumber()
  const weeks = useModules((s) =>
    s.finite.weeks.filter((w) => w.isoYear === year)
  )
  const map = new Map(weeks.map((w) => [w.isoWeek, w.status] as const))

  return (
    <Link
      to="/finite"
      className="block rounded-2xl border border-border bg-surface p-4 hover:border-accent/40 transition"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-xl tracking-wide">Finite</h2>
        <span className="text-[10px] uppercase tracking-wide text-muted">
          {year} · week {currentWeek}/52
        </span>
      </div>
      <div
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: 'repeat(26, minmax(0, 1fr))' }}
      >
        {Array.from({ length: 52 }).map((_, i) => {
          const w = i + 1
          const status = map.get(w) ?? 'gray'
          const isCurrent = w === currentWeek
          const isPast = w < currentWeek
          const isFuture = w > currentWeek
          const range = weekDateRange(year, w)
          return (
            <div
              key={w}
              className={`aspect-square rounded-sm transition ${
                isCurrent
                  ? 'ring-2 ring-accent ring-offset-1 ring-offset-surface animate-pulseGlow scale-110'
                  : ''
              } ${isFuture && status === 'gray' ? 'opacity-50' : ''} ${
                isPast && status === 'gray' ? 'opacity-80' : ''
              }`}
              style={{
                background: STATUS_COLOR[status] ?? STATUS_COLOR.gray,
              }}
              title={`Week ${w} · ${range}${status !== 'gray' ? ` · ${status}` : ''}${
                isCurrent ? ' · this week' : ''
              }`}
            />
          )
        })}
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
        <span>Each square is a week. Don't waste them.</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm ring-1 ring-accent inline-block" />
          this week
        </span>
      </div>
    </Link>
  )
}

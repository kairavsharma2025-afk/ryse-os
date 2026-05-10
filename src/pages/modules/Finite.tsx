import { useState } from 'react'
import { useModules } from '@/stores/modulesStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { isoWeekNumber, isoWeekYear, weekDateRange } from '@/engine/dates'
import type { FiniteWeek } from '@/types'
import { actionMarkWeek } from '@/engine/gameLoop'
import { useCharacter } from '@/stores/characterStore'

const STATUS_COLOR: Record<string, string> = {
  gray: 'rgb(var(--muted) / 0.4)',
  green: 'rgb(var(--health))',
  amber: 'rgb(var(--finance))',
  gold: 'rgb(var(--legendary))',
  boss: 'rgb(var(--relationships))',
  broken: 'rgb(var(--muted) / 0.2)',
}
const STATUSES: FiniteWeek['status'][] = ['gray', 'green', 'amber', 'gold', 'boss', 'broken']

export function Finite() {
  const cur = useCharacter((s) => s.createdAt)
  const startYear = new Date(cur || Date.now()).getFullYear()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const weeks = useModules((s) =>
    s.finite.weeks.filter((w) => w.isoYear === year)
  )
  const map = new Map(weeks.map((w) => [w.isoWeek, w] as const))
  const currentWeek = isoWeekNumber()
  const currentYearActual = isoWeekYear()

  const [selected, setSelected] = useState<{ isoYear: number; isoWeek: number } | null>(null)
  const selectedData = selected ? map.get(selected.isoWeek) : undefined

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wide">Finite</h1>
          <p className="text-muted text-sm">52 squares per year. Don't waste them.</p>
        </div>
        <div className="flex gap-2 items-center">
          <Button size="sm" variant="ghost" onClick={() => setYear(year - 1)}>
            ←
          </Button>
          <span className="font-mono">{year}</span>
          <Button size="sm" variant="ghost" onClick={() => setYear(year + 1)}>
            →
          </Button>
        </div>
      </div>

      <Card className="p-5">
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}
        >
          {Array.from({ length: 52 }).map((_, i) => {
            const w = i + 1
            const data = map.get(w)
            const status = data?.status ?? 'gray'
            const isCurrent = year === currentYearActual && w === currentWeek
            const isPast =
              year < currentYearActual ||
              (year === currentYearActual && w < currentWeek)
            const isFuture =
              year > currentYearActual ||
              (year === currentYearActual && w > currentWeek)
            const range = weekDateRange(year, w)
            return (
              <button
                key={w}
                onClick={() => setSelected({ isoYear: year, isoWeek: w })}
                className={`aspect-square rounded transition hover:scale-110 ${
                  isCurrent
                    ? 'ring-2 ring-accent ring-offset-1 ring-offset-surface animate-pulseGlow scale-110'
                    : ''
                } ${isFuture && status === 'gray' ? 'opacity-50' : ''} ${
                  isPast && status === 'gray' ? 'opacity-80' : ''
                }`}
                style={{ background: STATUS_COLOR[status] ?? STATUS_COLOR.gray }}
                title={`Week ${w} · ${range}${status !== 'gray' ? ` · ${status}` : ''}${
                  data?.note ? ` — ${data.note}` : ''
                }${isCurrent ? ' · this week' : ''}`}
              />
            )
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-muted">
          {STATUSES.map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded inline-block"
                style={{ background: STATUS_COLOR[s] }}
              />
              {s}
            </div>
          ))}
        </div>
      </Card>

      {selected && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg">
              {year} · Week {selected.isoWeek}
            </h3>
            <button
              className="text-xs text-muted hover:text-text"
              onClick={() => setSelected(null)}
            >
              close
            </button>
          </div>
          <div className="text-xs text-muted mb-3">
            {selectedData?.note ?? 'Mark this week, honestly.'}
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => {
                  actionMarkWeek({
                    isoYear: selected.isoYear,
                    isoWeek: selected.isoWeek,
                    status: s,
                  })
                }}
                className={`px-3 py-1.5 rounded-full text-xs border ${
                  selectedData?.status === s
                    ? 'border-accent text-accent bg-accent/10'
                    : 'border-border text-muted hover:text-text'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full inline-block mr-1.5"
                  style={{ background: STATUS_COLOR[s] }}
                />
                {s}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-muted mt-3 leading-relaxed">
            Honest gray earns +10 XP. Green +40. Gold (Perfect Week) +80. Boss-battle week tagged in red.
          </div>
        </Card>
      )}

      <Card className="p-5">
        <h3 className="font-display text-lg mb-2">A note</h3>
        <p className="text-sm text-muted leading-relaxed">
          You will live ~4,000 weeks. <span className="text-text">{currentYear - startYear}</span> have passed
          since you opened this app. You have agency over what happens to the rest.
        </p>
      </Card>
    </div>
  )
}

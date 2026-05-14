import { useState } from 'react'
import { ChevronLeft, ChevronRight, X as XIcon } from 'lucide-react'
import { useModules } from '@/stores/modulesStore'
import { Button } from '@/components/ui/Button'
import { isoWeekNumber, isoWeekYear, weekDateRange } from '@/engine/dates'
import { actionMarkWeek } from '@/engine/gameLoop'
import { useCharacter } from '@/stores/characterStore'
import type { FiniteWeek } from '@/types'

const STATUS_COLOR: Record<string, string> = {
  gray: 'rgb(var(--muted) / 0.4)',
  green: 'rgb(var(--health))',
  amber: 'rgb(var(--finance))',
  gold: 'rgb(var(--legendary))',
  boss: 'rgb(var(--relationships))',
  broken: 'rgb(var(--muted) / 0.2)',
}
const STATUSES: FiniteWeek['status'][] = ['gray', 'green', 'amber', 'gold', 'boss', 'broken']

const STATUS_LABEL: Record<FiniteWeek['status'], string> = {
  gray: 'honest gray · +10 XP',
  green: 'green · +40 XP',
  amber: 'amber · +20 XP',
  gold: 'gold week · +80 XP',
  boss: 'boss battle · +50 XP',
  broken: 'broken · +5 XP',
}

export function Finite() {
  const cur = useCharacter((s) => s.createdAt)
  const startYear = new Date(cur || Date.now()).getFullYear()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const weeks = useModules((s) => s.finite.weeks.filter((w) => w.isoYear === year))
  const map = new Map(weeks.map((w) => [w.isoWeek, w] as const))
  const currentWeek = isoWeekNumber()
  const currentYearActual = isoWeekYear()

  const [selected, setSelected] = useState<{ isoYear: number; isoWeek: number } | null>(null)
  const selectedData = selected ? map.get(selected.isoWeek) : undefined

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl tracking-wide">Finite</h1>
          <p className="text-sm text-muted mt-1">
            52 squares per year. Don't waste them.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl bg-surface2/50 border border-border/10 p-1">
          <button
            onClick={() => setYear(year - 1)}
            className="w-8 h-8 rounded-lg text-muted hover:text-text hover:bg-surface2 transition-colors flex items-center justify-center"
            aria-label="Previous year"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono tabular-nums px-2 text-text">{year}</span>
          <button
            onClick={() => setYear(year + 1)}
            className="w-8 h-8 rounded-lg text-muted hover:text-text hover:bg-surface2 transition-colors flex items-center justify-center"
            aria-label="Next year"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="rounded-2xl bg-surface border border-border/10 shadow-card p-5">
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
                className={`aspect-square rounded transition-transform hover:scale-110 ${
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
        <div className="mt-4 flex flex-wrap gap-2.5 text-[11px] text-muted">
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
      </div>

      {selected && (
        <div className="rounded-2xl bg-surface border border-border/10 shadow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg tracking-wide">
              {selected.isoYear} · Week {selected.isoWeek}
              <span className="text-muted text-xs ml-2 font-sans tracking-normal">
                {weekDateRange(selected.isoYear, selected.isoWeek)}
              </span>
            </h2>
            <button
              onClick={() => setSelected(null)}
              className="p-1.5 rounded-md text-muted hover:text-text hover:bg-surface2/50 transition-colors"
              aria-label="Close"
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-xs text-muted mb-3">
            {selectedData?.note ?? 'Mark this week, honestly.'}
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => {
              const active = selectedData?.status === s
              return (
                <button
                  key={s}
                  onClick={() => {
                    actionMarkWeek({
                      isoYear: selected.isoYear,
                      isoWeek: selected.isoWeek,
                      status: s,
                    })
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                    active
                      ? 'border-accent text-accent bg-accent/10'
                      : 'border-border/40 text-muted hover:text-text'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full inline-block mr-1.5"
                    style={{ background: STATUS_COLOR[s] }}
                  />
                  {s}
                </button>
              )
            })}
          </div>
          {selectedData && (
            <div className="text-[11px] text-muted mt-3">
              {STATUS_LABEL[selectedData.status]}
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl bg-surface border border-border/10 shadow-card p-5">
        <h2 className="font-display text-lg tracking-wide mb-2">A note</h2>
        <p className="text-sm text-muted leading-relaxed">
          You will live ~4,000 weeks.{' '}
          <span className="text-text tabular-nums">{currentYear - startYear}</span> have passed since
          you opened this app. You have agency over what happens to the rest.
        </p>
      </div>
    </div>
  )
}

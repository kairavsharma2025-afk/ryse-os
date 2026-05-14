import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import type { RitualLog } from '@/types'
import { buildHeatmap, PERFECT, type HeatCell } from './ritualMath'

/**
 * 13-week (7 × 13) heatmap of ritual completion. Color scale:
 *
 *   0/6     → surface2/40 (empty cell)
 *   1-2/6   → accent/20
 *   3-4/6   → accent/45
 *   5/6     → accent/75
 *   6/6     → accent (full) with success glow
 *
 * Hover (or tap, on mobile) surfaces the tooltip with date + count.
 */
export function RitualHeatmap({ logs }: { logs: RitualLog[] }) {
  const cols = useMemo(() => buildHeatmap(logs, 13), [logs])
  const [hovered, setHovered] = useState<HeatCell | null>(null)

  const stats = useMemo(() => {
    let cells = 0
    let perfect = 0
    let any = 0
    for (const col of cols) {
      for (const cell of col) {
        if (cell.isFuture) continue
        cells++
        if (cell.count >= PERFECT) perfect++
        if (cell.count > 0) any++
      }
    }
    return { cells, perfect, any }
  }, [cols])

  return (
    <div className="rounded-2xl bg-surface border border-border/10 shadow-card p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.28em] text-muted">
            Last 13 weeks
          </div>
          <div className="font-display text-md text-text">
            {stats.perfect} perfect days · {stats.any}/{stats.cells} touched
          </div>
        </div>
        <Legend />
      </div>

      <div
        className="grid gap-1 overflow-x-auto pb-1"
        style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))` }}
        role="img"
        aria-label="Ritual completion heatmap"
      >
        {cols.map((col, ci) => (
          <div key={ci} className="grid grid-rows-7 gap-1">
            {col.map((cell, ri) => (
              <button
                key={ri}
                type="button"
                onMouseEnter={() => setHovered(cell)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(cell)}
                onBlur={() => setHovered(null)}
                className={`aspect-square min-w-[10px] rounded-[3px] transition-transform hover:scale-110 ${
                  cell.isToday ? 'ring-1 ring-accent/70' : ''
                } ${cell.isFuture ? 'opacity-30' : ''}`}
                style={{ background: cellColor(cell) }}
                aria-label={`${cell.date}: ${cell.count}/${PERFECT}`}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-2 h-5 text-[11px] text-muted">
        {hovered ? (
          <span>
            <span className="tabular-nums">
              {format(parseISO(hovered.date), 'EEE, MMM d')}
            </span>
            {' · '}
            <span
              className={
                hovered.count >= PERFECT
                  ? 'text-success'
                  : hovered.count > 0
                    ? 'text-text'
                    : 'text-muted'
              }
            >
              {hovered.count}/{PERFECT}
            </span>
          </span>
        ) : (
          <span className="text-muted/60">Hover a cell for the day.</span>
        )}
      </div>
    </div>
  )
}

function cellColor(cell: HeatCell): string {
  if (cell.isFuture) return 'rgb(var(--surface2) / 0.25)'
  if (cell.count === 0) return 'rgb(var(--surface2) / 0.6)'
  if (cell.count >= PERFECT) return 'rgb(var(--accent))'
  if (cell.count >= 5) return 'rgb(var(--accent) / 0.75)'
  if (cell.count >= 3) return 'rgb(var(--accent) / 0.45)'
  return 'rgb(var(--accent) / 0.2)'
}

function Legend() {
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-muted">
      <span>less</span>
      {[0, 0.2, 0.45, 0.75, 1].map((a) => (
        <span
          key={a}
          className="w-3 h-3 rounded-[3px]"
          style={{
            background: a === 0 ? 'rgb(var(--surface2) / 0.6)' : `rgb(var(--accent) / ${a})`,
          }}
        />
      ))}
      <span>more</span>
    </div>
  )
}

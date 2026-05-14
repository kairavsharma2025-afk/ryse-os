import { useEffect, useState } from 'react'
import { BookHeart } from 'lucide-react'
import { useModules } from '@/stores/modulesStore'
import { Button } from '@/components/ui/Button'
import { actionSaveEulogy, actionSaveValuesScore } from '@/engine/gameLoop'

const DEFAULT_VALUES = [
  'Honesty',
  'Courage',
  'Discipline',
  'Curiosity',
  'Kindness',
  'Patience',
  'Service',
  'Beauty',
  'Family',
  'Freedom',
]

export function Values() {
  const eulogy = useModules((s) => s.values.eulogy)
  const scores = useModules((s) => s.values.scores)
  const lastScore = scores[0]
  const [ratings, setRatings] = useState<Record<string, number>>(lastScore?.ratings ?? {})
  const [body, setBody] = useState(eulogy.body)

  useEffect(() => {
    setBody(eulogy.body)
  }, [eulogy.body])

  const setRating = (k: string, v: number) =>
    setRatings({ ...ratings, [k]: v })

  const ratedCount = Object.values(ratings).filter((v) => v > 0).length

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl tracking-wide">Values &amp; Eulogy</h1>
        <p className="text-sm text-muted mt-1 max-w-prose leading-relaxed">
          Live by what you say you care about, or notice the gap. Write the eulogy, then live it.
        </p>
      </header>

      <div className="rounded-2xl bg-surface border border-border/10 shadow-card p-5">
        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
          <div>
            <h2 className="font-display text-lg tracking-wide">Values check-in</h2>
            <p className="text-xs text-muted mt-0.5">
              0 = not showing up. 10 = embodied this week.
            </p>
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted">
            {ratedCount}/{DEFAULT_VALUES.length} rated
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {DEFAULT_VALUES.map((v) => {
            const r = ratings[v] ?? 0
            return (
              <div
                key={v}
                className="rounded-xl border border-border/30 bg-surface2/30 p-3"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-text">{v}</span>
                  <span className="text-xs font-mono tabular-nums text-accent">{r}/10</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={r}
                  onChange={(e) => setRating(v, Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>
            )
          })}
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={() => actionSaveValuesScore(ratings)}>
            Save check-in (+30 XP)
          </Button>
        </div>
      </div>

      <div className="rounded-2xl bg-surface border border-border/10 shadow-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <BookHeart className="w-4 h-4 text-accent" strokeWidth={1.8} />
          <h2 className="font-display text-lg tracking-wide">Your eulogy</h2>
        </div>
        <p className="text-xs text-muted mb-4 max-w-prose leading-relaxed">
          Write the eulogy you want spoken about you. Then live so that someone could honestly say
          it. Update freely.
        </p>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          placeholder="They were the kind of person who…"
          className="w-full bg-surface2 border border-border/40 rounded-lg px-4 py-3 text-sm leading-relaxed focus:outline-none focus:border-accent/60 transition-colors"
        />
        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
          <div className="text-xs text-muted tabular-nums">
            {body.length} chars
            {body.length < 200 && (
              <span className="text-muted/70">
                {' '}· {200 - body.length} more to unlock "Eulogy Written"
              </span>
            )}
          </div>
          <Button onClick={() => actionSaveEulogy(body)}>Save (+20 XP)</Button>
        </div>
      </div>
    </div>
  )
}

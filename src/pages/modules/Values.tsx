import { useState, useEffect } from 'react'
import { useModules } from '@/stores/modulesStore'
import { Card } from '@/components/ui/Card'
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-wide">Values & Eulogy</h1>
        <p className="text-muted text-sm max-w-prose">
          Live by what you say you care about, or notice the gap. Write the eulogy, then live it.
        </p>
      </div>

      <Card className="p-5">
        <h3 className="font-display text-lg mb-1">Values check-in</h3>
        <p className="text-xs text-muted mb-4">
          0 = not showing up. 10 = embodied this week.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {DEFAULT_VALUES.map((v) => {
            const r = ratings[v] ?? 0
            return (
              <div key={v} className="rounded-lg border border-border bg-surface2/40 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm">{v}</span>
                  <span className="text-xs font-mono text-accent">{r}/10</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={r}
                  onChange={(e) => setRating(v, Number(e.target.value))}
                  className="w-full"
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
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-lg mb-1">Your eulogy</h3>
        <p className="text-xs text-muted mb-4 max-w-prose">
          Write the eulogy you want spoken about you. Then live so that someone could honestly say it.
          Update freely.
        </p>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          placeholder="They were the kind of person who…"
          className="w-full bg-surface2 border border-border rounded-lg px-4 py-3 text-sm leading-relaxed"
        />
        <div className="flex items-center justify-between mt-3">
          <div className="text-xs text-muted">
            {body.length} chars · 200+ unlocks "Eulogy Written"
          </div>
          <Button onClick={() => actionSaveEulogy(body)}>Save (+20 XP)</Button>
        </div>
      </Card>
    </div>
  )
}

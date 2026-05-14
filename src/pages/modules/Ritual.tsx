import { useMemo } from 'react'
import { useModules } from '@/stores/modulesStore'
import { RitualHero } from '@/components/ritual/RitualHero'
import { RitualSteps } from '@/components/ritual/RitualSteps'
import { RitualStats } from '@/components/ritual/RitualStats'
import { RitualHeatmap } from '@/components/ritual/RitualHeatmap'
import { computeRitualMath } from '@/components/ritual/ritualMath'

/**
 * The redesigned Ritual page. Four pieces from top to bottom:
 *
 *   1. RitualHero    — progress ring, streak meta, up-next CTA
 *   2. RitualSteps   — six step rows with per-step 7d strips
 *   3. RitualStats   — current/longest streak, 30d perfect, 7d completion
 *   4. RitualHeatmap — 13×7 GitHub-style grid with tooltip
 *
 * All maths lives in components/ritual/ritualMath so the four pieces can't
 * disagree on what counts as a perfect streak or a perfect day.
 */
export function Ritual() {
  const logs = useModules((s) => s.ritual.logs)
  const math = useMemo(() => computeRitualMath(logs), [logs])

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl tracking-wide">Daily Ritual</h1>
        <p className="text-sm text-muted mt-1">
          Six small things. Done daily, they compound into a different person.
        </p>
      </header>

      <RitualHero math={math} />
      <RitualSteps math={math} />
      <RitualStats math={math} />
      <RitualHeatmap logs={logs} />
    </div>
  )
}

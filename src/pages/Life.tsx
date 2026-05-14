import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { CharacterHeader } from '@/components/character/CharacterHeader'
import { SeasonStrip } from '@/components/home/SeasonStrip'
import { FiniteMini } from '@/components/home/FiniteMini'
import { useCharacter } from '@/stores/characterStore'
import { getAchievement } from '@/data/achievements'
import { Trophy, Sparkles, Calendar, User } from 'lucide-react'

/**
 * Life tab — long-view perspective on the player. Season HP, Finite calendar
 * preview, recent achievements, and a link to the full Profile page. Wave 5
 * fleshes this out with the stats dashboard, journal entries from the Weekly
 * Review flow, and a polished achievement grid.
 */
export function Life() {
  const c = useCharacter()
  const unlocked = c.achievements.slice(-6).reverse()

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs text-muted uppercase tracking-wider mb-1">The long view</div>
        <h1 className="text-xl mb-1">Life</h1>
        <p className="text-sm text-muted leading-relaxed">
          Seasons, achievements, the finite calendar — the bigger story behind today.
        </p>
      </div>

      <SeasonStrip />

      <FiniteMini />

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-accent" strokeWidth={1.8} />
          <h3 className="text-md">Recent achievements</h3>
          <Link
            to="/achievements"
            className="ml-auto text-xs text-accent hover:opacity-80"
          >
            See all →
          </Link>
        </div>
        {unlocked.length === 0 ? (
          <p className="text-sm text-muted">No achievements yet. The next one is closer than it feels.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {unlocked.map((id) => {
              const a = getAchievement(id)
              if (!a) return null
              return (
                <div
                  key={id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/10 bg-surface2/40"
                >
                  <span className="text-2xl">{a.icon}</span>
                  <div className="min-w-0">
                    <div className="text-sm text-text truncate">{a.name}</div>
                    <div className="text-xs text-muted truncate">{a.description}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <User className="w-5 h-5 text-accent" strokeWidth={1.8} />
          <h3 className="text-md">Character</h3>
          <Link to="/profile" className="ml-auto text-xs text-accent hover:opacity-80">
            Open profile →
          </Link>
        </div>
        <CharacterHeader />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/loot"
          className="block p-5 rounded-2xl border border-border/10 bg-surface hover:bg-surface2/60 transition-colors duration-80"
        >
          <Sparkles className="w-5 h-5 text-accent mb-2" strokeWidth={1.8} />
          <div className="text-md mb-0.5">Loot</div>
          <div className="text-xs text-muted">Themes, titles, frames you've earned.</div>
        </Link>
        <Link
          to="/birthdays"
          className="block p-5 rounded-2xl border border-border/10 bg-surface hover:bg-surface2/60 transition-colors duration-80"
        >
          <Calendar className="w-5 h-5 text-accent mb-2" strokeWidth={1.8} />
          <div className="text-md mb-0.5">Birthdays</div>
          <div className="text-xs text-muted">The people Ryse should never let you forget.</div>
        </Link>
      </div>
    </div>
  )
}

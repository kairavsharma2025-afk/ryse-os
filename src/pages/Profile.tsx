import { useMemo } from 'react'
import { Trophy, Sparkles, Calendar, Target } from 'lucide-react'
import { useCharacter } from '@/stores/characterStore'
import { useGoals } from '@/stores/goalsStore'
import { ProfileHero } from '@/components/profile/ProfileHero'
import { AvatarPicker } from '@/components/profile/AvatarPicker'
import { StatsGrid } from '@/components/profile/StatsGrid'

/**
 * Profile — the character editing page. The Life tab is the "long view"
 * (read-only summary); Profile is where you actually edit identity (name,
 * avatar, active title) and inspect the per-area mastery + passives in
 * detail.
 *
 *   ProfileHero   — name, level, title, XP ring, class, shields
 *   AvatarPicker  — full avatar grid
 *   StatsGrid     — six-area stats with mastery passives
 *   Lifetime      — days played, total XP, achievements, active goals
 */
export function Profile() {
  const c = useCharacter()
  const goals = useGoals((s) => s.goals.filter((g) => !g.archivedAt))
  const completed = useGoals((s) => s.goals.filter((g) => !!g.completedAt).length)

  const tiles = useMemo(
    () => [
      { icon: Calendar, label: 'Days played', value: c.daysOpened.length },
      { icon: Sparkles, label: 'Total XP', value: c.xp },
      { icon: Trophy, label: 'Achievements', value: c.achievements.length },
      {
        icon: Target,
        label: 'Goals',
        value: goals.length,
        sub: completed > 0 ? `${completed} completed` : 'active',
      },
    ],
    [c.daysOpened.length, c.xp, c.achievements.length, goals.length, completed]
  )

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl tracking-wide">Profile</h1>
        <p className="text-sm text-muted mt-1">
          Identity, stats, and the long-run scoreboard.
        </p>
      </header>

      <ProfileHero />
      <AvatarPicker />
      <StatsGrid />

      <section className="rounded-2xl bg-surface border border-border/10 shadow-card p-5">
        <h2 className="font-display text-xl tracking-wide mb-4">Lifetime</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {tiles.map((t) => {
            const Icon = t.icon
            return (
              <div
                key={t.label}
                className="rounded-xl border border-border/30 bg-surface2/30 p-3"
              >
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted">
                  <Icon className="w-3 h-3" strokeWidth={1.8} />
                  <span>{t.label}</span>
                </div>
                <div className="font-display text-2xl mt-1 tabular-nums leading-none text-text">
                  {t.value}
                </div>
                {'sub' in t && t.sub && (
                  <div className="text-[10px] text-muted/80 mt-1">{t.sub}</div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

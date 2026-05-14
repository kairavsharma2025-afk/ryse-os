import { Link } from 'react-router-dom'
import {
  Sparkles,
  Cake,
  User,
  BarChart3,
  CalendarRange,
  Telescope,
  Mail,
  MoonStar,
  BookHeart,
  type LucideIcon,
} from 'lucide-react'
import { LifeHero } from '@/components/life/LifeHero'
import { AreaPortrait } from '@/components/life/AreaPortrait'
import { AchievementShowcase } from '@/components/life/AchievementShowcase'
import { SeasonStrip } from '@/components/home/SeasonStrip'
import { FiniteMini } from '@/components/home/FiniteMini'

/**
 * Life tab — the long view. The character is the protagonist; everything
 * underneath is context for the story they're already living.
 *
 *   LifeHero            — who you are right now.
 *   SeasonStrip         — current season, boss HP, days left.
 *   AreaPortrait        — six-area stat bars with 5-dot mastery markers.
 *   FiniteMini          — 52-week calendar preview.
 *   AchievementShowcase — recent unlocks + the next 3 locked.
 *   Inner work rail     — quick deep links into the reflective modules.
 *   Inventory rail      — Loot · Birthdays · Profile · Skills.
 */
export function Life() {
  return (
    <div className="space-y-6">
      <header>
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted mb-1">
          The long view
        </div>
        <h1 className="font-display text-3xl tracking-wide">Life</h1>
        <p className="text-sm text-muted mt-1">
          Seasons, stats, achievements, the inner work — the bigger story behind today.
        </p>
      </header>

      <LifeHero />
      <SeasonStrip />
      <AreaPortrait />
      <FiniteMini />
      <AchievementShowcase />

      <section>
        <div className="text-[10px] uppercase tracking-[0.28em] text-muted mb-2 px-1">
          Inner work
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <QuickLink to="/onedegree" icon={Telescope} label="One Degree" hint="One question, daily." />
          <QuickLink to="/silence" icon={MoonStar} label="Silence" hint="Notice the withdraws." />
          <QuickLink to="/unsent" icon={Mail} label="Unsent" hint="What you'd never send." />
          <QuickLink to="/values" icon={BookHeart} label="Values" hint="Live the eulogy." />
          <QuickLink to="/finite" icon={CalendarRange} label="Finite" hint="52 weeks. Don't waste them." />
        </div>
      </section>

      <section>
        <div className="text-[10px] uppercase tracking-[0.28em] text-muted mb-2 px-1">
          Inventory
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickLink to="/loot" icon={Sparkles} label="Loot" hint="Themes, frames, titles." />
          <QuickLink to="/birthdays" icon={Cake} label="Birthdays" hint="People to never forget." />
          <QuickLink to="/profile" icon={User} label="Profile" hint="Class, theme, avatar." />
          <QuickLink to="/skills" icon={BarChart3} label="Skills" hint="Mastery & passives." />
        </div>
      </section>
    </div>
  )
}

function QuickLink({
  to,
  icon: Icon,
  label,
  hint,
}: {
  to: string
  icon: LucideIcon
  label: string
  hint: string
}) {
  return (
    <Link
      to={to}
      className="block p-4 rounded-2xl border border-border/10 bg-surface shadow-card hover:bg-surface2/60 transition-colors duration-80"
    >
      <Icon className="w-5 h-5 text-accent mb-2" strokeWidth={1.8} />
      <div className="text-sm text-text">{label}</div>
      <div className="text-[11px] text-muted leading-snug">{hint}</div>
    </Link>
  )
}

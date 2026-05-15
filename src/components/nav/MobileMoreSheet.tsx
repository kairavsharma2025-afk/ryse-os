import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarRange,
  Target,
  Sunrise,
  Compass,
  Bell,
  Cake,
  Trophy,
  Gem,
  Brain,
  Crown,
  User,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { useReminders } from '@/stores/remindersStore'
import { useSettings } from '@/stores/settingsStore'
import { upcomingReminders } from '@/engine/remindersEngine'

/**
 * The mobile "More" sheet. With the bottom tab bar collapsed to three slots
 * (Home / More / Settings), every other destination lives here. Sections keep
 * the primary 4 (Plan / Goals / Ritual / Life) up top with a short hint, then
 * group the secondary pages by purpose so it doesn't read as a flat dump.
 */
interface Props {
  open: boolean
  onClose: () => void
}

interface MoreItem {
  to: string
  label: string
  icon: LucideIcon
  desc?: string
}

const SECTIONS: { title: string; items: MoreItem[] }[] = [
  {
    title: 'Plan & track',
    items: [
      { to: '/plan', label: 'Plan', icon: CalendarRange, desc: 'Today, week, inbox' },
      { to: '/goals', label: 'Goals', icon: Target, desc: 'Long-term quests' },
      { to: '/ritual', label: 'Ritual', icon: Sunrise, desc: 'Daily steps' },
      { to: '/life', label: 'Life', icon: Compass, desc: 'Inner work, areas, modules' },
    ],
  },
  {
    title: 'Reminders',
    items: [
      { to: '/reminders', label: 'Reminders', icon: Bell },
      { to: '/birthdays', label: 'Birthdays', icon: Cake },
    ],
  },
  {
    title: 'Progress',
    items: [
      { to: '/achievements', label: 'Achievements', icon: Trophy },
      { to: '/loot', label: 'Loot', icon: Gem },
      { to: '/skills', label: 'Skills', icon: Brain },
      { to: '/season', label: 'Season', icon: Crown },
      { to: '/profile', label: 'Profile', icon: User },
    ],
  },
]

export function MobileMoreSheet({ open, onClose }: Props) {
  const nav = useNavigate()
  const reminders = useReminders((s) => s.reminders)
  const quietHours = useSettings((s) => s.quietHours)
  const dueSoonCount = useMemo(
    () => upcomingReminders(reminders, 2 * 3600_000, undefined, quietHours).length,
    [reminders, quietHours]
  )

  function go(to: string) {
    nav(to)
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="px-4 pb-6 pt-1">
        <div className="text-xs text-muted uppercase tracking-wider mb-4 px-1">Browse</div>

        <div className="space-y-5">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <div className="text-[11px] text-muted uppercase tracking-wider mb-2 px-1">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const badge =
                    item.to === '/reminders' && dueSoonCount > 0 ? dueSoonCount : 0
                  const desc =
                    item.to === '/reminders' && dueSoonCount > 0
                      ? `${dueSoonCount} due in the next 2 hours`
                      : item.desc
                  return (
                    <button
                      key={item.to}
                      type="button"
                      onClick={() => go(item.to)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-surface2/40 hover:bg-surface2 active:bg-surface2/80 border border-border/10 transition-colors duration-80 text-left"
                    >
                      <span className="w-10 h-10 shrink-0 rounded-xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center">
                        <Icon className="w-5 h-5" strokeWidth={1.8} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-md text-text leading-tight">{item.label}</div>
                        {desc && (
                          <div
                            className={`text-xs mt-0.5 truncate ${
                              badge > 0 ? 'text-warning' : 'text-muted'
                            }`}
                          >
                            {desc}
                          </div>
                        )}
                      </div>
                      {badge > 0 && (
                        <span className="text-[10px] bg-warning/15 text-warning border border-warning/30 px-1.5 py-0.5 rounded-full font-bold leading-tight">
                          {badge}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted/60" />
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </BottomSheet>
  )
}

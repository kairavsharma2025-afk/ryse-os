import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import { useCharacter } from '@/stores/characterStore'
import { useSettings } from '@/stores/settingsStore'
import { useNotifications } from '@/stores/notificationsStore'
import { useReminders } from '@/stores/remindersStore'
import { useAssistant } from '@/stores/assistantStore'
import { THEMES } from '@/data/themes'
import { runOpeningTick } from '@/engine/gameLoop'
import { upcomingReminders } from '@/engine/remindersEngine'
import { useReminderEngine } from '@/hooks/useReminderEngine'
import { CelebrationHost } from '@/components/celebrations/CelebrationHost'
import { AssistantPanel } from '@/components/assistant/AssistantPanel'
import { AssistantFab } from '@/components/assistant/AssistantFab'
import { Avatar } from '@/components/character/Avatar'
import { NAV_ICONS, type LucideIcon } from '@/components/icons'
import { Bot } from 'lucide-react'

interface NavItem {
  to: string
  label: string
}
interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Daily',
    items: [
      { to: '/', label: 'Today' },
      { to: '/schedule', label: 'Schedule' },
      { to: '/reminders', label: 'Reminders' },
      { to: '/ritual', label: 'Ritual' },
    ],
  },
  {
    label: 'Progress',
    items: [
      { to: '/goals', label: 'Goals' },
      { to: '/skills', label: 'Skills' },
      { to: '/season', label: 'Season' },
      { to: '/achievements', label: 'Achievements' },
    ],
  },
  {
    label: 'Life',
    items: [
      { to: '/finite', label: 'Finite' },
      { to: '/values', label: 'Values' },
      { to: '/silence', label: 'Silence' },
      { to: '/unsent', label: 'Unsent' },
      { to: '/onedegree', label: 'One Degree' },
    ],
  },
  {
    label: 'Customize',
    items: [
      { to: '/loot', label: 'Loot' },
      { to: '/profile', label: 'Profile' },
      { to: '/settings', label: 'Settings' },
    ],
  },
]

const NAV: NavItem[] = NAV_GROUPS.flatMap((g) => g.items)
const findNav = (to: string): NavItem => NAV.find((n) => n.to === to)!

function NavIcon({ to, className }: { to: string; className?: string }) {
  const Icon: LucideIcon | undefined = NAV_ICONS[to]
  if (!Icon) return null
  return <Icon className={className} />
}

export function Layout() {
  const character = useCharacter()
  const theme = useCharacter((s) => s.activeTheme)
  const settings = useSettings()
  const unread = useNotifications((s) => s.unreadCount())
  const reminders = useReminders((s) => s.reminders)
  const openAssistant = useAssistant((s) => s.setPanelOpen)

  useReminderEngine()

  const dueSoon = useMemo(
    () => upcomingReminders(reminders, 2 * 3600_000, undefined, settings.quietHours).length,
    [reminders, settings.quietHours]
  )
  const badgeFor = (to: string): number => {
    if (to === '/') return unread
    if (to === '/reminders') return dueSoon
    return 0
  }

  useEffect(() => {
    runOpeningTick()
  }, [])

  useEffect(() => {
    const className = THEMES.find((t) => t.id === theme)?.className ?? 'theme-default'
    document.documentElement.classList.forEach((c) => {
      if (c.startsWith('theme-')) document.documentElement.classList.remove(c)
    })
    document.documentElement.classList.add(className)
  }, [theme])

  useEffect(() => {
    if (settings.reduceMotion) {
      document.documentElement.style.setProperty('--motion-scale', '0.3')
    } else {
      document.documentElement.style.removeProperty('--motion-scale')
    }
  }, [settings.reduceMotion])

  return (
    <div className="min-h-full flex">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col w-60 lg:w-64 shrink-0 border-r border-border bg-surface/40 backdrop-blur sticky top-0 h-screen">
        <div className="p-5 border-b border-border">
          <div className="font-display text-2xl tracking-[0.28em] text-accent">
            RYSE
          </div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted mt-1">
            real life · the longest game
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.label} className="space-y-0.5">
              <div className="px-3 mb-1.5 text-[9px] uppercase tracking-[0.32em] text-muted/60 font-mono flex items-center gap-2">
                <span>{group.label}</span>
                <span className="flex-1 h-px bg-border/40" />
              </div>
              {group.items.map((n) => {
                const badge = badgeFor(n.to)
                return (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    end={n.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive
                          ? 'bg-accent/15 text-accent border border-accent/30'
                          : 'text-muted hover:text-text hover:bg-surface2/40 border border-transparent'
                      }`
                    }
                  >
                    <NavIcon to={n.to} className="w-4 h-4 shrink-0" />
                    <span>{n.label}</span>
                    {badge > 0 && (
                      <span className="ml-auto text-[10px] bg-accent text-bg px-1.5 py-0.5 rounded-full font-bold">
                        {badge}
                      </span>
                    )}
                  </NavLink>
                )
              })}
              {gi < NAV_GROUPS.length - 1 && <div className="pt-2" />}
            </div>
          ))}
        </nav>

        <button
          onClick={() => openAssistant(true)}
          className="mx-3 mb-2 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors"
        >
          <Bot className="w-4 h-4 shrink-0" />
          <span className="font-medium">Ask Assistant</span>
          <span className="ml-auto text-[9px] uppercase tracking-wider text-accent/70">GM</span>
        </button>

        <div className="p-3 border-t border-border text-[10px] text-muted">
          <div className="flex items-center gap-2">
            <Avatar id={character.avatar} className="w-7 h-7 border border-border text-accent" />
            <div className="leading-tight">
              <div className="text-text text-xs font-medium">{character.name || 'Hero'}</div>
              <div>Lv {character.level} · {character.activeTitle}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <div className="md:hidden sticky top-0 z-40 bg-surface/80 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="font-display tracking-[0.28em] text-accent">RYSE</div>
          <div className="flex items-center gap-3 text-xs text-muted">
            <button onClick={() => openAssistant(true)} className="text-accent" aria-label="Assistant">
              <Bot className="w-5 h-5" />
            </button>
            <Avatar id={character.avatar} className="w-6 h-6 border border-border text-accent" />
            <span>Lv {character.level}</span>
          </div>
        </div>

        <div className="p-4 md:p-8 max-w-6xl mx-auto pb-32 md:pb-12">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur border-t border-border flex overflow-x-auto">
        {[
          findNav('/'),
          findNav('/schedule'),
          findNav('/reminders'),
          findNav('/ritual'),
          findNav('/goals'),
          findNav('/achievements'),
          findNav('/profile'),
          findNav('/settings'),
        ].map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            className={({ isActive }) =>
              `flex-1 min-w-[4.25rem] flex flex-col items-center justify-center py-2 text-[10px] gap-0.5 ${
                isActive ? 'text-accent' : 'text-muted'
              }`
            }
          >
            <span className="relative">
              <NavIcon to={n.to} className="w-5 h-5" />
              {badgeFor(n.to) > 0 && (
                <span className="absolute -top-1.5 -right-2 text-[8px] bg-accent text-bg px-1 rounded-full font-bold">
                  {badgeFor(n.to)}
                </span>
              )}
            </span>
            <span className="truncate">{n.label}</span>
          </NavLink>
        ))}
      </nav>

      <AssistantPanel />
      <AssistantFab />
      <CelebrationHost />
    </div>
  )
}

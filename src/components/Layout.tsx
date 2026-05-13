import { NavLink, Outlet, useNavigate } from 'react-router-dom'
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
import { SmartNudge } from '@/components/assistant/SmartNudge'
import { Avatar } from '@/components/character/Avatar'
import { TopBar } from '@/components/TopBar'
import { NAV_ICONS, type LucideIcon } from '@/components/icons'
import { Bot, Settings as SettingsIcon } from 'lucide-react'

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
  const nav = useNavigate()

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

  // Auto-grant any unlocked-by-default theme that isn't owned yet (covers existing
  // characters who pre-date themes added later — e.g. Cosmos).
  const unlockTheme = useCharacter((s) => s.unlockTheme)
  const ownedThemes = useCharacter((s) => s.unlockedThemes)
  const setActiveTheme = useCharacter((s) => s.setActiveTheme)
  const activeTheme = useCharacter((s) => s.activeTheme)
  useEffect(() => {
    for (const t of THEMES) {
      if (t.unlockedByDefault && !ownedThemes.includes(t.id)) unlockTheme(t.id)
    }
  }, [ownedThemes, unlockTheme])

  // One-shot: legacy characters were created when 'default' was the only choice.
  // Move them to the new Cosmos look once; if they want Obsidian Dawn back it's
  // one click in Settings → Theme.
  useEffect(() => {
    const KEY = 'lifeos:v1:cosmos_migration_v1'
    try {
      if (localStorage.getItem(KEY)) return
      if (activeTheme === 'default') setActiveTheme('cosmos')
      localStorage.setItem(KEY, '1')
    } catch {
      /* localStorage unavailable — skip */
    }
    // run once per device
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const className = THEMES.find((t) => t.id === theme)?.className ?? 'theme-default'
    document.documentElement.classList.forEach((c) => {
      if (c.startsWith('theme-')) document.documentElement.classList.remove(c)
    })
    document.documentElement.classList.add(className)
  }, [theme])

  useEffect(() => {
    const cls = settings.colorMode === 'light' ? 'mode-light' : 'mode-dark'
    const other = settings.colorMode === 'light' ? 'mode-dark' : 'mode-light'
    document.documentElement.classList.remove(other)
    document.documentElement.classList.add(cls)
  }, [settings.colorMode])

  useEffect(() => {
    if (settings.reduceMotion) {
      document.documentElement.style.setProperty('--motion-scale', '0.3')
    } else {
      document.documentElement.style.removeProperty('--motion-scale')
    }
  }, [settings.reduceMotion])

  return (
    <div className="ryse-shell min-h-full flex md:h-screen md:overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col w-56 lg:w-60 shrink-0 border-r border-border bg-surface/30 backdrop-blur md:h-full">
        <div className="px-5 pt-6 pb-5 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent2 flex items-center justify-center shadow-glow">
            <span className="font-display font-extrabold text-bg text-lg">R</span>
          </div>
          <div className="font-display font-bold text-xl tracking-tight text-text">Ryse</div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-3">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.label} className="space-y-1">
              <div className="px-2 mb-1 text-[9px] uppercase tracking-[0.28em] text-muted/50 font-medium flex items-center gap-2">
                <span>{group.label}</span>
                <span className="flex-1 h-px bg-border/30" />
              </div>
              {group.items.map((n) => {
                const badge = badgeFor(n.to)
                return (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    end={n.to === '/'}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 pr-2 rounded-2xl text-sm transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-accent/15 via-accent/5 to-transparent text-text'
                          : 'text-muted hover:text-text'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={`shrink-0 flex items-center justify-center transition-all ${
                            isActive
                              ? 'w-11 h-11 rounded-2xl bg-gradient-to-br from-accent to-accent2 text-bg shadow-[0_8px_24px_-4px_rgb(96_165_250/0.6)] ring-1 ring-accent/40'
                              : 'w-9 h-9 rounded-xl bg-surface2/40 border border-border/40 text-muted/80 group-hover:text-accent group-hover:border-accent/30 group-hover:bg-surface2/60'
                          }`}
                        >
                          <NavIcon to={n.to} className={isActive ? 'w-5 h-5' : 'w-4 h-4'} />
                        </span>
                        <span className={`${isActive ? 'font-semibold tracking-tight' : ''} truncate`}>
                          {n.label}
                        </span>
                        {badge > 0 && (
                          <span className="ml-auto text-[10px] bg-accent text-bg px-1.5 py-0.5 rounded-full font-bold">
                            {badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                )
              })}
              {gi < NAV_GROUPS.length - 1 && <div className="pt-1" />}
            </div>
          ))}
        </nav>

        <div className="border-t border-border/40 px-3 py-3 space-y-1">
          <button
            onClick={() => openAssistant(true)}
            className="w-full flex items-center gap-3 pr-2 rounded-2xl text-sm text-muted hover:text-text transition-colors group"
          >
            <span className="w-9 h-9 rounded-xl bg-surface2/40 border border-border/40 flex items-center justify-center group-hover:text-accent group-hover:border-accent/30">
              <Bot className="w-4 h-4" />
            </span>
            <span>Ask Assistant</span>
          </button>
          <button
            onClick={() => nav('/settings')}
            className="w-full flex items-center gap-3 pr-2 rounded-2xl text-sm text-muted hover:text-text transition-colors group"
          >
            <span className="w-9 h-9 rounded-xl bg-surface2/40 border border-border/40 flex items-center justify-center group-hover:text-accent group-hover:border-accent/30">
              <SettingsIcon className="w-4 h-4" />
            </span>
            <span>Settings</span>
          </button>
          <button
            onClick={() => nav('/profile')}
            className="w-full flex items-center gap-3 pr-2 rounded-2xl text-sm text-muted hover:text-text transition-colors mt-1"
          >
            <Avatar id={character.avatar} className="w-9 h-9 border border-border text-accent" />
            <div className="leading-tight text-left min-w-0">
              <div className="text-text text-xs font-medium truncate">{character.name || 'Hero'}</div>
              <div className="text-[10px] truncate">Lv {character.level} · {character.activeTitle}</div>
            </div>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col md:h-full md:overflow-y-auto">
        <div className="md:hidden sticky top-0 z-40 bg-surface/80 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-accent2 flex items-center justify-center">
              <span className="font-display font-extrabold text-bg text-sm">R</span>
            </div>
            <div className="font-display font-bold tracking-tight">Ryse</div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted">
            <button onClick={() => openAssistant(true)} className="text-accent" aria-label="Assistant">
              <Bot className="w-5 h-5" />
            </button>
            <Avatar id={character.avatar} className="w-7 h-7 border border-border text-accent" />
            <span>Lv {character.level}</span>
          </div>
        </div>

        <TopBar />

        <div className="px-4 pt-4 pb-32 md:px-8 md:pt-2 md:pb-12 max-w-6xl w-full mx-auto flex-1">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur border-t border-border flex overflow-x-auto pb-[env(safe-area-inset-bottom)]">
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

      <SmartNudge />
      <AssistantPanel />
      <AssistantFab />
      <CelebrationHost />
    </div>
  )
}

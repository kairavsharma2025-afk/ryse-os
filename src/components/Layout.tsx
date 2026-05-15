import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
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
import { AiQuickInput } from '@/components/assistant/AiQuickInput'
import { SmartNudge } from '@/components/assistant/SmartNudge'
import { Avatar } from '@/components/character/Avatar'
import { RyseLogo } from '@/components/RyseLogo'
import { TopBar } from '@/components/TopBar'
import { Tooltip } from '@/components/ui/Tooltip'
import { levelFromXp } from '@/engine/xpEngine'
import { QuickAddFab } from '@/components/quickadd/QuickAddFab'
import { MobileMoreSheet } from '@/components/nav/MobileMoreSheet'
import { NotificationsSheet } from '@/components/nav/NotificationsSheet'
import { ensurePushSubscription, syncPushSchedule } from '@/sync/push'
import {
  Home as HomeIcon,
  CalendarRange,
  Target,
  Sparkles,
  Sunrise,
  Compass,
  Settings as SettingsIcon,
  Bot,
  Bell,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react'

/**
 * Five canonical top-level destinations. Every other page in the app is reached
 * through one of these (or via a deep link from a card on the destination).
 * Order is fixed; if you're tempted to add a sixth, ask whether it belongs
 * under one of these umbrellas first.
 */
interface PrimaryNav {
  to: string
  label: string
  icon: LucideIcon
}

const PRIMARY: PrimaryNav[] = [
  { to: '/',       label: 'Today',  icon: HomeIcon },
  { to: '/plan',   label: 'Plan',   icon: CalendarRange },
  { to: '/goals',  label: 'Goals',  icon: Target },
  { to: '/ritual', label: 'Ritual', icon: Sunrise },
  { to: '/life',   label: 'Life',   icon: Compass },
]

export function Layout() {
  const character = useCharacter()
  const theme = useCharacter((s) => s.activeTheme)
  const settings = useSettings()
  const unread = useNotifications((s) => s.unreadCount())
  const reminders = useReminders((s) => s.reminders)
  const openAssistant = useAssistant((s) => s.setPanelOpen)
  const nav = useNavigate()
  const [moreOpen, setMoreOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  useReminderEngine()

  const dueSoon = useMemo(
    () => upcomingReminders(reminders, 2 * 3600_000, undefined, settings.quietHours).length,
    [reminders, settings.quietHours]
  )

  // Badges feed into the new 5-tab nav. Today carries the unread notif count;
  // Plan inherits the "reminders due soon" count since reminders moved under
  // Plan in the new IA. Goals/Ritual/Life don't surface badges.
  const badgeFor = (to: string): number => {
    if (to === '/') return unread
    if (to === '/plan') return dueSoon
    return 0
  }

  useEffect(() => {
    runOpeningTick()
    // Try to register a push subscription so the server can fire reminders
    // when the tab is closed. No-op if VAPID isn't configured / permission
    // isn't granted / not signed in for sync.
    void ensurePushSubscription()
  }, [])

  // Re-publish the next 48h of reminder + birthday fires whenever the user's
  // reminders change (debounced) so the Vercel cron has the latest schedule.
  useEffect(() => {
    const t = window.setTimeout(() => {
      void syncPushSchedule(reminders, settings.quietHours)
    }, 1500)
    return () => window.clearTimeout(t)
  }, [reminders, settings.quietHours])

  // Auto-grant any unlocked-by-default theme that isn't owned yet.
  const unlockTheme = useCharacter((s) => s.unlockTheme)
  const ownedThemes = useCharacter((s) => s.unlockedThemes)
  const setActiveTheme = useCharacter((s) => s.setActiveTheme)
  const activeTheme = useCharacter((s) => s.activeTheme)
  useEffect(() => {
    for (const t of THEMES) {
      if (t.unlockedByDefault && !ownedThemes.includes(t.id)) unlockTheme(t.id)
    }
  }, [ownedThemes, unlockTheme])

  // One-shot 2026 redesign migration — see Wave 1 commit for context.
  useEffect(() => {
    const KEY = 'lifeos:v1:ryse_theme_migration_v1'
    try {
      if (localStorage.getItem(KEY)) return
      if (activeTheme === 'cosmos' || activeTheme === 'default') setActiveTheme('ryse')
      localStorage.setItem(KEY, '1')
    } catch {
      /* localStorage unavailable */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const className = THEMES.find((t) => t.id === theme)?.className ?? 'theme-ryse'
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
      {/* Desktop sidebar — 5 canonical tabs + Settings at bottom. */}
      <aside className="hidden md:flex md:flex-col w-56 lg:w-60 shrink-0 border-r border-border/10 bg-surface md:h-full">
        <div className="px-5 pt-6 pb-4 flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
            <RyseLogo className="w-6 h-6" />
          </div>
          <div className="font-display font-bold text-md tracking-tight text-text">Ryse</div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-3">
          <div className="space-y-0.5">
            {PRIMARY.map((n) => {
              const Icon = n.icon
              const badge = badgeFor(n.to)
              return (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.to === '/'}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 px-3 h-11 rounded-xl text-sm transition-colors duration-80 ${
                      isActive
                        ? 'bg-accent text-white font-semibold'
                        : 'text-muted hover:text-text hover:bg-surface2/60'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className="w-5 h-5 shrink-0"
                        strokeWidth={isActive ? 2.2 : 1.8}
                      />
                      <span className="truncate">{n.label}</span>
                      {badge > 0 && (
                        <span
                          className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                            isActive ? 'bg-white/25 text-white' : 'bg-accent text-white'
                          }`}
                        >
                          {badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>
        </nav>

        <div className="border-t border-border/10 px-3 py-3 space-y-1">
          <button
            onClick={() => openAssistant(true)}
            className="w-full flex items-center gap-3 px-3 h-11 rounded-xl text-sm text-muted hover:text-text hover:bg-surface2/60 transition-colors duration-80"
          >
            <Sparkles className="w-5 h-5 text-ai" strokeWidth={1.9} />
            <span>Ryse AI</span>
          </button>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-3 h-11 rounded-xl text-sm transition-colors duration-80 ${
                isActive
                  ? 'bg-accent text-white font-semibold'
                  : 'text-muted hover:text-text hover:bg-surface2/60'
              }`
            }
          >
            <SettingsIcon className="w-5 h-5" />
            <span>Settings</span>
          </NavLink>
          <button
            onClick={() => nav('/profile')}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-xl text-sm text-muted hover:text-text hover:bg-surface2/60 transition-colors duration-80 mt-1"
          >
            <Avatar id={character.avatar} className="w-8 h-8 border border-border/10 text-accent" />
            <div className="leading-tight text-left min-w-0 flex-1">
              <div className="text-text text-xs font-medium truncate">{character.name || 'Hero'}</div>
              <div className="text-[11px] text-muted truncate">
                Lv {character.level} ·{' '}
                <Tooltip content="Your current life archetype. It evolves as you level up.">
                  <span className="cursor-help underline decoration-dotted decoration-muted/40 underline-offset-2">
                    {character.activeTitle}
                  </span>
                </Tooltip>
              </div>
              {(() => {
                const info = levelFromXp(character.xp)
                const pct = info.xpForNextLevel === 0 ? 100 : (info.xpIntoLevel / info.xpForNextLevel) * 100
                return (
                  <div className="mt-1.5">
                    <div className="h-1.5 rounded-full bg-surface2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-[width] duration-500"
                        style={{ width: `${pct}%`, background: 'rgb(var(--color-primary))' }}
                      />
                    </div>
                    <div className="text-[10px] text-muted/80 tabular-nums mt-1 truncate">
                      {info.xpIntoLevel} / {info.xpForNextLevel} XP to Lv {character.level + 1}
                    </div>
                  </div>
                )
              })()}
            </div>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col md:h-full md:overflow-y-auto">
        <div className="md:hidden sticky top-0 z-40 bg-surface/85 backdrop-blur-xl border-b border-border/10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
              <RyseLogo className="w-5 h-5" />
            </div>
            <div className="font-display font-bold tracking-tight">Ryse</div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted">
            <button
              type="button"
              onClick={() => setNotifOpen(true)}
              className="relative text-text"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" strokeWidth={1.8} />
              {(unread > 0 || dueSoon > 0) && (
                <span className="absolute -top-1.5 -right-1.5 text-[9px] bg-accent text-white px-1 rounded-full font-bold leading-tight min-w-[14px] text-center">
                  {unread + dueSoon}
                </span>
              )}
            </button>
            <button onClick={() => openAssistant(true)} className="text-accent" aria-label="Assistant">
              <Bot className="w-5 h-5" />
            </button>
            <Avatar id={character.avatar} className="w-7 h-7 border border-border/10 text-accent" />
            <span>Lv {character.level}</span>
          </div>
        </div>

        <TopBar />

        <div className="px-4 pt-4 pb-32 md:px-8 md:pt-2 md:pb-6 max-w-6xl w-full mx-auto flex-1">
          <Outlet />
        </div>

        {/* Persistent AI input. Sits above the mobile bottom-nav (extra
            padding via pb-28 below) and at the bottom of the content area on
            desktop. Opens the existing assistant panel — no duplicate logic. */}
        <div className="px-4 md:px-8 pb-28 md:pb-6 max-w-6xl w-full mx-auto md:sticky md:bottom-0 md:bg-bg/70 md:backdrop-blur-md md:pt-3 md:border-t md:border-border/10">
          <AiQuickInput />
        </div>
      </main>

      {/*
        Mobile bottom-tab bar — three slots only (Home / More / Settings).
        "More" opens a bottom sheet listing every other destination so the
        thumb-reach navigation stays uncluttered. Desktop still gets the full
        5-tab sidebar above.
      */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-border/10 flex pb-[env(safe-area-inset-bottom)]">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors duration-80 ${
              isActive ? 'text-accent' : 'text-muted'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className="relative">
                <HomeIcon className="w-6 h-6" strokeWidth={isActive ? 2.2 : 1.7} />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-2 text-[9px] bg-accent text-white px-1 rounded-full font-bold leading-tight">
                    {unread}
                  </span>
                )}
              </span>
              <span
                className={`text-[10px] transition-opacity duration-80 ${
                  isActive ? 'opacity-100 font-medium' : 'opacity-0'
                }`}
              >
                Home
              </span>
            </>
          )}
        </NavLink>

        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors duration-80 ${
            moreOpen ? 'text-accent' : 'text-muted'
          }`}
          aria-label="More"
        >
          <span className="relative">
            <LayoutGrid className="w-6 h-6" strokeWidth={moreOpen ? 2.2 : 1.7} />
            {dueSoon > 0 && (
              <span className="absolute -top-1 -right-2 text-[9px] bg-accent text-white px-1 rounded-full font-bold leading-tight">
                {dueSoon}
              </span>
            )}
          </span>
          <span
            className={`text-[10px] transition-opacity duration-80 ${
              moreOpen ? 'opacity-100 font-medium' : 'opacity-0'
            }`}
          >
            More
          </span>
        </button>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors duration-80 ${
              isActive ? 'text-accent' : 'text-muted'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <SettingsIcon className="w-6 h-6" strokeWidth={isActive ? 2.2 : 1.7} />
              <span
                className={`text-[10px] transition-opacity duration-80 ${
                  isActive ? 'opacity-100 font-medium' : 'opacity-0'
                }`}
              >
                Settings
              </span>
            </>
          )}
        </NavLink>
      </nav>

      {/*
        Mobile-only AI assistant FAB. Sits opposite the bottom-tab "More"
        slot at the bottom-right corner so it's always one thumb-tap away
        from any screen. Desktop has the Ask Assistant rail entry in the
        sidebar instead.
      */}
      <button
        type="button"
        onClick={() => openAssistant(true)}
        aria-label="Ask Assistant"
        className="md:hidden fixed right-4 bottom-20 z-50 w-14 h-14 rounded-full bg-accent text-white shadow-elevated flex items-center justify-center hover:bg-accent2 active:scale-95 transition-all duration-80"
      >
        <Bot className="w-6 h-6" strokeWidth={2.1} />
      </button>

      <MobileMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
      <NotificationsSheet open={notifOpen} onClose={() => setNotifOpen(false)} />
      <SmartNudge />
      <AssistantPanel />
      <QuickAddFab />
      <CelebrationHost />
    </div>
  )
}

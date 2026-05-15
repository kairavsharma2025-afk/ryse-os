import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'
import { useCharacter } from '@/stores/characterStore'
import { useNotifications } from '@/stores/notificationsStore'
import { useAssistant } from '@/stores/assistantStore'
import { Avatar } from '@/components/character/Avatar'
import { AssistantStatusPill } from '@/components/assistant/AssistantStatusPill'

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Today',
  '/schedule': 'Schedule',
  '/reminders': 'Reminders',
  '/ritual': 'Ritual',
  '/goals': 'Goals',
  '/skills': 'Skills',
  '/season': 'Season',
  '/achievements': 'Achievements',
  '/finite': 'Finite',
  '/values': 'Values',
  '/silence': 'Silence',
  '/unsent': 'Unsent',
  '/onedegree': 'One Degree',
  '/loot': 'Loot',
  '/profile': 'Profile',
  '/settings': 'Settings',
  '/birthdays': 'Birthdays',
  '/privacy': 'Privacy',
}

export function TopBar() {
  const loc = useLocation()
  const nav = useNavigate()
  const character = useCharacter()
  const unread = useNotifications((s) => s.unreadCount())
  const thinking = useAssistant((s) => s.thinking)
  const pageLabel = ROUTE_LABELS[loc.pathname] ?? 'Ryse'

  return (
    <div className="hidden md:flex items-center gap-4 px-8 pt-6 pb-3 sticky top-0 z-20 bg-surface/40 backdrop-blur-md border-b border-border/30">
      {/* page heading only — the date moved into the Today greeting to remove
          the redundant top-right "15 MAY"-style badge. */}
      <div className="flex items-baseline gap-2 min-w-0">
        <h2 className="font-display font-bold text-xl tracking-tight text-text truncate">
          {pageLabel}
        </h2>
        {thinking && (
          <span
            className="inline-block w-2 h-2 rounded-full animate-pulseDot ml-1"
            style={{ background: 'rgb(var(--color-ai))' }}
            title="AI is working…"
            aria-label="AI is working"
          />
        )}
      </div>

      {/* search pill — fills the empty space */}
      <div className="flex-1 max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/70 pointer-events-none" />
          <input
            type="text"
            placeholder="Search goals, reminders, notes…"
            className="w-full bg-surface2/40 border border-border/50 rounded-full pl-9 pr-4 py-2 text-sm placeholder:text-muted/60 focus:outline-none focus:border-accent/50 focus:bg-surface2/70 transition-colors"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        <AssistantStatusPill />
        <button
          onClick={() => nav('/reminders')}
          className="relative w-10 h-10 rounded-full bg-surface2/60 border border-border/60 flex items-center justify-center text-muted hover:text-accent hover:border-accent/40 transition-colors"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[9px] font-bold bg-accent text-bg rounded-full flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
        <button
          onClick={() => nav('/profile')}
          className="w-10 h-10 rounded-full overflow-hidden border-2 border-accent/40 hover:border-accent transition-colors"
          title={character.name || 'Profile'}
          aria-label="Profile"
        >
          <Avatar id={character.avatar} className="w-full h-full text-accent" />
        </button>
      </div>
    </div>
  )
}

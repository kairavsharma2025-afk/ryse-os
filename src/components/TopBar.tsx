import { useLocation, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { Bell, Search, ChevronDown, ChevronRight } from 'lucide-react'
import { useCharacter } from '@/stores/characterStore'
import { useNotifications } from '@/stores/notificationsStore'
import { Avatar } from '@/components/character/Avatar'

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
  const pageLabel = ROUTE_LABELS[loc.pathname] ?? 'Ryse'
  const dateLabel = format(new Date(), 'd MMM').toUpperCase()

  return (
    <div className="hidden md:flex items-center gap-4 px-8 pt-6 pb-2">
      {/* breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted">
        <button
          onClick={() => nav('/')}
          className="hover:text-text transition-colors flex items-center gap-1.5"
        >
          <span className="w-2 h-2 rounded-sm bg-muted/40" />
          <span>Home</span>
        </button>
        <ChevronRight className="w-3 h-3 text-muted/40" />
        <button className="hover:text-text transition-colors flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-muted/40" />
          <span>{pageLabel}</span>
        </button>
        <ChevronRight className="w-3 h-3 text-muted/40" />
        <button className="hover:text-text transition-colors flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface2/40 border border-border/60">
          <span className="w-2 h-2 rounded-sm bg-accent" />
          <span>{dateLabel}</span>
          <ChevronDown className="w-3 h-3" />
        </button>
      </nav>

      <div className="ml-auto flex items-center gap-2.5">
        <button
          className="w-10 h-10 rounded-full bg-surface2/60 border border-border/60 flex items-center justify-center text-muted hover:text-accent hover:border-accent/40 transition-colors"
          title="Search"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>
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

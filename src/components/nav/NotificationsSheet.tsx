import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, BellOff, Check } from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { useNotifications } from '@/stores/notificationsStore'
import { useReminders } from '@/stores/remindersStore'
import { useSettings } from '@/stores/settingsStore'
import { upcomingReminders } from '@/engine/remindersEngine'
import { format } from 'date-fns'

/**
 * Mobile notifications drawer. Shows the unread alert stream from
 * notificationsStore plus a "due soon" rail driven by upcoming reminders.
 * Opens from the bell button in the top bar — that's the affordance behind
 * the bottom-tab badge counts which were previously opaque.
 */
interface Props {
  open: boolean
  onClose: () => void
}

export function NotificationsSheet({ open, onClose }: Props) {
  const list = useNotifications((s) => s.list)
  const markRead = useNotifications((s) => s.markRead)
  const markAllRead = useNotifications((s) => s.markAllRead)
  const reminders = useReminders((s) => s.reminders)
  const quietHours = useSettings((s) => s.quietHours)
  const nav = useNavigate()

  const unread = list.filter((n) => !n.readAt)
  const dueSoon = upcomingReminders(reminders, 2 * 3600_000, undefined, quietHours).slice(0, 6)

  // Auto-mark every queued alert as read once the user has actually seen them.
  // Wait a beat so the unread highlight is visible on entry.
  useEffect(() => {
    if (!open) return
    if (unread.length === 0) return
    const t = window.setTimeout(() => markAllRead(), 1200)
    return () => window.clearTimeout(t)
  }, [open, unread.length, markAllRead])

  function go(path: string) {
    nav(path)
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="px-4 pb-6 pt-1">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="text-xs text-muted uppercase tracking-wider">Notifications</div>
          {unread.length > 0 && (
            <button
              type="button"
              onClick={() => markAllRead()}
              className="text-[11px] text-accent uppercase tracking-wider"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Reminders due in the next 2 hours — what was lurking behind the
            "More" badge previously. */}
        {dueSoon.length > 0 && (
          <div className="mb-5">
            <div className="text-[11px] text-muted uppercase tracking-wider mb-2 px-1">
              Due soon · next 2 hours
            </div>
            <div className="space-y-1">
              {dueSoon.map(({ reminder, at }) => (
                <button
                  key={reminder.id}
                  type="button"
                  onClick={() => go('/reminders')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-warning/8 border border-warning/25 text-left hover:bg-warning/15 transition-colors duration-80"
                >
                  <span className="w-9 h-9 shrink-0 rounded-xl bg-warning/15 text-warning flex items-center justify-center">
                    <Bell className="w-4 h-4" strokeWidth={1.8} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text leading-tight truncate">
                      {reminder.title}
                    </div>
                    <div className="text-[11px] text-muted mt-0.5 tabular-nums">
                      {format(at, 'HH:mm')} · today
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notification stream — quests completed, achievements, boss strikes,
            system messages. */}
        <div>
          <div className="text-[11px] text-muted uppercase tracking-wider mb-2 px-1 flex items-center gap-2">
            <span>Alerts</span>
            {unread.length > 0 && (
              <span className="bg-accent text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold leading-tight">
                {unread.length} new
              </span>
            )}
          </div>

          {list.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted">
              <BellOff className="w-5 h-5 mx-auto mb-2 opacity-50" />
              You're caught up.
            </div>
          ) : (
            <div className="space-y-1">
              {list.slice(0, 20).map((n) => {
                const isUnread = !n.readAt
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      markRead(n.id)
                      onClose()
                    }}
                    className={`w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-colors duration-80 ${
                      isUnread
                        ? 'bg-accent/8 border border-accent/30'
                        : 'bg-surface2/40 border border-border/10 hover:bg-surface2'
                    }`}
                  >
                    <span
                      className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-md ${
                        isUnread ? 'bg-accent/15 text-accent' : 'bg-surface2 text-muted'
                      }`}
                    >
                      {n.emoji ?? <Bell className="w-4 h-4" strokeWidth={1.8} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-text leading-tight">{n.title}</div>
                      {n.body && (
                        <div className="text-[11px] text-muted mt-0.5 leading-snug">
                          {n.body}
                        </div>
                      )}
                      <div className="text-[10px] text-muted/70 mt-1 tabular-nums">
                        {format(new Date(n.createdAt), 'MMM d · HH:mm')}
                      </div>
                    </div>
                    {!isUnread && (
                      <Check className="w-3.5 h-3.5 text-muted/60 shrink-0 mt-1" strokeWidth={2} />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  )
}

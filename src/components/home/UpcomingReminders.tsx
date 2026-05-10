import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { Bell, Clock, Flag } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useReminders } from '@/stores/remindersStore'
import { useSettings } from '@/stores/settingsStore'
import { todaysUpcomingReminders } from '@/engine/remindersEngine'
import { todayISO } from '@/engine/dates'
import { AREAS } from '@/data/areas'

export function UpcomingReminders() {
  const reminders = useReminders((s) => s.reminders)
  const quietHours = useSettings((s) => s.quietHours)
  const nav = useNavigate()
  const next = todaysUpcomingReminders(reminders, todayISO(), undefined, quietHours).slice(0, 3)

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-accent2" strokeWidth={1.8} />
          <h2 className="font-display text-lg tracking-wide">Upcoming Reminders</h2>
        </div>
        <button
          onClick={() => nav('/reminders')}
          className="text-[11px] uppercase tracking-wider text-muted hover:text-accent"
        >
          All reminders →
        </button>
      </div>

      {next.length === 0 ? (
        <div className="text-sm text-muted">Nothing left on the clock today. Quiet roads ahead.</div>
      ) : (
        <ul className="space-y-2">
          {next.map(({ reminder, at }) => {
            const area = AREAS[reminder.category]
            return (
              <li
                key={reminder.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface2/30 px-3 py-2.5"
              >
                <span
                  className="shrink-0 w-1.5 h-9 rounded-full"
                  style={{ background: `rgb(var(--${area.color}))` }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-text truncate flex items-center gap-1.5">
                    {reminder.priority === 'high' && (
                      <Flag className="w-3 h-3 shrink-0 text-red-400" strokeWidth={2.4} />
                    )}
                    <span className="truncate">{reminder.title}</span>
                  </div>
                  <div className="text-[11px] text-muted flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {format(at, 'h:mm a')}
                    <span className="text-muted/50">·</span>
                    {area.name}
                    {reminder.repeat !== 'once' && (
                      <>
                        <span className="text-muted/50">·</span>
                        {reminder.repeat}
                      </>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

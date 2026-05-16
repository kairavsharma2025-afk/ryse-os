import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { differenceInCalendarDays, format } from 'date-fns'
import { Bell, Cake, Moon, ArrowRight, BellRing, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { useSettings } from '@/stores/settingsStore'
import { useBirthdays } from '@/stores/birthdaysStore'
import { SettingsSection } from './SettingsSection'
import { isNative, sendTestNotification } from '@/engine/nativeNotifications'
import { pushReady } from '@/sync/push'

const daysInMonth = (year: number, m1to12: number) => new Date(year, m1to12, 0).getDate()

function nextBirthdayCountdown(b: { month: number; day: number }): {
  label: string
  daysAway: number
} {
  const now = new Date()
  const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const mk = (year: number) =>
    new Date(year, b.month - 1, Math.min(b.day, daysInMonth(year, b.month)))
  let next = mk(now.getFullYear())
  if (next < todayMid) next = mk(now.getFullYear() + 1)
  const n = differenceInCalendarDays(next, todayMid)
  const label = n === 0 ? 'today' : n === 1 ? 'tomorrow' : `in ${n} days`
  return { label, daysAway: n }
}

export function NotificationsSection() {
  const settings = useSettings()
  const birthdays = useBirthdays((s) => s.birthdays)
  const upcoming = useMemo(
    () =>
      [...birthdays]
        .map((b) => ({ b, ...nextBirthdayCountdown(b) }))
        .sort((a, c) => a.daysAway - c.daysAway)
        .slice(0, 4),
    [birthdays]
  )

  const notifPerm: NotificationPermission | 'unsupported' =
    typeof window !== 'undefined' && 'Notification' in window
      ? window.Notification.permission
      : 'unsupported'

  const requestNotifications = async () => {
    const N = typeof window !== 'undefined' ? window.Notification : undefined
    if (!N) return
    const r = await N.requestPermission()
    settings.set('notifications', r === 'granted' ? 'granted' : 'denied')
  }

  const native = isNative()
  const webPushReady = !native && pushReady()
  const [testState, setTestState] = useState<'idle' | 'firing' | 'fired' | 'denied'>('idle')
  const fireTest = async () => {
    setTestState('firing')
    if (native) {
      const r = await sendTestNotification()
      setTestState(r === 'fired' ? 'fired' : 'denied')
    } else {
      // Web — fire a Notification API ping immediately.
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
        setTestState('denied')
      } else {
        new Notification('✅ Ryse test', {
          body: 'Background notifications are wired up.',
          icon: '/pwa-192.png',
        })
        setTestState('fired')
      }
    }
    window.setTimeout(() => setTestState('idle'), 6_000)
  }

  return (
    <SettingsSection
      id="notifications"
      icon={Bell}
      title="Notifications"
      description="How and when Ryse is allowed to interrupt you."
    >
      <div className="space-y-5">
        {/* Native — Android/iOS local-notification status. Shown only on the
            installed apps; the web build sees the browser permission row below. */}
        {native && (
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted mb-2 inline-flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-accent" />
              Background notifications
            </div>
            <div className="text-sm leading-relaxed">
              Ryse schedules reminders as OS alarms so they fire even when the app is closed.
              If you're not seeing them:
            </div>
            <ul className="text-[11px] text-muted leading-relaxed mt-2 list-disc list-inside space-y-0.5">
              <li>Open <span className="text-text">Phone settings → Apps → Ryse → Notifications</span> and make sure they're <span className="text-text">Allowed</span>.</li>
              <li>Then <span className="text-text">Apps → Ryse → Battery</span> → set to <span className="text-text">Unrestricted</span> so Android doesn't kill us before fires.</li>
              <li>On Android 12+: <span className="text-text">Apps → Ryse → Alarms &amp; reminders</span> must be on.</li>
            </ul>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <Button size="sm" onClick={fireTest} disabled={testState === 'firing'}>
                <BellRing className="w-3.5 h-3.5" />
                {testState === 'firing' ? 'Scheduling…' : 'Send a test in 5s'}
              </Button>
              {testState === 'fired' && (
                <span className="text-[11px] text-success">Scheduled — lock your phone now.</span>
              )}
              {testState === 'denied' && (
                <span className="text-[11px] text-danger">Permission denied — enable in phone settings.</span>
              )}
            </div>
          </div>
        )}
        {native && <hr className="border-border/30" />}

        {/* Browser permission row */}
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted mb-2">
            {native ? 'In-app pings' : 'Desktop pings'}
          </div>
          {notifPerm === 'granted' ? (
            <div className="text-sm">
              Status: <span className="text-accent2">Active</span>
              <div className="text-[11px] text-muted mt-0.5">
                {native
                  ? 'Both lock-screen and in-app pings on.'
                  : webPushReady
                  ? 'Lock-screen + desktop pings fire even when this tab is closed.'
                  : 'Pings fire while this tab is open. For background notifications, install Ryse as a PWA (browser menu → Install) or open it on a phone.'}
              </div>
              {!native && (
                <div className="mt-3">
                  <Button size="sm" variant="ghost" onClick={fireTest}>
                    <BellRing className="w-3.5 h-3.5" />
                    Send a test now
                  </Button>
                  {testState === 'fired' && (
                    <span className="text-[11px] text-success ml-2">Sent.</span>
                  )}
                </div>
              )}
            </div>
          ) : notifPerm === 'denied' ? (
            <div className="space-y-2">
              <div className="text-sm">
                Status: <span className="text-red-400">Blocked</span>
              </div>
              <div className="text-[11px] text-muted leading-relaxed">
                Browser notifications are blocked. Click the lock/info icon in your address bar, set
                Notifications to Allow, then reload.
              </div>
              <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
                Reload page
              </Button>
            </div>
          ) : notifPerm === 'unsupported' ? (
            <div className="text-[11px] text-muted">
              This browser doesn't support desktop notifications. In-app still works.
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm">
                  Status: <span className="text-muted">Not enabled</span>
                </div>
                <div className="text-[11px] text-muted mt-0.5">
                  In-app notifications always work. Allow browser notifications for desktop pings.
                </div>
              </div>
              <Button size="sm" onClick={requestNotifications}>
                Enable
              </Button>
            </div>
          )}
        </div>

        <hr className="border-border/30" />

        {/* Quiet hours */}
        <div>
          <Toggle
            checked={!!settings.quietHours}
            onChange={(v) =>
              settings.set('quietHours', v ? { from: '22:00', to: '07:00' } : undefined)
            }
            label={
              <>
                <span className="inline-flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5 text-accent" />
                  Quiet hours
                </span>
              </>
            }
            hint="Anything that would ping in this window waits until it's over."
          />
          {settings.quietHours && (
            <div className="mt-3 grid grid-cols-2 gap-3 max-w-md">
              {(['from', 'to'] as const).map((field) => (
                <div key={field}>
                  <div className="text-[10px] uppercase tracking-wide text-muted mb-1.5 capitalize">
                    {field}
                  </div>
                  <input
                    type="time"
                    value={settings.quietHours![field]}
                    onChange={(e) => {
                      const qh = settings.quietHours
                      if (qh) settings.set('quietHours', { ...qh, [field]: e.target.value })
                    }}
                    className="bg-surface2 border border-border/40 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-accent/60"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <hr className="border-border/30" />

        {/* Birthdays */}
        <div>
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted inline-flex items-center gap-1.5">
              <Cake className="w-3.5 h-3.5 text-accent" />
              Birthdays
            </div>
            <Link
              to="/birthdays"
              className="text-[11px] text-muted hover:text-accent flex items-center gap-1"
            >
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <Toggle
            checked={settings.birthdayNotifications}
            onChange={(v) => settings.set('birthdayNotifications', v)}
            label="Birthday notifications"
            hint="A heads-up the day before and a nudge on the day — never get caught off guard."
          />
          {upcoming.length === 0 ? (
            <div className="text-[11px] text-muted/80 mt-3">
              No birthdays added yet.{' '}
              <Link to="/birthdays" className="text-accent hover:text-accent2">
                Add the people who matter →
              </Link>
            </div>
          ) : (
            <div className={`mt-4 ${settings.birthdayNotifications ? '' : 'opacity-50'}`}>
              <div className="text-[10px] uppercase tracking-wide text-muted mb-2">Up next</div>
              <ul className="space-y-1.5">
                {upcoming.map(({ b, label }) => (
                  <li
                    key={b.id}
                    className="flex items-center gap-3 rounded-lg border border-border/30 bg-surface2/30 px-3 py-2"
                  >
                    <Cake className="w-3.5 h-3.5 text-accent2 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-text truncate">
                        {b.name}
                        {b.relation && <span className="text-muted"> · {b.relation}</span>}
                      </div>
                      <div className="text-[11px] text-muted">
                        {format(
                          new Date(2000, b.month - 1, Math.min(b.day, daysInMonth(2000, b.month))),
                          'MMMM d'
                        )}{' '}
                        · <span className="text-accent2/80">{label}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </SettingsSection>
  )
}

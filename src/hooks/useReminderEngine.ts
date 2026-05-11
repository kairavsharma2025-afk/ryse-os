import { useEffect } from 'react'
import { format, subDays } from 'date-fns'
import { Capacitor } from '@capacitor/core'
import { useReminders } from '@/stores/remindersStore'
import { useSettings } from '@/stores/settingsStore'
import { useNotifications } from '@/stores/notificationsStore'
import { useBirthdays } from '@/stores/birthdaysStore'
import { todayISO } from '@/engine/dates'
import { occursOn, fireTimeOn } from '@/engine/remindersEngine'
import type { Notification as AppNotification } from '@/types'

const TICK_MS = 30_000

function browserNotification(): typeof window.Notification | undefined {
  // On the native apps, OS notifications come from scheduled local notifications, not here.
  if (Capacitor.isNativePlatform()) return undefined
  return typeof window !== 'undefined' ? window.Notification : undefined
}

const daysInMonth = (year: number, month1to12: number) => new Date(year, month1to12, 0).getDate()

/** Polls every 30s; fires desktop + in-app notifications for due reminders and birthdays. */
export function useReminderEngine() {
  useEffect(() => {
    // Ask for notification permission once, on first load.
    const N = browserNotification()
    if (N && useSettings.getState().notifications === 'unknown' && N.permission === 'default') {
      N.requestPermission()
        .then((r) =>
          useSettings.getState().set('notifications', r === 'granted' ? 'granted' : 'denied')
        )
        .catch(() => {})
    }

    const fire = (
      title: string,
      body: string,
      opts: { emoji?: string; type?: AppNotification['type']; ctaLabel?: string; ctaPath?: string } = {}
    ) => {
      const emoji = opts.emoji ?? '⏰'
      const NN = browserNotification()
      if (NN && NN.permission === 'granted' && document.visibilityState === 'visible') {
        // When hidden, the in-app store's push() raises the browser notification.
        try {
          new NN(`${emoji} ${title}`, { body })
        } catch {
          /* ignore */
        }
      }
      useNotifications.getState().push({
        type: opts.type ?? 'system',
        title,
        body,
        emoji,
        ctaLabel: opts.ctaLabel ?? 'Reminders',
        ctaPath: opts.ctaPath ?? '/reminders',
      })
    }

    const tick = () => {
      const now = new Date()
      const today = todayISO()
      const quietHours = useSettings.getState().quietHours
      const yesterday = format(subDays(now, 1), 'yyyy-MM-dd')

      // --- reminders ---
      for (const r of useReminders.getState().reminders) {
        if (r.lastFiredOn === today) continue
        // Check today's occurrence, plus yesterday's in case quiet hours deferred it into today.
        for (const dISO of [yesterday, today]) {
          if (!occursOn(r, dISO)) continue
          const at = fireTimeOn(r, dISO, quietHours)
          if (format(at, 'yyyy-MM-dd') !== today) continue // not actually due today
          if (now.getTime() < at.getTime()) continue // not yet
          useReminders.getState().markFired(r.id, today)
          fire(r.title, r.notes || 'Reminder')
          break
        }
      }

      // --- birthdays --- (clamp Feb 29 → last day of the month in non-leap years)
      if (!useSettings.getState().birthdayNotifications) return
      const m = now.getMonth() + 1
      const d = now.getDate()
      const tmr = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      const tmrM = tmr.getMonth() + 1
      const tmrD = tmr.getDate()
      for (const b of useBirthdays.getState().birthdays) {
        const who = b.relation ? `${b.name} — ${b.relation}` : b.name
        if (b.month === m && d === Math.min(b.day, daysInMonth(now.getFullYear(), b.month))) {
          if (b.lastNotifiedOn === today) continue
          useBirthdays.getState().markNotified(b.id, 'today', today)
          fire(`It’s ${b.name}’s birthday today!`, `Reach out to ${who}.`, {
            emoji: '🎂',
            type: 'context',
            ctaLabel: 'Birthdays',
            ctaPath: '/birthdays',
          })
        } else if (b.month === tmrM && tmrD === Math.min(b.day, daysInMonth(tmr.getFullYear(), b.month))) {
          if (b.lastHeraldedOn === today) continue
          useBirthdays.getState().markNotified(b.id, 'tomorrow', today)
          fire(`${b.name}’s birthday is tomorrow`, `${who} — plan something.`, {
            emoji: '🎂',
            type: 'context',
            ctaLabel: 'Birthdays',
            ctaPath: '/birthdays',
          })
        }
      }
    }

    tick()
    const id = window.setInterval(tick, TICK_MS)
    return () => window.clearInterval(id)
  }, [])
}

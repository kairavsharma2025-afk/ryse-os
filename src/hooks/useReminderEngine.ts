import { useEffect } from 'react'
import { format, subDays } from 'date-fns'
import { useReminders } from '@/stores/remindersStore'
import { useSettings } from '@/stores/settingsStore'
import { useNotifications } from '@/stores/notificationsStore'
import { todayISO } from '@/engine/dates'
import { occursOn, fireTimeOn } from '@/engine/remindersEngine'

const TICK_MS = 30_000

function browserNotification(): typeof window.Notification | undefined {
  return typeof window !== 'undefined' ? window.Notification : undefined
}

/** Polls every 30s; fires desktop + in-app notifications for due reminders. */
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

    const fire = (title: string, body: string) => {
      const NN = browserNotification()
      if (NN && NN.permission === 'granted' && document.visibilityState === 'visible') {
        // When hidden, the in-app store's push() raises the browser notification.
        try {
          new NN(`⏰ ${title}`, { body })
        } catch {
          /* ignore */
        }
      }
      useNotifications.getState().push({
        type: 'system',
        title,
        body,
        emoji: '⏰',
        ctaLabel: 'Reminders',
        ctaPath: '/reminders',
      })
    }

    const tick = () => {
      const now = new Date()
      const today = todayISO()
      const quietHours = useSettings.getState().quietHours
      const yesterday = format(subDays(now, 1), 'yyyy-MM-dd')
      const reminders = useReminders.getState().reminders
      for (const r of reminders) {
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
    }

    tick()
    const id = window.setInterval(tick, TICK_MS)
    return () => window.clearInterval(id)
  }, [])
}

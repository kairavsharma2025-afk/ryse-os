// On the native (Capacitor) apps, schedule reminders & birthdays as real OS local
// notifications so they fire even when the app is closed. No-op on the web — there the
// 30s in-app ticker (useReminderEngine) handles notifications instead.

import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { addDays, format } from 'date-fns'
import { useReminders } from '@/stores/remindersStore'
import { useBirthdays } from '@/stores/birthdaysStore'
import { useSettings } from '@/stores/settingsStore'
import { fireTimeOn, nextFireTime, occursOn } from './remindersEngine'
import type { Reminder } from '@/types'

export const isNative = () => Capacitor.isNativePlatform()
const isAndroid = () => Capacitor.getPlatform() === 'android'

type Every = 'day' | 'week' | 'month' | 'year'

const REPEAT_TO_EVERY: Partial<Record<Reminder['repeat'], Every>> = {
  daily: 'day',
  weekly: 'week',
  monthly: 'month',
  yearly: 'year',
}

// Stable 31-bit positive int from a string — Capacitor notification ids must be 32-bit ints.
function hashId(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0
  return (h & 0x7fffffff) || 1
}

const daysInMonth = (year: number, m1to12: number) => new Date(year, m1to12, 0).getDate()
function nextBirthdayDate(b: { month: number; day: number }, from: Date): Date {
  const mk = (year: number) => {
    const d = new Date(year, b.month - 1, Math.min(b.day, daysInMonth(year, b.month)))
    d.setHours(9, 0, 0, 0)
    return d
  }
  let d = mk(from.getFullYear())
  if (d.getTime() <= from.getTime()) d = mk(from.getFullYear() + 1)
  return d
}

// Walks the next `max` future occurrences of `r` from `from`.
function collectOccurrences(
  r: Reminder,
  from: Date,
  qh: { from: string; to: string } | undefined,
  max: number,
): Date[] {
  const out: Date[] = []
  for (let off = -1; off <= 400 && out.length < max; off++) {
    const iso = format(addDays(from, off), 'yyyy-MM-dd')
    if (!occursOn(r, iso)) continue
    const at = fireTimeOn(r, iso, qh)
    if (at.getTime() < from.getTime() - 60_000) continue
    out.push(at)
    if (r.repeat === 'once') break
  }
  return out
}

interface ScheduledItem {
  id: number
  title: string
  body: string
  at: Date
  every?: Every
}

function buildSchedule(): ScheduledItem[] {
  const now = new Date()
  const quietHours = useSettings.getState().quietHours
  const android = isAndroid()
  const out: ScheduledItem[] = []
  for (const r of useReminders.getState().reminders) {
    if (r.done) continue
    const every = r.snoozedUntil ? undefined : REPEAT_TO_EVERY[r.repeat]
    if (android && every) {
      // Doze workaround: passing `every` to the plugin makes it call AlarmManager.setRepeating,
      // which is suspended during Doze and won't fire when the app is closed/phone is idle.
      // Expand into one-shot occurrences so the plugin uses setExactAndAllowWhileIdle instead.
      const occs = collectOccurrences(r, now, quietHours, 7)
      for (const at of occs) {
        out.push({
          id: hashId(`r:${r.id}:${at.getTime()}`),
          title: `⏰ ${r.title}`,
          body: r.notes || 'Reminder',
          at,
        })
      }
    } else {
      const at = nextFireTime(r, now, quietHours)
      if (!at) continue
      out.push({
        id: hashId(`r:${r.id}`),
        title: `⏰ ${r.title}`,
        body: r.notes || 'Reminder',
        at,
        every,
      })
    }
  }
  if (useSettings.getState().birthdayNotifications) {
    for (const b of useBirthdays.getState().birthdays) {
      const at = nextBirthdayDate(b, now)
      out.push({
        id: hashId(`b:${b.id}`),
        title: `🎂 ${b.name}’s birthday`,
        body: b.relation ? `Reach out — ${b.relation}.` : `Reach out to ${b.name}.`,
        at,
        // On Android we re-schedule on every app open, so one-shot is fine. On iOS the yearly
        // repeat is honoured natively by UNCalendarNotificationTrigger.
        every: android ? undefined : 'year',
      })
    }
  }
  // iOS keeps at most 64 pending notifications.
  return out.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, 60)
}

let permissionAsked = false
async function ensurePermission(): Promise<boolean> {
  try {
    const cur = await LocalNotifications.checkPermissions()
    if (cur.display === 'granted') return true
    if (cur.display === 'denied' || permissionAsked) return false
    permissionAsked = true
    const r = await LocalNotifications.requestPermissions()
    return r.display === 'granted'
  } catch {
    return false
  }
}

let running = false
let queued = false
export async function syncNativeNotifications(): Promise<void> {
  if (!isNative()) return
  if (running) {
    queued = true
    return
  }
  running = true
  try {
    if (!(await ensurePermission())) return
    const pending = await LocalNotifications.getPending()
    if (pending.notifications.length) {
      await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) })
    }
    const items = buildSchedule()
    if (items.length) {
      await LocalNotifications.schedule({
        notifications: items.map((it) => ({
          id: it.id,
          title: it.title,
          body: it.body,
          schedule: { at: it.at, allowWhileIdle: true, ...(it.every ? { every: it.every } : {}) },
        })),
      })
    }
  } catch {
    /* best-effort */
  } finally {
    running = false
    if (queued) {
      queued = false
      void syncNativeNotifications()
    }
  }
}

// Re-sync whenever reminders or birthdays change (no-op on web).
if (typeof window !== 'undefined') {
  useReminders.subscribe(() => void syncNativeNotifications())
  useBirthdays.subscribe(() => void syncNativeNotifications())
  useSettings.subscribe((s, prev) => {
    if (s.birthdayNotifications !== prev.birthdayNotifications) void syncNativeNotifications()
  })
}

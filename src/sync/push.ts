// Web Push subscription + schedule sync. The server's Vercel cron
// (api/cron/push-dispatch) picks up scheduled pushes as their fire_at arrives
// and dispatches a notification to every active subscription. This module is
// the client side of that contract:
//
//   • ensurePushSubscription() — runs once after the user grants permission,
//     registers a PushManager subscription, and POSTs it to /api/push.
//   • syncPushSchedule(reminders, quietHours) — recomputes the next 48h of
//     reminder fires and PUTs them as a replace-all schedule.
//
// Everything no-ops gracefully if VAPID isn't configured, the browser lacks
// the Push API, the user hasn't granted notification permission, or the sync
// account isn't signed in.

import { format } from 'date-fns'
import type { Reminder } from '@/types'
import type { QuietHours } from '@/engine/remindersEngine'
import { upcomingReminders } from '@/engine/remindersEngine'
import { useBirthdays } from '@/stores/birthdaysStore'
import { todayISO } from '@/engine/dates'
import { syncEnabled, getSyncToken } from './client'

const VAPID_PUBLIC = (import.meta.env.VITE_VAPID_PUBLIC_KEY ?? '') as string
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')
const SCHEDULE_HORIZON_MS = 48 * 3600_000

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

function pushHeaders(): Record<string, string> | null {
  const token = getSyncToken()
  if (!token) return null
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

export function pushReady(): boolean {
  if (typeof window === 'undefined') return false
  if (!('serviceWorker' in navigator)) return false
  if (!('PushManager' in window)) return false
  if (!VAPID_PUBLIC) return false
  if (typeof Notification === 'undefined') return false
  if (Notification.permission !== 'granted') return false
  if (!syncEnabled()) return false
  return true
}

export async function ensurePushSubscription(): Promise<void> {
  if (!pushReady()) return
  const headers = pushHeaders()
  if (!headers) return
  try {
    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      const key = urlBase64ToUint8Array(VAPID_PUBLIC)
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // TS narrows applicationServerKey to BufferSource with ArrayBuffer
        // specifically; cast through unknown to satisfy lib.dom.
        applicationServerKey: key as unknown as BufferSource,
      })
    }
    const json = sub.toJSON() as {
      endpoint?: string
      keys?: { p256dh?: string; auth?: string }
    }
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return
    await fetch(`${API_BASE}/api/push`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      }),
    })
  } catch (err) {
    console.warn('[push] subscribe failed', err)
  }
}

interface ScheduledPushInput {
  ref: string
  fireAt: string
  title: string
  body?: string
  url?: string
}

function buildReminderPushes(reminders: Reminder[], quietHours?: QuietHours): ScheduledPushInput[] {
  const upcoming = upcomingReminders(reminders, SCHEDULE_HORIZON_MS, undefined, quietHours)
  return upcoming.map(({ reminder, at }) => ({
    ref: `reminder:${reminder.id}:${format(at, "yyyy-MM-dd'T'HH:mm")}`,
    fireAt: at.toISOString(),
    title: `⏰ ${reminder.title}`,
    body: reminder.notes || 'Reminder',
    url: '/reminders',
  }))
}

function buildBirthdayPushes(): ScheduledPushInput[] {
  const out: ScheduledPushInput[] = []
  const list = useBirthdays.getState().birthdays
  const now = new Date()
  const today = todayISO()
  // Look ahead 2 days. Birthdays fire at 09:00 local time on the day-of, with
  // an additional heads-up the day before.
  for (let dayOff = 0; dayOff <= 2; dayOff++) {
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOff, 9, 0)
    if (target.getTime() < now.getTime() - 60_000) continue
    const tM = target.getMonth() + 1
    const tD = target.getDate()
    const targetIso = format(target, 'yyyy-MM-dd')
    for (const b of list) {
      if (b.month === tM && b.day === tD) {
        out.push({
          ref: `birthday:${b.id}:${targetIso}:today`,
          fireAt: target.toISOString(),
          title: `🎂 It's ${b.name}'s birthday`,
          body: b.relation ? `${b.name} — ${b.relation}` : `Reach out to ${b.name}.`,
          url: '/birthdays',
        })
      }
      // Day-before heads-up: the reminder fires "today" for tomorrow's b-day.
      const heralded = new Date(target.getFullYear(), target.getMonth(), target.getDate() - 1, 9, 0)
      if (b.month === tM && b.day === tD && heralded.getTime() > now.getTime() - 60_000 && format(heralded, 'yyyy-MM-dd') >= today) {
        out.push({
          ref: `birthday:${b.id}:${targetIso}:herald`,
          fireAt: heralded.toISOString(),
          title: `🎂 ${b.name}'s birthday is tomorrow`,
          body: b.relation ? `${b.name} — ${b.relation}` : `Plan something for ${b.name}.`,
          url: '/birthdays',
        })
      }
    }
  }
  return out
}

export async function syncPushSchedule(
  reminders: Reminder[],
  quietHours?: QuietHours
): Promise<void> {
  if (!pushReady()) return
  const headers = pushHeaders()
  if (!headers) return
  const pushes = [...buildReminderPushes(reminders, quietHours), ...buildBirthdayPushes()]
  try {
    await fetch(`${API_BASE}/api/push`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ pushes }),
    })
  } catch (err) {
    console.warn('[push] schedule sync failed', err)
  }
}

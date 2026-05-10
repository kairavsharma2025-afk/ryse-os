// "Uber-style" proactive nudges derived from today's schedule (a side time-management
// feature — not on the dashboard):
//  - it's almost time to leave the office → offer a ride home
//  - the office block is about to start → offer a ride in
// Dismissals + browser-notified state are tracked per day in localStorage.

import { format } from 'date-fns'
import { loadJSON, saveJSON } from '@/stores/persist'
import { todayISO } from './dates'
import type { ScheduleEvent } from '@/types'

export type NudgeKey = 'leave-office' | 'ride-to-work'

export interface ActiveNudge {
  key: NudgeKey
  emoji: string
  title: string
  body: string
}

const DISMISS_KEY = 'nudges_dismissed'
const NOTIFIED_KEY = 'nudges_notified'
type DayMap = Record<string, string> // nudgeKey -> YYYY-MM-DD

const getMap = (k: string): DayMap => loadJSON<DayMap>(k, {})
const stampToday = (k: string, key: string) => {
  const m = getMap(k)
  m[key] = todayISO()
  saveJSON(k, m)
}

export const dismissNudge = (key: NudgeKey) => stampToday(DISMISS_KEY, key)
export const isDismissedToday = (key: NudgeKey) => getMap(DISMISS_KEY)[key] === todayISO()
export const markNotified = (key: NudgeKey) => stampToday(NOTIFIED_KEY, key)
export const wasNotifiedToday = (key: NudgeKey) => getMap(NOTIFIED_KEY)[key] === todayISO()

const MIN = 60_000
const OFFICE_RE = /\boffice\b|\bwork\b|\bcommute\b/i

function hmToDate(hm: string, base: Date): Date {
  const [h, m] = hm.split(':').map((n) => Number(n) || 0)
  const d = new Date(base)
  d.setHours(h, m, 0, 0)
  return d
}

export interface OfficeWindow {
  start: string
  end: string
}

/** The span the player is "at the office" today, or null if there's no office block. */
export function todaysOfficeWindow(events: ScheduleEvent[], todayDate: string): OfficeWindow | null {
  const career = events.filter((e) => e.date === todayDate && e.category === 'career')
  const office = career.filter((e) => OFFICE_RE.test(e.title))
  if (office.length === 0) return null
  const start = office.reduce((a, e) => (e.startTime < a ? e.startTime : a), office[0].startTime)
  let end = office.reduce((a, e) => (e.endTime > a ? e.endTime : a), office[0].endTime)
  // Extend the end through any back-to-back career blocks (e.g. a Friday "Demo & ship").
  let changed = true
  let guard = 0
  while (changed && guard++ < 16) {
    changed = false
    for (const e of career) {
      if (e.startTime === end && e.endTime > end) {
        end = e.endTime
        changed = true
      }
    }
  }
  return { start, end }
}

export const DEFAULT_LEAVE_LEAD_MIN = 15

export function computeActiveNudge(
  events: ScheduleEvent[],
  now = new Date(),
  leaveLeadMin: number = DEFAULT_LEAVE_LEAD_MIN
): ActiveNudge | null {
  const win = todaysOfficeWindow(events, todayISO())
  if (!win) return null
  const t = now.getTime()
  const startMs = hmToDate(win.start, now).getTime()
  const endMs = hmToDate(win.end, now).getTime()
  const leadMs = Math.max(0, Math.round(leaveLeadMin)) * MIN

  // Leaving the office: from `leaveLeadMin` before the end until 12 min after.
  if (!isDismissedToday('leave-office') && t >= endMs - leadMs && t < endMs + 12 * MIN) {
    return {
      key: 'leave-office',
      emoji: '🚗',
      title: `It’s almost ${format(hmToDate(win.end, now), 'h:mm a')} — time to leave the office.`,
      body: 'Wrap up and head home. Want me to book you a ride?',
    }
  }
  // Heading in: from 35 min before the start until 4 min before it.
  if (!isDismissedToday('ride-to-work') && t >= startMs - 35 * MIN && t < startMs - 4 * MIN) {
    return {
      key: 'ride-to-work',
      emoji: '🚕',
      title: `Office at ${format(hmToDate(win.start, now), 'h:mm a')}.`,
      body: 'Beat the rush — want me to book a ride in?',
    }
  }
  return null
}

// Universal deep links — hand off to the ride app with the rider's current location as pickup.
const UBER_URL = 'https://m.uber.com/ul/?action=setPickup&pickup=my_location'
const OLA_URL = 'https://book.olacabs.com/'

export function bookUber() {
  window.open(UBER_URL, '_blank', 'noopener,noreferrer')
}
export function bookOla() {
  window.open(OLA_URL, '_blank', 'noopener,noreferrer')
}

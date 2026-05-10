// Pure helpers for the reminders system: occurrence rules + fire times.
// Handles once/daily/weekly/monthly recurrence, one-shot snoozes, and quiet hours.

import { parseISO, getDay, getDate, lastDayOfMonth, format, addDays } from 'date-fns'
import type { Reminder } from '@/types'

export interface QuietHours {
  from: string // HH:mm
  to: string // HH:mm
}

const dayOf = (iso: string) => iso.slice(0, 10)
const toMinutes = (hm: string): number => {
  const [h, m] = hm.split(':').map((n) => Number(n) || 0)
  return h * 60 + m
}

/** Does this reminder occur on the given YYYY-MM-DD date? */
export function occursOn(r: Reminder, dateISO: string): boolean {
  if (r.done) return false
  // While snoozed, the reminder's only pending fire is on the snooze date.
  if (r.snoozedUntil) return dayOf(r.snoozedUntil) === dateISO
  if (r.repeat === 'once') return r.date === dateISO
  if (dateISO < r.date) return false // hasn't started yet
  if (r.repeat === 'daily') return true
  if (r.repeat === 'weekly') return getDay(parseISO(dateISO)) === getDay(parseISO(r.date))
  if (r.repeat === 'monthly') {
    const d = parseISO(dateISO)
    const wantedDay = Math.min(getDate(parseISO(r.date)), getDate(lastDayOfMonth(d)))
    return getDate(d) === wantedDay
  }
  return false
}

/** True if a minutes-of-day value falls inside the (possibly midnight-wrapping) quiet window. */
function inQuietHours(minutesOfDay: number, qh: QuietHours): boolean {
  const from = toMinutes(qh.from)
  const to = toMinutes(qh.to)
  if (from === to) return false // disabled / degenerate
  return from < to
    ? minutesOfDay >= from && minutesOfDay < to
    : minutesOfDay >= from || minutesOfDay < to
}

/** If `at` lands in quiet hours, push it to the end of the quiet period (next day if it wrapped). */
function deferPastQuietHours(at: Date, qh?: QuietHours): Date {
  if (!qh || !qh.from || !qh.to) return at
  const atMinutes = at.getHours() * 60 + at.getMinutes()
  if (!inQuietHours(atMinutes, qh)) return at
  const to = toMinutes(qh.to)
  const out = new Date(at)
  out.setHours(Math.floor(to / 60), to % 60, 0, 0)
  if (out.getTime() <= at.getTime()) out.setDate(out.getDate() + 1)
  return out
}

/** The Date this reminder should fire at on `dateISO` — honours snooze, then quiet hours.
 *  Callers should check {@link occursOn} first; for a snoozed reminder this is the snooze time. */
export function fireTimeOn(r: Reminder, dateISO: string, quietHours?: QuietHours): Date {
  if (r.snoozedUntil) return deferPastQuietHours(parseISO(r.snoozedUntil), quietHours)
  const [h, m] = r.time.split(':').map((n) => Number(n) || 0)
  const at = parseISO(dateISO)
  at.setHours(h, m, 0, 0)
  return deferPastQuietHours(at, quietHours)
}

export interface UpcomingReminder {
  reminder: Reminder
  at: Date
}

/** All occurrences for a single day, ordered by time. */
export function remindersForDay(
  reminders: Reminder[],
  dateISO: string,
  quietHours?: QuietHours
): UpcomingReminder[] {
  return reminders
    .filter((r) => occursOn(r, dateISO))
    .map((r) => ({ reminder: r, at: fireTimeOn(r, dateISO, quietHours) }))
    .sort((a, b) => a.at.getTime() - b.at.getTime())
}

/** The next time this reminder will fire from `from`, or null if it never will. */
export function nextFireTime(r: Reminder, from = new Date(), quietHours?: QuietHours): Date | null {
  for (let off = -1; off <= 400; off++) {
    const iso = format(addDays(from, off), 'yyyy-MM-dd')
    if (!occursOn(r, iso)) continue
    const at = fireTimeOn(r, iso, quietHours)
    if (at.getTime() >= from.getTime() - 60_000) return at
  }
  return null
}

/** Occurrences strictly in the future, within `withinMs` of `from`. */
export function upcomingReminders(
  reminders: Reminder[],
  withinMs: number,
  from = new Date(),
  quietHours?: QuietHours
): UpcomingReminder[] {
  const out: UpcomingReminder[] = []
  const seen = new Set<string>()
  for (let off = -1; off <= 9; off++) {
    const dISO = format(addDays(from, off), 'yyyy-MM-dd')
    for (const r of reminders) {
      if (!occursOn(r, dISO)) continue
      const at = fireTimeOn(r, dISO, quietHours)
      const delta = at.getTime() - from.getTime()
      if (delta <= 0 || delta > withinMs) continue
      const key = `${r.id}:${at.getTime()}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ reminder: r, at })
    }
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime())
}

/** Future occurrences for *today* only, ordered by time. */
export function todaysUpcomingReminders(
  reminders: Reminder[],
  todayISODate: string,
  from = new Date(),
  quietHours?: QuietHours
): UpcomingReminder[] {
  return remindersForDay(reminders, todayISODate, quietHours).filter(
    (u) => u.at.getTime() >= from.getTime() - 60_000
  )
}

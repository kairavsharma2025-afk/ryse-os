import {
  differenceInCalendarDays,
  format,
  parseISO,
  startOfWeek,
  getISOWeek,
  getISOWeekYear,
  setISOWeek,
  setISOWeekYear,
  startOfISOWeek,
  addDays,
} from 'date-fns'

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function nowISO(): string {
  return new Date().toISOString()
}

export function daysBetween(aISO: string, bISO: string): number {
  return differenceInCalendarDays(parseISO(bISO), parseISO(aISO))
}

export function isSameDay(aISO: string, bISO: string): boolean {
  return aISO.slice(0, 10) === bISO.slice(0, 10)
}

export function startOfThisWeekISO(): string {
  return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

export function isoWeekNumber(d = new Date()): number {
  return getISOWeek(d)
}

export function isoWeekYear(d = new Date()): number {
  return getISOWeekYear(d)
}

export function endOfTodayISO(): string {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

export function ymForDate(d = new Date()): string {
  return format(d, 'yyyy-MM')
}

export function weekDateRange(isoYear: number, isoWeek: number): string {
  let d = setISOWeekYear(new Date(), isoYear)
  d = setISOWeek(d, isoWeek)
  const start = startOfISOWeek(d)
  const end = addDays(start, 6)
  const sameMonth = start.getMonth() === end.getMonth()
  const startFmt = format(start, 'MMM d')
  const endFmt = sameMonth ? format(end, 'd, yyyy') : format(end, 'MMM d, yyyy')
  return `${startFmt} – ${endFmt}`
}

export function todayLongLabel(d = new Date()): string {
  return format(d, 'EEEE, MMMM d')
}

// Keeps the auto-managed daily reminders (wake-up + meals) in sync with Settings.
// They live as ordinary Reminder records (source 'wake' / 'meal') so they show up in
// the Reminders list and fire through the normal reminder engine.

import { useReminders } from '@/stores/remindersStore'
import { useSettings } from '@/stores/settingsStore'
import { todayISO } from './dates'
import type { AreaId, ReminderSource } from '@/types'

const MEAL_SLOTS = [
  { title: 'Breakfast', emoji: '🍳', timeKey: 'breakfastTime' },
  { title: 'Lunch', emoji: '🥗', timeKey: 'lunchTime' },
  { title: 'Dinner', emoji: '🍽️', timeKey: 'dinnerTime' },
] as const

const WAKE_TITLE = 'Wake up'

function upsertDaily(args: {
  source: ReminderSource
  title: string
  time: string
  category: AreaId
  notes?: string
}) {
  const { reminders, addReminder, updateReminder } = useReminders.getState()
  const existing = reminders.find((r) => r.source === args.source && r.title === args.title)
  if (existing) {
    updateReminder(existing.id, {
      time: args.time,
      category: args.category,
      repeat: 'daily',
      done: false,
      notes: args.notes,
    })
  } else {
    addReminder({
      title: args.title,
      date: todayISO(),
      time: args.time,
      repeat: 'daily',
      category: args.category,
      notes: args.notes,
      source: args.source,
    })
  }
}

function removeManaged(source: ReminderSource, title: string) {
  const { reminders, deleteReminder } = useReminders.getState()
  const existing = reminders.find((r) => r.source === source && r.title === title)
  if (existing) deleteReminder(existing.id)
}

export function syncMealReminders() {
  const s = useSettings.getState()
  for (const slot of MEAL_SLOTS) {
    if (s.mealReminders) {
      upsertDaily({
        source: 'meal',
        title: slot.title,
        time: s[slot.timeKey],
        category: 'health',
        notes: `${slot.emoji} Time to eat — fuel for the rest of the day.`,
      })
    } else {
      removeManaged('meal', slot.title)
    }
  }
}

export function syncWakeReminder() {
  const s = useSettings.getState()
  if (s.wakeAlarm) {
    upsertDaily({
      source: 'wake',
      title: WAKE_TITLE,
      time: s.wakeTime,
      category: 'health',
      notes: "Up and at it. (For a loud alarm, your phone's clock app still wins.)",
    })
  } else {
    removeManaged('wake', WAKE_TITLE)
  }
}

export function syncRoutineReminders() {
  syncWakeReminder()
  syncMealReminders()
}

import { useEffect, useMemo, useState } from 'react'
import { X, Sparkles } from 'lucide-react'
import { useSchedule } from '@/stores/scheduleStore'
import { useAssistant } from '@/stores/assistantStore'
import { todayISO } from '@/engine/dates'

/**
 * Proactive AI suggestion chip on the Today page. Surfaces one timely nudge
 * (e.g. overlapping events) and dismisses for the rest of the day.
 *
 * The detection is intentionally simple — the spec asks for a static/hardcoded
 * chip first. We bias toward a real signal when one exists (overlapping events)
 * so the chip feels alive, falling back to a generic plan-the-day prompt when
 * the schedule is clean.
 */
const DISMISS_KEY = 'lifeos:v1:ai_chip_dismissed_at'

export function AiSuggestionChip() {
  const events = useSchedule((s) => s.events)
  const openPanel = useAssistant((s) => s.setPanelOpen)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      const ts = localStorage.getItem(DISMISS_KEY)
      if (ts === todayISO()) setDismissed(true)
    } catch {
      /* localStorage blocked */
    }
  }, [])

  const message = useMemo(() => {
    const today = todayISO()
    const todays = events
      .filter((e) => e.date === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
    // Detect at least one pair of events whose time ranges overlap.
    const overlaps: Array<{ a: string; time: string }> = []
    for (let i = 0; i < todays.length; i++) {
      for (let j = i + 1; j < todays.length; j++) {
        if (todays[j].startTime < todays[i].endTime) {
          overlaps.push({ a: todays[i].title, time: todays[i].startTime })
        }
      }
    }
    if (overlaps.length > 0) {
      return `You have ${overlaps.length} overlapping event${overlaps.length === 1 ? '' : 's'} at ${overlaps[0].time} — want me to fix that?`
    }
    if (todays.length === 0) {
      return 'No events today — want me to suggest a focused plan?'
    }
    return 'Want me to suggest the best order for today\'s tasks?'
  }, [events])

  function dismiss() {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, todayISO())
    } catch {
      /* localStorage blocked */
    }
  }

  if (dismissed) return null

  return (
    <div
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm border"
      style={{
        background: 'rgb(var(--color-ai) / 0.10)',
        borderColor: 'rgb(var(--color-ai) / 0.40)',
        color: 'rgb(var(--color-ai))',
      }}
    >
      <Sparkles className="w-4 h-4 shrink-0" strokeWidth={2} />
      <button
        type="button"
        onClick={() => openPanel(true)}
        className="flex-1 text-left truncate hover:underline underline-offset-2 font-medium"
      >
        {message}
      </button>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center hover:bg-ai/20 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" strokeWidth={2.2} />
      </button>
    </div>
  )
}

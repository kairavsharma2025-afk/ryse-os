import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Mic, Calendar as CalendarIcon, Bell, Zap, Loader2 } from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { VoiceInputButton } from '@/components/VoiceInputButton'
import { useSchedule } from '@/stores/scheduleStore'
import { useReminders } from '@/stores/remindersStore'
import { useTasks } from '@/stores/tasksStore'
import { todayISO } from '@/engine/dates'
import { toast } from '@/components/ui/Toast'
import { addDays, format } from 'date-fns'
import type { AreaId } from '@/types'
import { AREA_LIST } from '@/data/areas'

type Energy = 'deep' | 'shallow' | 'recovery' | 'social'
type Priority = 1 | 2 | 3 | 4

const ENERGY_LABEL: Record<Energy, string> = {
  deep: 'Deep work',
  shallow: 'Shallow',
  recovery: 'Recovery',
  social: 'Social',
}

const KEYWORD_CATEGORY: Record<string, AreaId> = {
  gym: 'health',
  workout: 'health',
  run: 'health',
  walk: 'health',
  sleep: 'health',
  meditate: 'mind',
  read: 'learning',
  study: 'learning',
  meeting: 'career',
  standup: 'career',
  office: 'career',
  work: 'career',
  deploy: 'career',
  ship: 'career',
  call: 'relationships',
  family: 'relationships',
  friend: 'relationships',
  pay: 'finance',
  budget: 'finance',
  expense: 'finance',
  invoice: 'finance',
}

/**
 * Floating Action Button. Always at the bottom-right (above the mobile tab
 * bar on small screens) — the single fastest way to capture a task from
 * anywhere in the app.
 */
export function QuickAddFab() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.92 }}
        transition={{ duration: 0.08 }}
        onClick={() => setOpen(true)}
        aria-label="Quick add"
        className="hidden md:flex fixed md:right-8 md:bottom-8 z-50 w-14 h-14 rounded-full bg-accent text-white shadow-elevated items-center justify-center hover:bg-accent2 transition-colors duration-80"
      >
        <Plus className="w-6 h-6" strokeWidth={2.2} />
      </motion.button>
      <QuickAddSheet open={open} onClose={() => setOpen(false)} />
    </>
  )
}

interface ParseResult {
  intent: 'reminder' | 'event' | 'task'
  cleanTitle: string
  date: string // YYYY-MM-DD
  time: string | null // HH:mm or null
  category: AreaId
}

/**
 * Minimal natural-language parser. Extracts:
 *   - intent: "remind me ..." → reminder; "<time>" present → event; else task
 *   - date: "tomorrow" / "today" / weekday name → ISO date (defaults today)
 *   - time: "HH:MM" or "Ham/pm" → HH:mm
 *   - category: first matching keyword → AreaId (default career)
 *
 * Keep this dumb on purpose — it returns its best guess, and the user can
 * tweak via the sheet controls before saving.
 */
function parseQuickInput(input: string): ParseResult {
  let cleanTitle = input.trim()
  let intent: ParseResult['intent'] = 'task'

  // Intent.
  if (/^remind\s+me\b/i.test(cleanTitle)) {
    intent = 'reminder'
    cleanTitle = cleanTitle.replace(/^remind\s+me\s+(to\s+)?/i, '').trim()
  } else if (/^add\s+/i.test(cleanTitle)) {
    cleanTitle = cleanTitle.replace(/^add\s+/i, '').trim()
  }

  // Date.
  let date = todayISO()
  const tomorrowMatch = /\b(tomorrow|tmrw|tmr)\b/i.exec(cleanTitle)
  const todayMatch = /\btoday\b/i.exec(cleanTitle)
  if (tomorrowMatch) {
    date = format(addDays(new Date(), 1), 'yyyy-MM-dd')
    cleanTitle = cleanTitle.replace(tomorrowMatch[0], '').trim()
  } else if (todayMatch) {
    cleanTitle = cleanTitle.replace(todayMatch[0], '').trim()
  } else {
    // Weekday names.
    const weekdayRe = /\b(mon|tue|wed|thu|fri|sat|sun)(day)?\b/i
    const m = weekdayRe.exec(cleanTitle)
    if (m) {
      const map: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }
      const target = map[m[1].slice(0, 3).toLowerCase()]
      const now = new Date()
      const cur = now.getDay()
      let delta = (target - cur + 7) % 7
      if (delta === 0) delta = 7 // "Monday" means next Monday, not today.
      date = format(addDays(now, delta), 'yyyy-MM-dd')
      cleanTitle = cleanTitle.replace(m[0], '').trim()
    }
  }

  // Time: 7am, 7:30pm, 19:30, etc.
  let time: string | null = null
  const timeRe = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i
  const tm = timeRe.exec(cleanTitle)
  if (tm) {
    let hh = parseInt(tm[1], 10)
    const mm = tm[2] ? parseInt(tm[2], 10) : 0
    const ampm = tm[3]?.toLowerCase()
    if (ampm === 'pm' && hh < 12) hh += 12
    if (ampm === 'am' && hh === 12) hh = 0
    if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) {
      time = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
      cleanTitle = cleanTitle.replace(tm[0], '').trim()
    }
  }

  // Strip filler words at the seams.
  cleanTitle = cleanTitle.replace(/^(at|on|by|in)\s+/i, '').replace(/\s+(at|on|by|in)\s*$/i, '').trim()
  cleanTitle = cleanTitle.replace(/\s{2,}/g, ' ')

  // Category.
  let category: AreaId = 'career'
  for (const [kw, cat] of Object.entries(KEYWORD_CATEGORY)) {
    if (new RegExp(`\\b${kw}\\b`, 'i').test(input)) {
      category = cat
      break
    }
  }

  // If we got a time and no explicit "remind me", treat it as an event.
  if (intent === 'task' && time) intent = 'event'

  return { intent, cleanTitle, date, time, category }
}

function QuickAddSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [interim, setInterim] = useState('')
  const [category, setCategory] = useState<AreaId>('career')
  const [date, setDate] = useState<string>(todayISO())
  const [time, setTime] = useState<string>('')
  const [priority, setPriority] = useState<Priority>(2)
  const [energy, setEnergy] = useState<Energy | null>(null)
  const [busy, setBusy] = useState(false)
  const addEvent = useSchedule((s) => s.addEvent)
  const addReminder = useReminders((s) => s.addReminder)
  const addTask = useTasks((s) => s.addTask)

  // Reset state every time the sheet opens.
  useEffect(() => {
    if (!open) return
    setText('')
    setInterim('')
    setTime('')
    setDate(todayISO())
    setPriority(2)
    setEnergy(null)
    setCategory('career')
    // Wait one frame for the sheet to render before grabbing focus.
    const t = setTimeout(() => inputRef.current?.focus(), 60)
    return () => clearTimeout(t)
  }, [open])

  // Live-parse so the inferred fields update as the user types.
  useEffect(() => {
    if (!text.trim()) return
    const p = parseQuickInput(text)
    setCategory(p.category)
    setDate(p.date)
    if (p.time) setTime(p.time)
  }, [text])

  async function save() {
    if (!text.trim() || busy) return
    setBusy(true)
    const p = parseQuickInput(text)
    const finalTitle = p.cleanTitle || text.trim()
    try {
      if (p.intent === 'reminder' || (time && p.intent !== 'event')) {
        addReminder({
          title: finalTitle,
          date,
          time: time || '09:00',
          repeat: 'once',
          category,
          priority: priority === 1 ? 'high' : priority >= 3 ? 'low' : 'normal',
          source: 'manual',
        })
        toast.success('Reminder added', `${date} at ${time || '09:00'}`)
      } else if (p.intent === 'event' || time) {
        // Default duration 30 min.
        const [h, m] = (time || '09:00').split(':').map(Number)
        const endH = h + (m >= 30 ? 1 : 0)
        const endM = (m + 30) % 60
        addEvent({
          title: finalTitle,
          date,
          startTime: time || '09:00',
          endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
          category,
          source: 'manual',
          notes: energy ? `Energy: ${ENERGY_LABEL[energy]}` : undefined,
        })
        toast.success('Scheduled', `${date} at ${time || '09:00'}`)
      } else {
        // No explicit time → it's an Inbox task. Lands on Plan → Inbox.
        const dueDate = date !== todayISO() ? date : undefined
        addTask({
          title: finalTitle,
          category,
          priority,
          important: priority <= 2,
          urgent: priority === 1,
          dueDate,
          energy: energy ?? undefined,
          source: 'quickadd',
        })
        toast.success('Added to Inbox', dueDate ? `Due ${dueDate}` : 'No due date')
      }
      onClose()
    } catch (err) {
      toast.error("Couldn't save", (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="px-5 pb-6 pt-2 space-y-4">
        <div>
          <label className="text-xs text-muted block mb-1.5">What do you want to do?</label>
          <div className="relative">
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void save()
              }}
              placeholder="e.g. Gym tomorrow 7am · Remind me to call Mom 8pm"
              className="w-full bg-surface2 border border-border/10 rounded-xl px-4 py-3 pr-12 text-md focus:outline-none focus:border-accent transition-colors duration-80"
            />
            <VoiceInputButton
              onTranscript={(t) => setText((prev) => (prev ? `${prev} ${t}` : t))}
              onInterim={setInterim}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            />
          </div>
          <div className="text-[11px] text-muted mt-1.5 min-h-[1em]">
            {interim ? (
              <span className="text-accent italic">{interim}</span>
            ) : (
              <span>Tip: include a day ("tomorrow") and a time ("7am") and we'll book it.</span>
            )}
          </div>
        </div>

        {/* Inline parsed metadata pills */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted block mb-1.5">When</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-surface2 border border-border/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1.5">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-surface2 border border-border/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted block mb-1.5">Category</label>
          <div className="flex gap-1.5 flex-wrap">
            {AREA_LIST.map((a) => {
              const selected = category === a.id
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setCategory(a.id)}
                  className="px-2.5 py-1 rounded-full text-xs uppercase border transition-colors duration-80"
                  style={{
                    borderColor: selected ? `rgb(var(--${a.id}))` : 'rgb(var(--border) / 0.18)',
                    background: selected ? `rgb(var(--${a.id}) / 0.12)` : 'transparent',
                    color: selected ? `rgb(var(--${a.id}))` : 'rgb(var(--muted))',
                  }}
                >
                  {a.name}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted block mb-1.5">Priority</label>
            <div className="flex items-center gap-1.5">
              {([1, 2, 3, 4] as Priority[]).map((p) => {
                const colors = ['#FF453A', '#0A84FF', '#FF9F0A', '#98989D']
                const selected = priority === p
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`h-9 px-3 rounded-lg text-xs font-bold transition-all duration-80 ${
                      selected ? 'ring-2 ring-offset-2 ring-offset-surface' : ''
                    }`}
                    style={{
                      background: selected ? colors[p - 1] : 'rgb(var(--surface2))',
                      color: selected ? '#FFFFFF' : 'rgb(var(--muted))',
                      // @ts-expect-error custom property for selection ring
                      '--tw-ring-color': colors[p - 1],
                    }}
                  >
                    P{p}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted block mb-1.5">Energy</label>
            <div className="grid grid-cols-2 gap-1">
              {(['deep', 'shallow', 'recovery', 'social'] as Energy[]).map((e) => {
                const selected = energy === e
                return (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEnergy(selected ? null : e)}
                    className={`h-9 rounded-lg text-[11px] transition-colors duration-80 ${
                      selected
                        ? 'bg-accent/15 text-accent border border-accent/40'
                        : 'bg-surface2 border border-border/10 text-muted'
                    }`}
                  >
                    {ENERGY_LABEL[e]}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <div className="text-[11px] text-muted flex items-center gap-1">
            {detectIntentIcon(text)}
            <span>{detectIntentLabel(text)}</span>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="subtle" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={!text.trim() || busy}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </BottomSheet>
  )
}

function detectIntentIcon(text: string) {
  if (!text.trim()) return <Mic className="w-3.5 h-3.5 text-muted" />
  const p = parseQuickInput(text)
  if (p.intent === 'reminder') return <Bell className="w-3.5 h-3.5 text-accent" />
  if (p.intent === 'event') return <CalendarIcon className="w-3.5 h-3.5 text-accent" />
  return <Zap className="w-3.5 h-3.5 text-warning" />
}

function detectIntentLabel(text: string) {
  if (!text.trim()) return 'Type or paste anything'
  const p = parseQuickInput(text)
  if (p.intent === 'reminder') return 'Reminder'
  if (p.intent === 'event') return 'Scheduled'
  return 'Task'
}

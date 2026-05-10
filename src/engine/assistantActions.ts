// The assistant orchestrator: chat turns, daily-plan generation, and parsing
// "actions" the assistant emits to create reminders / schedule events.

import { callClaude, hasApiKey, type ClaudeMessage } from './claudeApi'
import { buildAssistantContext } from './assistantContext'
import { useAssistant } from '@/stores/assistantStore'
import { useReminders } from '@/stores/remindersStore'
import { useSchedule } from '@/stores/scheduleStore'
import { useNotifications } from '@/stores/notificationsStore'
import { nowISO, todayISO } from './dates'
import { AREA_IDS } from '@/types'
import type { AreaId, ReminderRepeat } from '@/types'

const PERSONA = `You are the Game Master of "Ryse" — a gamified personal-life RPG where the user is the Hero and real life is the longest game. Speak in a warm, grounded, lightly mythic game-master voice: second person, short and punchy. Use a little game language — "Your mission today:", "Boss battle incoming:", "XP awaits.", "Level up." — sparingly, never cheesy. You are a proactive personal assistant and planner: don't just answer questions, suggest what the Hero should do today, this week, and this season, anchored to their real schedule, goals, ritual, and season focus. Be concise — a few short paragraphs or a tight list. Use markdown lightly (bold, bullets). Never claim to have done something you can't (you can't browse the web or send real messages), but you CAN create reminders and calendar events via the action block below.`

const ACTION_INSTRUCTIONS = `── CREATING REMINDERS & EVENTS ──
If the Hero asks you to remember, schedule, or be reminded of something, do TWO things:
1) Reply naturally and briefly confirm it ("Logged — reminder set for 7:00 PM Sunday.").
2) At the very END of your message, append exactly one fenced block:
\`\`\`lifeos-actions
{"actions":[ ... ]}
\`\`\`
Each action object is one of:
- {"type":"reminder","title":"Call Mom","date":"2026-05-11","time":"19:00","repeat":"once","category":"relationships","notes":""}
- {"type":"event","title":"Job interview prep","date":"2026-05-15","startTime":"10:00","endTime":"11:30","category":"career","notes":""}
Rules:
- date = YYYY-MM-DD, times = 24-hour HH:mm. Resolve relative dates ("tomorrow", "next Friday", "Sunday evening", "in 3 days") from the "Now:" line in the context. "evening" ≈ 19:00, "morning" ≈ 08:00, "afternoon" ≈ 14:00, "night" ≈ 21:00 unless told otherwise.
- repeat ∈ {"once","daily","weekly","monthly"}.
- category ∈ {"career","health","relationships","finance","learning","mind"} — pick the closest.
- If nothing should be scheduled, do NOT include the block at all.
- Never describe or mention the block in your prose. Just confirm conversationally.`

const CHAT_HISTORY_TURNS = 16

interface RawAction {
  type?: string
  title?: string
  date?: string
  time?: string
  startTime?: string
  endTime?: string
  repeat?: string
  category?: string
  notes?: string
}

const ACTION_BLOCK_RE = /```lifeos-actions\s*([\s\S]*?)```/i

function parseAndStrip(text: string): { clean: string; actions: RawAction[] } {
  const m = text.match(ACTION_BLOCK_RE)
  if (!m) return { clean: text.trim(), actions: [] }
  let actions: RawAction[] = []
  try {
    const parsed = JSON.parse(m[1].trim()) as { actions?: RawAction[] }
    if (Array.isArray(parsed?.actions)) actions = parsed.actions
  } catch {
    /* malformed — ignore */
  }
  const clean = text.replace(ACTION_BLOCK_RE, '').trim()
  return { clean: clean || text.trim(), actions }
}

function asArea(v: unknown): AreaId {
  return typeof v === 'string' && (AREA_IDS as string[]).includes(v) ? (v as AreaId) : 'mind'
}
function asRepeat(v: unknown): ReminderRepeat {
  return v === 'daily' || v === 'weekly' || v === 'monthly' ? v : 'once'
}
const isHm = (v: unknown): v is string => typeof v === 'string' && /^\d{1,2}:\d{2}$/.test(v)
const isYmd = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
const pad = (s: string) => (s.length === 4 ? '0' + s : s)

function applyActions(actions: RawAction[]): number {
  let n = 0
  for (const a of actions) {
    if (!a || typeof a !== 'object') continue
    const category = asArea(a.category)
    const notes = typeof a.notes === 'string' && a.notes.trim() ? a.notes.trim() : undefined
    if (a.type === 'reminder' && typeof a.title === 'string' && isYmd(a.date) && isHm(a.time)) {
      const repeat = asRepeat(a.repeat)
      useReminders.getState().addReminder({
        title: a.title.trim(),
        date: a.date,
        time: pad(a.time),
        repeat,
        category,
        notes,
        source: 'assistant',
      })
      useNotifications.getState().push({
        type: 'system',
        title: 'Reminder set',
        body: `${a.title.trim()} — ${a.date} at ${pad(a.time)}${repeat !== 'once' ? ` · ${repeat}` : ''}`,
        emoji: '⏰',
        ctaLabel: 'Reminders',
        ctaPath: '/reminders',
      })
      n++
    } else if (
      a.type === 'event' &&
      typeof a.title === 'string' &&
      isYmd(a.date) &&
      isHm(a.startTime) &&
      isHm(a.endTime)
    ) {
      useSchedule.getState().addEvent({
        title: a.title.trim(),
        date: a.date,
        startTime: pad(a.startTime),
        endTime: pad(a.endTime),
        category,
        notes,
        source: 'assistant',
      })
      useNotifications.getState().push({
        type: 'system',
        title: 'Added to your schedule',
        body: `${a.title.trim()} — ${a.date}, ${pad(a.startTime)}–${pad(a.endTime)}`,
        emoji: '📅',
        ctaLabel: 'Schedule',
        ctaPath: '/schedule',
      })
      n++
    }
  }
  return n
}

function recentHistory(): ClaudeMessage[] {
  // Collapse any consecutive same-role messages (errors can leave gaps) and
  // ensure the conversation starts with a user turn — the API requires both.
  const recent = useAssistant.getState().messages.slice(-(CHAT_HISTORY_TURNS + 6))
  const collapsed: ClaudeMessage[] = []
  for (const m of recent) {
    const last = collapsed[collapsed.length - 1]
    if (last && last.role === m.role) last.content = `${last.content}\n\n${m.content}`
    else collapsed.push({ role: m.role, content: m.content })
  }
  while (collapsed.length && collapsed[0].role !== 'user') collapsed.shift()
  return collapsed.slice(-CHAT_HISTORY_TURNS)
}

/** Send a chat message to the assistant. Returns when the reply is in the store. */
export async function askAssistant(userText: string): Promise<void> {
  const text = userText.trim()
  if (!text) return
  const store = useAssistant.getState()
  store.addMessage('user', text)
  store.setError(undefined)

  if (!hasApiKey()) {
    store.setError('No Anthropic API key — add one in Settings to wake the assistant.')
    return
  }

  store.setThinking(true)
  try {
    const system = `${PERSONA}\n\n${ACTION_INSTRUCTIONS}\n\n${buildAssistantContext()}`
    const reply = await callClaude({ system, messages: recentHistory(), maxTokens: 1200 })
    const { clean, actions } = parseAndStrip(reply)
    useAssistant.getState().addMessage('assistant', clean)
    if (actions.length) applyActions(actions)
  } catch (e) {
    useAssistant.getState().setError((e as Error).message)
  } finally {
    useAssistant.getState().setThinking(false)
  }
}

/** Generate (or regenerate) today's AI plan into the assistant store. */
export async function generateDailyPlan(opts?: { force?: boolean }): Promise<void> {
  const store = useAssistant.getState()
  const today = todayISO()
  if (!opts?.force && store.plan && store.plan.date === today) return
  if (!hasApiKey()) {
    store.setError('No Anthropic API key — add one in Settings to generate plans.')
    return
  }
  store.setError(undefined)
  store.setPlanLoading(true)
  try {
    const system =
      `${PERSONA}\n\nTASK: Build the Hero's plan for TODAY. Output ONLY a time-blocked schedule as a markdown bullet list — one line per block, formatted like:\n- **8:00 AM** — Wake ritual (10 min)\n- **9:00 AM** — Deep work: <highest-priority goal> (90 min)\nHard-anchor every event already on today's schedule and every reminder at its exact time (do not move them). Around those, slot deep-work blocks for the Hero's top-priority goals, the daily-ritual steps not yet done, meals, and short recovery breaks. Be realistic about the time of day shown in "Now:" — don't schedule things in the past. Keep it to 6–12 lines. After the list, add ONE blank line, then ONE short bold motivating line starting with "**Your mission today:**". Do NOT include any action block.\n\n` +
      buildAssistantContext()
    const content = await callClaude({
      system,
      messages: [{ role: 'user', content: 'Generate my plan for today.' }],
      maxTokens: 900,
    })
    useAssistant.getState().setPlan({ date: today, content, generatedAt: nowISO() })
  } catch (e) {
    useAssistant.getState().setError((e as Error).message)
  } finally {
    useAssistant.getState().setPlanLoading(false)
  }
}

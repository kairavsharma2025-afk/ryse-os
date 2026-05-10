// One-time seed: pre-fills the Schedule + Reminders with the intern/CFA/CAT/gym
// routine. Runs once (gated by a localStorage flag) from runOpeningTick().
// To re-seed: clear the `lifeos:v1:seed_v1` key (or just edit events in-app).

import { addDays, format, startOfWeek } from 'date-fns'
import { loadJSON, saveJSON } from '@/stores/persist'
import { useSchedule } from '@/stores/scheduleStore'
import { useReminders } from '@/stores/remindersStore'
import { useGoals } from '@/stores/goalsStore'
import { todayISO } from '@/engine/dates'
import type { AreaId, GoalCadence, QuestType } from '@/types'

const SEED_FLAG = 'seed_v1'
const GOALS_FLAG = 'seed_goals_v1'
const WEEKS_TO_SEED = 4

const iso = (d: Date) => format(d, 'yyyy-MM-dd')

interface Block {
  start: string
  end: string
  title: string
  category: AreaId
  notes?: string
}

const GYM_AM: Block = {
  start: '07:00',
  end: '08:00',
  title: 'Gym',
  category: 'health',
  notes: 'Lift / cardio before work. Non-negotiable — this is the energy for everything else.',
}

const OFFICE: Block = {
  start: '09:00',
  end: '18:30',
  title: 'Stipend project — vibe coding (office)',
  category: 'career',
  notes: 'The thing that pays. Aim to ship something demo-able every week.',
}

// Mon..Fri evening study (index 0 = Monday)
const EVENING_STUDY: Block[] = [
  {
    start: '19:30',
    end: '21:30',
    title: 'CFA L1 — study session',
    category: 'finance',
    notes: 'Start with Ethics & Quant Methods. ~10 hrs/wk pace toward the Feb 2027 exam.',
  },
  {
    start: '19:30',
    end: '21:30',
    title: 'CAT — Quant fundamentals',
    category: 'learning',
    notes: 'Arithmetic / algebra basics. Keep it warm — CAT is Nov 2027, no rush yet.',
  },
  {
    start: '19:30',
    end: '21:30',
    title: 'CFA L1 — study session',
    category: 'finance',
    notes: 'Quantitative Methods.',
  },
  {
    start: '19:30',
    end: '21:30',
    title: 'CAT — VARC (reading + RC)',
    category: 'learning',
    notes: 'Build the daily reading habit + 2 RC passages.',
  },
  {
    start: '19:30',
    end: '21:30',
    title: 'CFA L1 — study session',
    category: 'finance',
    notes: 'Quantitative Methods / Economics intro.',
  },
]

const FRIDAY_DEMO: Block = {
  start: '16:00',
  end: '18:30',
  title: 'Demo & ship — stipend milestone',
  category: 'career',
  notes: 'Deploy, write a 1-pager, send the week’s progress to your mentor.',
}

const SATURDAY: Block[] = [
  { start: '09:00', end: '10:30', title: 'Gym (long session)', category: 'health' },
  {
    start: '11:00',
    end: '13:00',
    title: 'CFA L1 — deep block (new material)',
    category: 'finance',
    notes: 'Hardest study slot of the week — do it on a fresh brain.',
  },
  {
    start: '14:00',
    end: '16:00',
    title: 'Stipend project — polish, deploy, demo doc',
    category: 'career',
    notes: 'Portfolio-ize it: screenshots, README, a short writeup.',
  },
  { start: '16:30', end: '18:00', title: 'CAT — DILR set + review', category: 'learning' },
]

const SUNDAY: Block[] = [
  {
    start: '11:00',
    end: '12:30',
    title: 'CFA — review the week + flashcards',
    category: 'finance',
    notes: 'Light. Consolidate — don’t learn new material on Sundays.',
  },
  {
    start: '17:00',
    end: '17:30',
    title: 'Weekly review + plan next week',
    category: 'mind',
    notes: 'What moved? What slipped? Adjust next week. (Once college starts 22 Jun, rebuild this template around your timetable.)',
  },
]

function weekdayBlocks(dayIdx: number): Block[] {
  if (dayIdx < 4) return [GYM_AM, OFFICE, EVENING_STUDY[dayIdx]]
  // Friday: shorter office block + the demo block
  return [
    GYM_AM,
    { ...OFFICE, end: '16:00', notes: 'Wrap the week — get the project to demo state.' },
    FRIDAY_DEMO,
    EVENING_STUDY[4],
  ]
}

export function seedOnce(): void {
  if (loadJSON<boolean>(SEED_FLAG, false)) return

  const today = todayISO()
  const monday0 = startOfWeek(new Date(), { weekStartsOn: 1 })
  const addEvent = useSchedule.getState().addEvent

  const place = (date: string, blocks: Block[]) => {
    if (date < today) return // skip days already past
    for (const b of blocks) {
      addEvent({
        title: b.title,
        date,
        startTime: b.start,
        endTime: b.end,
        category: b.category,
        notes: b.notes,
        source: 'manual',
      })
    }
  }

  for (let w = 0; w < WEEKS_TO_SEED; w++) {
    const monday = addDays(monday0, w * 7)
    for (let d = 0; d < 5; d++) place(iso(addDays(monday, d)), weekdayBlocks(d))
    place(iso(addDays(monday, 5)), SATURDAY)
    place(iso(addDays(monday, 6)), SUNDAY)
  }

  // Recurring reminders — start tomorrow so nothing pings the moment you reload.
  const tomorrow = iso(addDays(new Date(), 1))
  const thisMonday = iso(monday0)
  const thisFriday = iso(addDays(monday0, 4))
  const nextSunday = iso(addDays(monday0, 6))
  const addReminder = useReminders.getState().addReminder
  addReminder({ title: 'Gym — get up & go', date: tomorrow, time: '06:45', repeat: 'daily', category: 'health', source: 'manual' })
  addReminder({ title: 'Evening study block starts', date: tomorrow, time: '19:25', repeat: 'daily', category: 'learning', source: 'manual' })
  addReminder({ title: "Plan this week's CFA reading", date: thisMonday, time: '09:00', repeat: 'weekly', category: 'finance', source: 'manual' })
  addReminder({ title: 'Send stipend project progress to mentor', date: thisFriday, time: '16:00', repeat: 'weekly', category: 'career', source: 'manual' })
  addReminder({ title: 'Weekly review + plan next week', date: nextSunday, time: '17:00', repeat: 'weekly', category: 'mind', source: 'manual' })

  saveJSON(SEED_FLAG, true)
}

// ===== Goals seed — the four quests behind the intern/CFA/CAT/gym schedule. =====

interface GoalSeed {
  area: AreaId
  title: string
  description: string
  cadence: GoalCadence
  questType: QuestType
  difficultyRating: 1 | 2 | 3 | 4 | 5
  priority: 1 | 2 | 3
  targetUnit?: string
  targetAmount?: number
  milestones: string[]
}

const GOAL_SEEDS: GoalSeed[] = [
  {
    area: 'career',
    title: 'Ship a stipend-earning project',
    description:
      'Build & ship the vibe-coding project that turns the internship into stipend. Demo-able by end of month; polished + presented before college restarts (22 Jun 2026).',
    cadence: 'weekdays',
    questType: 'epic',
    difficultyRating: 4,
    priority: 1,
    milestones: ['v1 demo-able', 'Deployed + 1-page writeup', 'Shown to mentor', 'Stipend secured'],
  },
  {
    area: 'finance',
    title: 'Pass CFA Level I',
    description:
      'Exam: Feb 2027. ~300 study hours total — ~10 hrs/week now, ramping up from September. Order: Ethics → Quant Methods → Economics → FRA → Corp Finance → Equity → Fixed Income → Derivatives → Alts → PM.',
    cadence: 'daily',
    questType: 'epic',
    difficultyRating: 5,
    priority: 1,
    targetUnit: 'study hours',
    targetAmount: 300,
    milestones: [
      'Ethics & Quant Methods done',
      'Economics + FRA done',
      'Corp Fin + Equity + Fixed Income done',
      'First full mock ≥ 70%',
      'CFA Level I — passed',
    ],
  },
  {
    area: 'health',
    title: 'Gym 6× a week',
    description: 'Six sessions a week, Sunday rest. Lift / cardio. Energy first — everything else runs on it.',
    cadence: 'daily',
    questType: 'daily',
    difficultyRating: 3,
    priority: 2,
    targetUnit: 'sessions',
    milestones: ['First full week (6 sessions)', '30 sessions logged', '100 sessions logged', 'A full year of it'],
  },
  {
    area: 'learning',
    title: 'Crack CAT 2027',
    description:
      'Exam: Nov 2027 — long runway, so keep it warm now (~3 sessions/week: Quant, VARC reading, DILR). Serious daily prep from April 2027.',
    cadence: 'daily',
    questType: 'epic',
    difficultyRating: 4,
    priority: 3,
    milestones: [
      'Quant fundamentals solid',
      'Daily reading habit established',
      'DILR sets — comfortable',
      'First full mock',
      'CAT 2027 — 99 %ile',
    ],
  },
]

export function seedGoalsOnce(): void {
  if (loadJSON<boolean>(GOALS_FLAG, false)) return
  const addGoal = useGoals.getState().addGoal
  for (const g of GOAL_SEEDS) {
    addGoal({
      area: g.area,
      title: g.title,
      description: g.description,
      cadence: g.cadence,
      questType: g.questType,
      difficultyRating: g.difficultyRating,
      priority: g.priority,
      targetUnit: g.targetUnit,
      targetAmount: g.targetAmount,
      milestones: g.milestones.map((title) => ({ id: crypto.randomUUID(), title })),
      isBossBattle: false,
    })
  }
  saveJSON(GOALS_FLAG, true)
}

// Generates App Store / Google Play screenshots from the running app, populated with
// demo data injected into localStorage. Captures iPhone 6.7" (1290×2796) and a
// Play-safe phone size (1080×1920).
//
// Usage:
//   npm i puppeteer --no-save        # one-time; not added to package.json
//   node scripts/screenshots.mjs     # dev server must be running (npm run dev)
// Env:
//   SHOT_BASE   default http://localhost:5173   — app URL (e.g. https://ryse-os.vercel.app)
//   SHOT_NAME   default Kairav                  — character name shown in the screenshots

import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { mkdir } from 'node:fs/promises'
import puppeteer from 'puppeteer'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BASE = (process.env.SHOT_BASE || 'http://localhost:5173').replace(/\/+$/, '')
const NAME = process.env.SHOT_NAME || 'Kairav'

// --- date / id helpers -------------------------------------------------------
const now = new Date()
const uid = () => randomUUID()
const at = (d, h = 12, m = 0) => {
  const x = new Date(d)
  x.setHours(h, m, 0, 0)
  return x
}
const daysAgo = (n) => {
  const d = new Date(now)
  d.setDate(d.getDate() - n)
  return d
}
// Local calendar date (the app uses date-fns `format(d, 'yyyy-MM-dd')`, i.e. local) —
// `.toISOString().slice(0,10)` would shift by a day for non-UTC timezones.
const isoDate = (d) => {
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}
const isoDateTime = (d) => new Date(d).toISOString() // full timestamp — UTC ISO is correct here
// Monday of the current week (weekStartsOn: 1)
const monday = (() => {
  const d = new Date(now)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  d.setHours(0, 0, 0, 0)
  return d
})()
const weekday = (i) => {
  const d = new Date(monday)
  d.setDate(d.getDate() + i)
  return isoDate(d)
}

// --- character ---------------------------------------------------------------
const xpForLevel = (n) => Math.round(50 * Math.pow(n, 1.8))
let threshold = 0
for (let n = 2; n <= 8; n++) threshold += xpForLevel(n)
const DEMO_XP = threshold + Math.round(xpForLevel(9) * 0.42) // ~42% into level 8

const character = {
  initialised: true,
  name: NAME,
  avatar: 'wizard',
  classId: 'operator',
  startingClassId: 'operator',
  level: 8,
  xp: DEMO_XP,
  stats: { career: 6, health: 4, relationships: 3, finance: 5, learning: 4, mind: 5 },
  titles: ['Wanderer', 'On Fire', 'Quest Accepted'],
  activeTitle: 'On Fire',
  unlockedThemes: ['default'],
  activeTheme: 'default',
  unlockedAvatarFrames: ['none'],
  activeAvatarFrame: 'none',
  achievements: ['first-blood', 'first-quest', 'perfect-day', 'on-fire', 'planner', 'still-here'],
  loot: [],
  createdAt: isoDateTime(daysAgo(34)),
  lastOpenedAt: isoDateTime(now),
  daysOpened: Array.from({ length: 18 }, (_, i) => isoDate(daysAgo(17 - i))),
  streakShields: 2,
  shieldLastGrantedMonth: isoDate(now).slice(0, 7),
}

// --- goals -------------------------------------------------------------------
const milestone = (title, doneDaysAgo) => ({
  id: uid(),
  title,
  ...(doneDaysAgo != null ? { completedAt: isoDateTime(daysAgo(doneDaysAgo)) } : {}),
})
const logs = (count, spanDays) =>
  Array.from({ length: count }, (_, i) => ({
    id: uid(),
    date: isoDateTime(daysAgo(Math.round((i / Math.max(1, count - 1)) * spanDays))),
    xpAwarded: 15 + ((i * 7) % 20),
  }))

const goals = [
  {
    id: uid(),
    area: 'career',
    title: 'Ship a stipend-earning project',
    description:
      'Build & ship the vibe-coding project that turns the internship into stipend. Polished + presented before college restarts.',
    cadence: 'weekdays',
    questType: 'epic',
    difficultyRating: 4,
    priority: 1,
    milestones: [
      milestone('v1 demo-able', 11),
      milestone('Deployed + 1-pager', 3),
      milestone('Shown to mentor'),
      milestone('Stipend secured'),
    ],
    isBossBattle: true,
    bossBattleConfig: {
      bossName: 'The Unpaid Internship',
      bossDescription: 'It pays you in "experience". Beat it.',
      bossHp: 30,
      currentHp: 11,
      damagePerLog: 1,
      bossCounterattack: 'Another week of nothing to show.',
      rewardBadgeId: 'unbeaten',
      defeated: false,
    },
    createdAt: isoDateTime(daysAgo(28)),
    logs: logs(19, 24),
    currentStreak: 6,
    longestStreak: 9,
    lastLoggedAt: isoDateTime(daysAgo(0)),
  },
  {
    id: uid(),
    area: 'finance',
    title: 'Pass CFA Level I',
    description: '~300 study hours. ~10 hrs/week now, ramping up. Order: Ethics → Quant → Econ → FRA → …',
    cadence: 'daily',
    questType: 'epic',
    difficultyRating: 5,
    priority: 1,
    targetUnit: 'study hours',
    targetAmount: 300,
    currentAmount: 42,
    milestones: [
      milestone('Ethics & Quant Methods done', 6),
      milestone('Economics + FRA done'),
      milestone('Corp Fin + Equity + Fixed Income done'),
      milestone('First full mock ≥ 70%'),
      milestone('CFA Level I — passed'),
    ],
    isBossBattle: false,
    createdAt: isoDateTime(daysAgo(30)),
    logs: logs(26, 29),
    currentStreak: 12,
    longestStreak: 14,
    lastLoggedAt: isoDateTime(daysAgo(0)),
  },
  {
    id: uid(),
    area: 'health',
    title: 'Gym 6× a week',
    description: 'Six sessions a week, Sunday rest. Energy first — everything else runs on it.',
    cadence: 'daily',
    questType: 'daily',
    difficultyRating: 3,
    priority: 2,
    targetUnit: 'sessions',
    milestones: [milestone('First full week (6 sessions)', 18), milestone('30 sessions logged'), milestone('100 sessions logged')],
    isBossBattle: false,
    createdAt: isoDateTime(daysAgo(26)),
    logs: logs(20, 25),
    currentStreak: 4,
    longestStreak: 11,
    lastLoggedAt: isoDateTime(daysAgo(1)),
  },
  {
    id: uid(),
    area: 'learning',
    title: 'Crack CAT 2027',
    description: 'Long runway — keep it warm now (~3 sessions/week: Quant, VARC, DILR). Serious prep from Apr 2027.',
    cadence: 'daily',
    questType: 'epic',
    difficultyRating: 4,
    priority: 3,
    milestones: [
      milestone('Quant fundamentals solid'),
      milestone('Daily reading habit established'),
      milestone('DILR sets — comfortable'),
      milestone('First full mock'),
      milestone('CAT 2027 — 99 %ile'),
    ],
    isBossBattle: false,
    createdAt: isoDateTime(daysAgo(20)),
    logs: logs(8, 18),
    currentStreak: 2,
    longestStreak: 5,
    lastLoggedAt: isoDateTime(daysAgo(2)),
  },
]

// --- schedule (this week) ----------------------------------------------------
const ev = (dayIdx, startTime, endTime, title, category, notes) => ({
  id: uid(),
  title,
  date: weekday(dayIdx),
  startTime,
  endTime,
  category,
  ...(notes ? { notes } : {}),
  createdAt: isoDateTime(daysAgo(7)),
  source: 'manual',
})
const EVENING = [
  ['CFA L1 — study session', 'finance'],
  ['CAT — Quant fundamentals', 'learning'],
  ['CFA L1 — study session', 'finance'],
  ['CAT — VARC (reading + RC)', 'learning'],
  ['CFA L1 — study session', 'finance'],
]
const schedule = []
for (let d = 0; d < 5; d++) {
  schedule.push(ev(d, '07:00', '08:00', 'Gym', 'health'))
  if (d < 4) schedule.push(ev(d, '09:00', '18:30', 'Stipend project — vibe coding (office)', 'career', 'The thing that pays.'))
  else {
    schedule.push(ev(d, '09:00', '16:00', 'Stipend project — vibe coding (office)', 'career'))
    schedule.push(ev(d, '16:00', '18:30', 'Demo & ship — stipend milestone', 'career', 'Deploy, write the 1-pager, send to mentor.'))
  }
  schedule.push(ev(d, '19:30', '21:30', EVENING[d][0], EVENING[d][1]))
}
schedule.push(ev(5, '09:00', '10:30', 'Gym (long session)', 'health'))
schedule.push(ev(5, '11:00', '13:00', 'CFA L1 — deep block (new material)', 'finance'))
schedule.push(ev(5, '14:00', '16:00', 'Stipend project — polish, demo doc', 'career'))
schedule.push(ev(5, '16:30', '18:00', 'CAT — DILR set + review', 'learning'))
schedule.push(ev(6, '11:00', '12:30', 'CFA — review the week + flashcards', 'finance'))
schedule.push(ev(6, '17:00', '17:30', 'Weekly review + plan next week', 'mind'))

// --- reminders ---------------------------------------------------------------
const rem = (title, dateISO, time, repeat, category, notes) => ({
  id: uid(),
  title,
  date: dateISO,
  time,
  repeat,
  category,
  ...(notes ? { notes } : {}),
  createdAt: isoDateTime(daysAgo(7)),
  source: 'manual',
})
const reminders = [
  rem('Gym — get up & go', isoDate(now), '06:45', 'daily', 'health'),
  rem('Evening study block starts', isoDate(now), '19:25', 'daily', 'learning'),
  rem('Send stipend progress to mentor', weekday(4), '16:00', 'weekly', 'career'),
  { ...rem('Call Mom', weekday(6), '19:00', 'once', 'relationships'), priority: 'high' },
  rem('Weekly review + plan next week', weekday(6), '17:00', 'weekly', 'mind'),
  { ...rem('Pay rent', isoDate(daysAgo(-3)), '10:00', 'monthly', 'finance'), priority: 'high' },
]

// --- assistant plan + ritual log + settings ----------------------------------
const planTime = at(now, 7, 55)
const PLAN = [
  '- **7:00 AM** — Gym (60 min). The day runs on this.',
  '- **8:30 AM** — Wake ritual + breakfast.',
  '- **9:00 AM – 12:30 PM** — Stipend project: ship the v1 demo. Deep-work block, phone away.',
  '- **12:30 PM** — Lunch + a walk.',
  '- **1:30 PM – 6:30 PM** — Office: polish, deploy, write the 1-pager for your mentor.',
  '- **7:30 PM – 9:30 PM** — CFA L1: Quantitative Methods.',
  '- **9:30 PM** — Reflect (3 lines), plan tomorrow.',
  '',
  "**Your mission today:** get the demo to a state you'd actually show someone. That's the boss.",
].join('\n')

const modules = {
  finite: { weeks: [] },
  ritual: { logs: [{ date: isoDate(now), completedStepIds: ['wake', 'move', 'feed', 'connect'] }] },
  oneDegree: { answers: [] },
  unsent: { drafts: [] },
  silence: { logs: [] },
  values: { scores: [], eulogy: { body: '', updatedAt: '' } },
}

const settings = {
  theme: 'default',
  notifications: 'granted',
  reduceMotion: false,
  hardModeXp: false,
  sound: {
    master: true,
    byCategory: { questComplete: true, levelUp: true, achievement: true, boss: true, streak: true, loot: true, streakBroken: true },
  },
  wakeTime: '07:00',
  windDownTime: '22:30',
  weeklyReviewDay: 0,
  anthropicApiKey: 'sk-ant-DEMO', // any non-empty string flips the assistant UI to "active"; no API calls are made
  quietHours: { from: '22:30', to: '07:00' },
}

const LOCAL_STORAGE_SEED = {
  'lifeos:v1:character': JSON.stringify(character),
  'lifeos:v1:goals': JSON.stringify(goals),
  'lifeos:v1:schedule': JSON.stringify(schedule),
  'lifeos:v1:reminders': JSON.stringify(reminders),
  'lifeos:v1:modules': JSON.stringify(modules),
  'lifeos:v1:settings': JSON.stringify(settings),
  'lifeos:v1:assistant_plan': JSON.stringify({ date: isoDate(now), content: PLAN, generatedAt: isoDateTime(planTime) }),
  // skip the on-boot demo seeds so we don't double up
  'lifeos:v1:seed_v1': 'true',
  'lifeos:v1:seed_goals_v1': 'true',
}

// --- pages & viewports -------------------------------------------------------
const PAGES = [
  ['01-today', '/'],
  ['02-goals', '/goals'],
  ['03-schedule', '/schedule'],
  ['04-season', '/season'],
  ['05-reminders', '/reminders'],
  ['06-profile', '/profile'],
  ['07-achievements', '/achievements'],
  ['08-ritual', '/ritual'],
]
const VIEWPORTS = [
  { id: 'ios-6.7', width: 430, height: 932, deviceScaleFactor: 3 }, // → 1290 × 2796 (App Store iPhone)
  { id: 'android-phone', width: 360, height: 640, deviceScaleFactor: 3 }, // → 1080 × 1920 (Play, within 2:1)
]
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// --- run ---------------------------------------------------------------------
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars'],
})
try {
  await browser.defaultBrowserContext().overridePermissions(BASE, ['notifications'])
  for (const vp of VIEWPORTS) {
    const outDir = path.join(root, 'screenshots', vp.id)
    await mkdir(outDir, { recursive: true })
    const page = await browser.newPage()
    await page.setViewport(vp)
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle2' })
    await page.evaluate((seed) => {
      for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v)
    }, LOCAL_STORAGE_SEED)
    for (const [name, route] of PAGES) {
      await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle2' })
      await sleep(1700) // let animations, fonts, and stores settle
      await page.screenshot({ path: path.join(outDir, `${name}.png`) })
      console.log(`✓ ${vp.id}/${name}.png  (${vp.width * vp.deviceScaleFactor}×${vp.height * vp.deviceScaleFactor})`)
    }
    await page.close()
  }
} finally {
  await browser.close()
}
console.log('\nDone — see ./screenshots/  (add caption overlays before uploading to the stores)')

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useCharacter } from '@/stores/characterStore'
import { useSettings } from '@/stores/settingsStore'
import { CLASSES, STARTING_CLASSES } from '@/data/classes'
import type { CharacterClassId, AreaId, Goal } from '@/types'
import { useGoals } from '@/stores/goalsStore'
import { AREA_LIST } from '@/data/areas'
import {
  AREA_ICONS,
  CLASS_ICONS,
  AVATAR_OPTIONS,
  BellRing,
} from '@/components/icons'
import { Sunrise, Cake, X } from 'lucide-react'
import { Avatar } from '@/components/character/Avatar'
import { useBirthdays } from '@/stores/birthdaysStore'
import { syncRoutineReminders } from '@/engine/dailyRemindersSync'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const REF_YEAR = 2000
const fromDateInput = (s: string): { month: number; day: number } => {
  const p = s.split('-').map(Number)
  return { month: p[1] || 1, day: p[2] || 1 }
}

interface DraftBirthday {
  name: string
  month: number
  day: number
}

export function Onboarding() {
  const nav = useNavigate()
  const initialise = useCharacter((s) => s.initialise)
  const addGoal = useGoals((s) => s.addGoal)
  const setSetting = useSettings((s) => s.set)
  const addBirthday = useBirthdays((s) => s.addBirthday)

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState<string>(AVATAR_OPTIONS[0].id)
  const [classId, setClassId] = useState<CharacterClassId>('builder')
  const [goalArea, setGoalArea] = useState<AreaId>('career')
  const [goalTitle, setGoalTitle] = useState('')

  // step 5 — daily routine + birthdays
  const [wakeT, setWakeT] = useState('07:00')
  const [breakfastT, setBreakfastT] = useState('08:00')
  const [lunchT, setLunchT] = useState('13:00')
  const [dinnerT, setDinnerT] = useState('20:00')
  const [routineReminders, setRoutineReminders] = useState(true)
  const [draftBirthdays, setDraftBirthdays] = useState<DraftBirthday[]>([])
  const [bdName, setBdName] = useState('')
  const [bdDate, setBdDate] = useState(`${REF_YEAR}-01-01`)

  const addDraftBirthday = () => {
    if (!bdName.trim()) return
    const { month, day } = fromDateInput(bdDate)
    setDraftBirthdays((bs) => [...bs, { name: bdName.trim(), month, day }])
    setBdName('')
  }

  const next = () => setStep((s) => s + 1)
  const prev = () => setStep((s) => Math.max(0, s - 1))

  const finish = async () => {
    initialise({ name, avatar, startingClass: classId })
    if (goalTitle.trim()) {
      const goal: Omit<Goal, 'id' | 'createdAt' | 'logs' | 'currentStreak' | 'longestStreak'> = {
        area: goalArea,
        title: goalTitle.trim(),
        cadence: 'daily',
        questType: 'daily',
        difficultyRating: 3,
        priority: 1,
        milestones: [],
        isBossBattle: false,
      }
      addGoal(goal)
    }
    // daily routine
    setSetting('wakeTime', wakeT)
    setSetting('breakfastTime', breakfastT)
    setSetting('lunchTime', lunchT)
    setSetting('dinnerTime', dinnerT)
    setSetting('wakeAlarm', routineReminders)
    setSetting('mealReminders', routineReminders)
    syncRoutineReminders()
    // birthdays
    for (const b of draftBirthdays) addBirthday(b)
    nav('/')
  }

  const requestNotifications = async () => {
    const N = typeof window !== 'undefined' ? window.Notification : undefined
    if (!N) {
      setSetting('notifications', 'denied')
      next()
      return
    }
    try {
      const r = await N.requestPermission()
      setSetting('notifications', r === 'granted' ? 'granted' : 'denied')
    } catch {
      setSetting('notifications', 'denied')
    }
    next()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center max-w-xl"
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-[10px] uppercase tracking-[0.5em] text-muted mb-4"
            >
              ─── a new game begins ───
            </motion.div>
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="font-display text-6xl md:text-7xl tracking-[0.06em] mb-6 text-balance text-accent"
            >
              RYSE
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-muted text-lg leading-relaxed mb-10 text-balance"
            >
              Real life is the most important game you will ever play.<br />
              It has goals. It has streaks. It has boss battles.<br />
              It just never came with a HUD.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <Button size="lg" onClick={next}>Start your journey →</Button>
            </motion.div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="1"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="max-w-md w-full"
          >
            <Card className="p-7">
              <div className="text-[10px] uppercase tracking-[0.4em] text-muted mb-2">
                step 1 of 6
              </div>
              <h2 className="font-display text-3xl tracking-wide mb-2">
                Name your character.
              </h2>
              <p className="text-muted text-sm mb-6 leading-relaxed">
                This is who you are. What you do next is who you become.
              </p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-surface2 border border-border rounded-lg px-4 py-3 mb-6 focus:outline-none focus:border-accent"
                autoFocus
              />
              <div className="text-xs text-muted mb-2">Pick an avatar</div>
              <div className="grid grid-cols-6 gap-2 mb-6 max-h-56 overflow-y-auto pr-1">
                {AVATAR_OPTIONS.map((a) => {
                  const selected = a.id === avatar
                  return (
                    <button
                      key={a.id}
                      onClick={() => setAvatar(a.id)}
                      title={a.label}
                      aria-label={a.label}
                      className={`aspect-square rounded-lg border p-1 transition flex items-center justify-center ${
                        selected
                          ? 'border-accent bg-accent/10 ring-1 ring-accent/40'
                          : 'border-border bg-surface2/40 hover:bg-surface2'
                      }`}
                    >
                      <Avatar id={a.id} alt={a.label} className="h-full w-full" />
                    </button>
                  )
                })}
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={prev}>
                  Back
                </Button>
                <Button disabled={!name.trim()} onClick={next}>
                  Next →
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="2"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="max-w-2xl w-full"
          >
            <div className="text-[10px] uppercase tracking-[0.4em] text-muted mb-2 text-center">
              step 2 of 6
            </div>
            <h2 className="font-display text-3xl tracking-wide mb-2 text-center">
              Choose your starting class.
            </h2>
            <p className="text-muted text-sm mb-6 text-center max-w-md mx-auto">
              You can change this. But choose honestly.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {STARTING_CLASSES.map((id) => {
                const c = CLASSES[id]
                const selected = classId === id
                const ClsIcon = CLASS_ICONS[id]
                return (
                  <button
                    key={id}
                    onClick={() => setClassId(id)}
                    className={`p-5 rounded-2xl border text-left transition ${
                      selected
                        ? 'border-accent bg-accent/10 shadow-glow'
                        : 'border-border bg-surface hover:border-accent/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                          selected
                            ? 'bg-accent/15 text-accent'
                            : 'bg-surface2/60 text-accent2'
                        }`}
                      >
                        <ClsIcon className="w-6 h-6" strokeWidth={1.6} />
                      </div>
                      <div>
                        <div className="font-display text-xl">{c.name}</div>
                        <div className="text-xs text-muted mb-2">{c.tagline}</div>
                        <div className="text-sm text-text/80 leading-relaxed">
                          {c.description}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {c.primaryAreas.map((a) => (
                            <span
                              key={a}
                              className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full"
                              style={{
                                background: `rgb(var(--${a}) / 0.15)`,
                                color: `rgb(var(--${a}))`,
                                border: `1px solid rgb(var(--${a}) / 0.4)`,
                              }}
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={prev}>Back</Button>
              <Button onClick={next}>Next →</Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="3"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="max-w-md w-full"
          >
            <Card className="p-7">
              <div className="text-[10px] uppercase tracking-[0.4em] text-muted mb-2">
                step 3 of 6
              </div>
              <h2 className="font-display text-3xl tracking-wide mb-2">
                Your first quest.
              </h2>
              <p className="text-muted text-sm mb-6 leading-relaxed">
                Every hero needs one. What's yours?
              </p>
              <div className="text-xs text-muted mb-2">Area</div>
              <div className="flex gap-1.5 flex-wrap mb-4">
                {AREA_LIST.map((a) => {
                  const Icon = AREA_ICONS[a.id]
                  const selected = goalArea === a.id
                  return (
                    <button
                      key={a.id}
                      onClick={() => setGoalArea(a.id)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition inline-flex items-center gap-1.5 ${
                        selected
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border text-muted hover:text-text'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
                      {a.name}
                    </button>
                  )
                })}
              </div>
              <div className="text-xs text-muted mb-2">Goal title</div>
              <input
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="e.g. Hit the gym 4× a week"
                className="w-full bg-surface2 border border-border rounded-lg px-4 py-3 mb-6 focus:outline-none focus:border-accent"
              />
              <div className="flex justify-between">
                <Button variant="ghost" onClick={prev}>Back</Button>
                <Button disabled={!goalTitle.trim()} onClick={next}>
                  Next →
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="4"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="max-w-md w-full"
          >
            <Card className="p-7 text-center">
              <div className="text-[10px] uppercase tracking-[0.4em] text-muted mb-2">
                step 4 of 6
              </div>
              <h2 className="font-display text-3xl tracking-wide mb-2">
                Enable your assistant.
              </h2>
              <p className="text-muted text-sm mb-6 leading-relaxed">
                Smart nudges. Never spam. Always relevant.<br />
                Watches your back when you forget.
              </p>
              <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 text-accent mx-auto">
                <BellRing className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={requestNotifications}>Allow notifications</Button>
                <Button variant="subtle" onClick={next}>Skip for now</Button>
              </div>
            </Card>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div
            key="5"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="max-w-md w-full"
          >
            <Card className="p-7">
              <div className="text-[10px] uppercase tracking-[0.4em] text-muted mb-2">step 5 of 6</div>
              <h2 className="font-display text-3xl tracking-wide mb-1 flex items-center gap-2">
                <Sunrise className="w-6 h-6 text-accent" strokeWidth={1.7} />
                Your day & people.
              </h2>
              <p className="text-muted text-sm mb-5 leading-relaxed">
                When do you usually wake and eat? And whose birthday should Ryse never let you forget?
                (All optional — change it anytime in Settings.)
              </p>

              <div className="grid grid-cols-2 gap-3 mb-3">
                {(
                  [
                    ['Wake', wakeT, setWakeT],
                    ['Breakfast', breakfastT, setBreakfastT],
                    ['Lunch', lunchT, setLunchT],
                    ['Dinner', dinnerT, setDinnerT],
                  ] as const
                ).map(([label, value, set]) => (
                  <div key={label}>
                    <div className="text-[10px] uppercase tracking-wide text-muted mb-1.5">{label}</div>
                    <input
                      type="time"
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50"
                    />
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-2 cursor-pointer mb-6 text-sm">
                <input
                  type="checkbox"
                  checked={routineReminders}
                  onChange={(e) => setRoutineReminders(e.target.checked)}
                />
                Remind me at these times
              </label>

              <div className="text-xs text-muted mb-2 flex items-center gap-1.5">
                <Cake className="w-3.5 h-3.5 text-accent2" /> Birthdays
              </div>
              {draftBirthdays.length > 0 && (
                <ul className="space-y-1.5 mb-2 max-h-32 overflow-y-auto">
                  {draftBirthdays.map((b, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm rounded-lg border border-border bg-surface2/30 px-3 py-1.5"
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {b.name} <span className="text-muted">· {MONTHS[b.month - 1]} {b.day}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setDraftBirthdays((bs) => bs.filter((_, j) => j !== i))}
                        className="text-muted hover:text-red-400"
                        aria-label="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2 mb-1">
                <input
                  value={bdName}
                  onChange={(e) => setBdName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addDraftBirthday()
                    }
                  }}
                  placeholder="Name"
                  className="flex-1 min-w-0 bg-surface2 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50"
                />
                <input
                  type="date"
                  value={bdDate}
                  onChange={(e) => setBdDate(e.target.value)}
                  className="bg-surface2 border border-border rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-accent/50"
                />
                <Button type="button" size="sm" variant="ghost" disabled={!bdName.trim()} onClick={addDraftBirthday}>
                  Add
                </Button>
              </div>
              <div className="text-[10px] text-muted/60 mb-6">Year ignored. Add more anytime in Birthdays.</div>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={prev}>Back</Button>
                <Button onClick={next}>Next →</Button>
              </div>
            </Card>
          </motion.div>
        )}

        {step === 6 && (
          <motion.div
            key="6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-md w-full text-center"
          >
            <Card className="p-8 shadow-glow">
              <div className="text-[10px] uppercase tracking-[0.4em] text-muted mb-2">
                step 6 of 6
              </div>
              <Avatar
                id={avatar}
                className="mb-3 w-24 h-24 border-2 border-accent/40 text-accent shadow-glow mx-auto"
              />
              <h2 className="font-display text-3xl tracking-wide">{name}</h2>
              <div className="text-muted text-sm mb-2">
                {CLASSES[classId].name}
              </div>
              <div className="text-xs text-accent mb-6">Level 1 · Wanderer</div>
              <p className="text-muted text-sm leading-relaxed mb-6">
                Your journey starts now. Most people quit by day 9.<br />
                Be most people, or don't.
              </p>
              <Button size="lg" onClick={finish}>Enter Ryse →</Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

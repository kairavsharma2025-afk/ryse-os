// ===== Life Areas =====

export type AreaId =
  | 'career'
  | 'health'
  | 'relationships'
  | 'finance'
  | 'learning'
  | 'mind'

export const AREA_IDS: AreaId[] = [
  'career',
  'health',
  'relationships',
  'finance',
  'learning',
  'mind',
]

export interface AreaMeta {
  id: AreaId
  name: string
  color: string // tailwind colour token name
  emoji: string
  description: string
}

// ===== Character =====

export interface CharacterStats {
  career: number
  health: number
  relationships: number
  finance: number
  learning: number
  mind: number
}

export type CharacterClassId =
  | 'operator'
  | 'monk'
  | 'scholar'
  | 'empath'
  | 'generalist'
  | 'builder'
  | 'warrior'
  | 'connector'
  | 'sovereign'
  | 'wanderer'

export interface CharacterClass {
  id: CharacterClassId
  name: string
  tagline: string
  description: string
  primaryAreas: AreaId[]
  emoji: string
}

export interface Character {
  initialised: boolean
  name: string
  avatar: string
  classId: CharacterClassId
  startingClassId: CharacterClassId
  level: number
  xp: number
  stats: CharacterStats
  titles: string[]
  activeTitle: string
  unlockedThemes: string[]
  activeTheme: string
  unlockedAvatarFrames: string[]
  activeAvatarFrame: string
  achievements: string[]
  loot: LootItem[]
  createdAt: string
  lastOpenedAt: string
  daysOpened: string[] // ISO date strings, dedup
  streakShields: number // 1 saved per month
  shieldLastGrantedMonth: string // YYYY-MM
}

// ===== Goals =====

export type GoalCadence =
  | 'daily'
  | 'weekdays'
  | 'weekly'
  | 'monthly'
  | 'oneoff'

export type QuestType = 'daily' | 'weekly' | 'monthly' | 'epic'

export interface Milestone {
  id: string
  title: string
  completedAt?: string
}

export interface BossBattleConfig {
  bossName: string
  bossDescription: string
  bossHp: number
  currentHp: number
  damagePerLog: number
  bossCounterattack: string
  rewardBadgeId: string
  rewardThemeId?: string
  defeated?: boolean
}

export interface ProgressLog {
  id: string
  date: string // ISO date
  note?: string
  amount?: number
  xpAwarded: number
}

export interface Goal {
  id: string
  area: AreaId
  title: string
  description?: string
  cadence: GoalCadence
  questType: QuestType
  difficultyRating: 1 | 2 | 3 | 4 | 5
  priority: 1 | 2 | 3 // 1 = highest
  targetUnit?: string
  targetAmount?: number
  currentAmount?: number
  milestones: Milestone[]
  isBossBattle: boolean
  bossBattleConfig?: BossBattleConfig
  gamePoints?: number
  createdAt: string
  archivedAt?: string
  completedAt?: string
  logs: ProgressLog[]
  // streak
  currentStreak: number
  longestStreak: number
  lastLoggedAt?: string
}

// ===== Quests =====

export interface Quest {
  id: string
  generatedFor: string // ISO date YYYY-MM-DD
  title: string
  description: string
  xpReward: number
  bonusCondition?: string
  bonusXp?: number
  linkedGoalId?: string
  linkedModule?: ModuleId
  expiresAt: string
  completedAt?: string
  skippedAt?: string
  source: QuestSource
}

export type QuestSource =
  | 'most-neglected'
  | 'highest-priority'
  | 'wildcard-ritual'
  | 'wildcard-onedegree'
  | 'wildcard-unsent'
  | 'wildcard-finite'
  | 'wildcard-overdue'
  | 'wildcard-silence'

// ===== Achievements =====

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  rarity: Rarity
  xpReward: number
  unlocksTitle?: string
  unlocksTheme?: string
  unlocksFrame?: string
  hint: string // shown until unlocked
}

export interface AchievementProgress {
  unlockedAt?: string
  progress?: number // 0..1
}

// ===== Loot =====

export type LootType =
  | 'theme'
  | 'avatarFrame'
  | 'title'
  | 'quoteSet'
  | 'effect'

export interface LootItem {
  id: string
  refId: string // theme id, frame id, title text, etc.
  name: string
  type: LootType
  rarity: Rarity
  description: string
  unlockedAt: string
  source: string
}

// ===== Seasons =====

export interface Season {
  id: string
  number: number
  name: string
  theme: string
  focusAreas: AreaId[]
  bossName: string
  bossDescription: string
  bossInitialHp: number
  reward: {
    title: string
    themeId?: string
    badgeEmoji: string
  }
  flavour: string[]
}

export interface SeasonState {
  currentSeasonId: string
  startDate: string
  endDate: string
  bossHp: number
  // accumulators
  questsCompleted: number
  goalsCompleted: number
  bossBattlesWon: number
  // history
  pastSeasons: Array<{
    seasonId: string
    startDate: string
    endDate: string
    questsCompleted: number
    goalsCompleted: number
    bossBattlesWon: number
    rewardClaimed: boolean
  }>
}

// ===== Modules =====

export type ModuleId =
  | 'finite'
  | 'ritual'
  | 'onedegree'
  | 'unsent'
  | 'silence'
  | 'values'

// Finite — week grid
export interface FiniteWeek {
  isoYear: number
  isoWeek: number
  status: 'gray' | 'green' | 'amber' | 'gold' | 'boss' | 'broken'
  note?: string
}

// Ritual
export interface RitualStep {
  id: string
  emoji: string
  label: string
  description: string
  xpReward: number
}
export interface RitualLog {
  date: string // YYYY-MM-DD
  completedStepIds: string[]
}

// One Degree
export interface OneDegreeQuestion {
  id: string
  text: string
  category: 'self' | 'world' | 'people' | 'future' | 'past' | 'craft'
}
export interface OneDegreeAnswer {
  id: string
  questionId: string
  text: string
  date: string
}

// Unsent
export interface UnsentDraft {
  id: string
  recipient: string
  subject?: string
  body: string
  createdAt: string
  updatedAt: string
  burnedAt?: string
}

// Silence
export interface SilenceLog {
  id: string
  trigger: string
  emotion: string
  pattern?: string
  insight?: string
  createdAt: string
}

// Values + eulogy
export interface ValuesScore {
  id: string
  // simple 0-10 self-rating
  ratings: Record<string, number>
  date: string
}
export interface Eulogy {
  body: string
  updatedAt: string
}

// ===== Settings =====

export type SoundCategory =
  | 'questComplete'
  | 'levelUp'
  | 'achievement'
  | 'boss'
  | 'streak'
  | 'loot'
  | 'streakBroken'

export interface SoundSettings {
  master: boolean
  byCategory: Record<SoundCategory, boolean>
}

export interface Settings {
  theme: string
  notifications: 'unknown' | 'granted' | 'denied'
  reduceMotion: boolean
  hardModeXp: boolean // 0.7x XP, +25% achievement aura
  sound: SoundSettings
  wakeTime: string // HH:mm
  windDownTime: string // HH:mm
  weeklyReviewDay: number // 0-6, Sunday=0
  anthropicApiKey: string // for the AI assistant; '' = disabled
  quietHours?: { from: string; to: string } // HH:mm; reminders in this window defer to `to`
  // Daily routine — backed by auto-managed daily reminders (source 'wake' / 'meal').
  wakeAlarm: boolean // fire a wake-up nudge at wakeTime
  mealReminders: boolean // fire reminders at breakfast/lunch/dinner times
  breakfastTime: string // HH:mm
  lunchTime: string // HH:mm
  dinnerTime: string // HH:mm
  // Ride nudges (side feature) — proactive "time to leave the office, book an Uber?" card.
  rideNudges: boolean
  officeLeaveLeadMin: number // minutes before the office block ends to nudge
}

// ===== Schedule =====

export interface ScheduleEvent {
  id: string
  title: string
  date: string // YYYY-MM-DD
  startTime: string // HH:mm (24h)
  endTime: string // HH:mm (24h)
  category: AreaId
  notes?: string
  createdAt: string
  source?: 'manual' | 'assistant'
}

// ===== Reminders =====

export type ReminderRepeat = 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly'

export type ReminderPriority = 'low' | 'normal' | 'high'

export type ReminderSource = 'manual' | 'assistant' | 'meal' | 'wake' | 'birthday'

export interface Reminder {
  id: string
  title: string
  date: string // YYYY-MM-DD — first/anchor date (day-of-week for weekly; day-of-month for monthly; month+day for yearly)
  time: string // HH:mm (24h)
  repeat: ReminderRepeat
  category: AreaId
  notes?: string
  createdAt: string
  source?: ReminderSource
  lastFiredOn?: string // YYYY-MM-DD it last fired
  done?: boolean // 'once' reminders done; or manually completed
  priority?: ReminderPriority // defaults to 'normal'
  goalId?: string // optional link to a Goal
  snoozedUntil?: string // ISO datetime — overrides the next fire time once
}

// ===== Birthdays =====

export interface Birthday {
  id: string
  name: string
  month: number // 1-12
  day: number // 1-31
  relation?: string // e.g. "Mom", "best friend"
  notes?: string
  createdAt: string
  lastNotifiedOn?: string // YYYY-MM-DD the "today" notification last fired
  lastHeraldedOn?: string // YYYY-MM-DD the "tomorrow" heads-up last fired
}

// ===== AI Assistant =====

export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: string
}

export interface DailyPlan {
  date: string // YYYY-MM-DD
  content: string
  generatedAt: string
}

// ===== Notifications =====

export interface Notification {
  id: string
  createdAt: string
  readAt?: string
  type: 'quest' | 'streak' | 'level' | 'achievement' | 'boss' | 'season' | 'context' | 'system'
  title: string
  body: string
  ctaLabel?: string
  ctaPath?: string
  emoji?: string
}

// ===== Celebration queue =====

export type CelebrationKind =
  | 'levelUp'
  | 'achievement'
  | 'loot'
  | 'questComplete'
  | 'streakMilestone'
  | 'bossDefeated'
  | 'perfectDay'

export interface Celebration {
  id: string
  kind: CelebrationKind
  payload: Record<string, unknown>
}

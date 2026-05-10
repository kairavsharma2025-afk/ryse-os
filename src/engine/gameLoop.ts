// Central orchestrator: callable from any UI action.
// Awards XP, checks achievements, fires celebrations, updates stats, ensures season.

import { useCharacter } from '@/stores/characterStore'
import { useGoals } from '@/stores/goalsStore'
import { useQuests } from '@/stores/questsStore'
import { useModules } from '@/stores/modulesStore'
import { useSeason } from '@/stores/seasonStore'
import { useCelebrations } from '@/stores/celebrationStore'
import { useNotifications } from '@/stores/notificationsStore'
import { useSettings } from '@/stores/settingsStore'

import { applyHardMode } from './xpEngine'
import { computeStats } from './statEngine'
import { checkAchievements } from './achievementChecker'
import { masteryForArea } from './masteryEngine'
import { getAchievement } from '@/data/achievements'
import { THEMES } from '@/data/themes'
import { seedOnce, seedGoalsOnce } from '@/data/seed'
import { syncRoutineReminders } from './dailyRemindersSync'
import type { LootItem, ModuleId, Rarity, Achievement } from '@/types'
import { AREA_IDS } from '@/types'
import { nowISO, todayISO, daysBetween } from './dates'

function rarityFromXp(xp: number): Rarity {
  if (xp >= 800) return 'legendary'
  if (xp >= 350) return 'epic'
  if (xp >= 120) return 'rare'
  return 'common'
}

export function awardXp(amount: number, opts?: { silent?: boolean; source?: string }): number {
  if (amount <= 0) return 0
  const settings = useSettings.getState()
  const finalAmount = applyHardMode(amount, settings.hardModeXp)
  const result = useCharacter.getState().applyXp(finalAmount)
  if (result.gained && !opts?.silent) {
    useCelebrations.getState().push('levelUp', {
      oldLevel: result.oldLevel,
      newLevel: result.newLevel,
    })
    useNotifications.getState().push({
      type: 'level',
      title: `Level ${result.newLevel} reached.`,
      body: `You crossed a threshold. Earned through ${opts?.source ?? 'living'}.`,
      emoji: '⬆️',
    })
  }
  return finalAmount
}

export function recomputeStats() {
  const goals = useGoals.getState().goals
  const baseline = useCharacter.getState().stats
  const next = computeStats(goals, baseline)
  useCharacter.getState().setStats(next)
}

// Run on app entry every load
export function runOpeningTick() {
  const char = useCharacter.getState()
  if (!char.initialised) return
  char.recordOpened()
  seedGoalsOnce()
  syncRoutineReminders()
  useSeason.getState().ensureNotExpired()
  useQuests.getState().ensureToday()
  recomputeStats()
  evaluateAchievements()
  seedOnce()
}

// Build the AchievementContext once per check
function buildContext() {
  const goals = useGoals.getState().goals
  const m = useModules.getState()
  const c = useCharacter.getState()
  const season = useSeason.getState()
  const today = todayISO()

  const days = c.daysOpened
  let consec = 0
  if (days.length > 0) {
    const sorted = [...days].sort()
    consec = 1
    for (let i = sorted.length - 1; i > 0; i--) {
      const diff = daysBetween(sorted[i - 1], sorted[i])
      if (diff === 1) consec++
      else break
    }
  }

  const longestEverStreak = goals.reduce(
    (max, g) => Math.max(max, g.longestStreak),
    0
  )

  // mastered area?
  const masteredArea = AREA_IDS.some((a) => masteryForArea(a, goals).mastery >= 5)

  // perfect days = days where 3 quests completed (history)
  const qHistory = useQuests.getState().history
  const perfectDays = (() => {
    const byDay = new Map<string, number>()
    for (const q of qHistory) {
      if (!q.completedAt) continue
      const d = q.completedAt.slice(0, 10)
      byDay.set(d, (byDay.get(d) ?? 0) + 1)
    }
    let count = 0
    byDay.forEach((v) => {
      if (v >= 3) count++
    })
    return count
  })()

  const greenWeeksThisYear = (() => {
    const y = new Date().getFullYear()
    return m.finite.weeks.filter(
      (w) => w.isoYear === y && (w.status === 'green' || w.status === 'gold')
    ).length
  })()
  const graysEver = m.finite.weeks.filter((w) => w.status === 'gray').length
  const goldsEver = m.finite.weeks.filter((w) => w.status === 'gold').length

  // perfect ritual streak
  const ritualLogs = m.ritual.logs
  let perfectRitualDaysConsecutive = 0
  for (const log of [...ritualLogs].sort((a, b) => (a.date < b.date ? 1 : -1))) {
    if (log.completedStepIds.length >= 6) perfectRitualDaysConsecutive++
    else break
  }

  // unsent to parents (heuristic match)
  const parentRegex = /\b(mom|mum|dad|father|mother|papa|baba|appa|amma|maa)\b/i
  const unsentToParents = m.unsent.drafts.filter((d) => parentRegex.test(d.recipient)).length

  // longestGoalDurationDays
  const longestGoalDurationDays = goals.reduce((max, g) => {
    if (!g.completedAt) return max
    const dur = daysBetween(g.createdAt.slice(0, 10), g.completedAt.slice(0, 10))
    return Math.max(max, dur)
  }, 0)

  const fiveStreaksAchieved = goals.filter((g) => g.currentStreak >= 7).length >= 5

  return {
    goals,
    unsentCount: m.unsent.drafts.length,
    unsentToParents,
    oneDegreeCount: m.oneDegree.answers.length,
    silenceCount: m.silence.logs.length,
    daysOpened: c.daysOpened.length,
    consecutiveDaysOpened: consec,
    bossBattlesWon: goals.filter((g) => g.bossBattleConfig?.defeated).length,
    perfectDays,
    greenWeeksThisYear,
    graysEver,
    goldsEver,
    perfectRitualDaysConsecutive,
    level: c.level,
    unlockedModules: new Set<ModuleId>(),
    comebackStreakAchieved: false, // refined later via recordComeback
    phoenixCount: 0,
    eulogyChars: m.values.eulogy.body.length,
    masteredArea,
    seasonalBossesCompleted: season.pastSeasons.filter((p) => p.rewardClaimed).length,
    totalCompletedGoals: goals.filter((g) => g.completedAt).length,
    longestEverStreak,
    longestGoalDurationDays,
    fiveStreaksAchieved,
    today,
  }
}

export function evaluateAchievements() {
  const c = useCharacter.getState()
  const ctx = buildContext()
  const already = new Set(c.achievements)
  const newly = checkAchievements(ctx, already)
  for (const ach of newly) {
    grantAchievement(ach)
  }
}

export function grantAchievement(ach: Achievement) {
  const c = useCharacter.getState()
  if (c.achievements.includes(ach.id)) return
  c.addAchievement(ach.id)
  awardXp(ach.xpReward, { silent: true, source: `achievement: ${ach.name}` })
  useCelebrations.getState().push('achievement', { id: ach.id })
  useNotifications.getState().push({
    type: 'achievement',
    title: `Achievement: ${ach.name}`,
    body: ach.description,
    emoji: ach.icon,
  })
  if (ach.unlocksTitle) {
    c.unlockTitle(ach.unlocksTitle)
  }
  if (ach.unlocksTheme) {
    if (c.unlockTheme(ach.unlocksTheme)) {
      const theme = THEMES.find((t) => t.id === ach.unlocksTheme)
      if (theme) {
        const loot: LootItem = {
          id: crypto.randomUUID(),
          refId: theme.id,
          name: theme.name,
          type: 'theme',
          rarity: theme.rarity,
          description: theme.description,
          unlockedAt: nowISO(),
          source: `Achievement: ${ach.name}`,
        }
        c.addLoot(loot)
        useCelebrations.getState().push('loot', { lootId: loot.id })
      }
    }
  }
}

export function dropLootForRarity(args: {
  rarity: Rarity
  source: string
}): LootItem | undefined {
  const c = useCharacter.getState()
  const candidates = THEMES.filter(
    (t) => t.rarity === args.rarity && !c.unlockedThemes.includes(t.id)
  )
  if (candidates.length === 0) {
    // grant a title fallback
    const title = `Bearer of the ${args.rarity[0].toUpperCase() + args.rarity.slice(1)}`
    if (c.unlockTitle(title)) {
      const loot: LootItem = {
        id: crypto.randomUUID(),
        refId: title,
        name: title,
        type: 'title',
        rarity: args.rarity,
        description: 'A title earned in battle.',
        unlockedAt: nowISO(),
        source: args.source,
      }
      c.addLoot(loot)
      useCelebrations.getState().push('loot', { lootId: loot.id })
      return loot
    }
    return undefined
  }
  const theme = candidates[Math.floor(Math.random() * candidates.length)]
  c.unlockTheme(theme.id)
  const loot: LootItem = {
    id: crypto.randomUUID(),
    refId: theme.id,
    name: theme.name,
    type: 'theme',
    rarity: theme.rarity,
    description: theme.description,
    unlockedAt: nowISO(),
    source: args.source,
  }
  c.addLoot(loot)
  useCelebrations.getState().push('loot', { lootId: loot.id })
  return loot
}

// ===== High-level actions =====

export function actionLogGoal(goalId: string, opts?: { note?: string; amount?: number }) {
  const result = useGoals.getState().logProgress(goalId, opts)
  if (result.alreadyLoggedToday) {
    useNotifications.getState().push({
      type: 'system',
      title: 'Already logged today',
      body: 'XP capped at one log per goal per day.',
      emoji: '⏱️',
    })
    return result
  }
  awardXp(result.xp, { source: 'goal log' })
  if (result.isMilestone && result.milestoneDays) {
    useCelebrations.getState().push('streakMilestone', { days: result.milestoneDays })
    awardXp(
      result.milestoneDays === 7 ? 200 : result.milestoneDays === 30 ? 500 : 100,
      { silent: true, source: 'streak milestone' }
    )
  }
  if (result.bossDamageDealt) {
    awardXp(60, { silent: true, source: 'boss strike' })
  }
  if (result.bossDefeated) {
    useCelebrations.getState().push('bossDefeated', { goalId })
    awardXp(800, { silent: true, source: 'boss defeated' })
    dropLootForRarity({ rarity: 'epic', source: 'Boss defeated' })
    useSeason.getState().recordBossWin()
  }
  recomputeStats()
  evaluateAchievements()
  return result
}

export function actionCompleteGoal(goalId: string) {
  useGoals.getState().completeGoal(goalId)
  awardXp(400, { source: 'goal complete' })
  dropLootForRarity({ rarity: 'rare', source: 'Goal completed' })
  useSeason.getState().recordGoalComplete()
  recomputeStats()
  evaluateAchievements()
}

export function actionCompleteQuest(questId: string) {
  const { quest, allDone, xp, bonusXp } = useQuests.getState().completeQuest(questId)
  if (!quest) return
  awardXp(xp + bonusXp, { source: 'quest complete' })
  useCelebrations.getState().push('questComplete', { id: quest.id, xp: xp + bonusXp })
  useSeason.getState().recordQuestComplete()
  if (allDone) {
    awardXp(100, { silent: true, source: 'perfect day bonus' })
    useCelebrations.getState().push('perfectDay', {})
    useNotifications.getState().push({
      type: 'quest',
      title: 'Perfect Day.',
      body: 'All three daily quests completed. +100 bonus XP.',
    })
  }
  evaluateAchievements()
}

export function actionRitualToggle(stepId: string) {
  const r = useModules.getState().toggleRitualStep(stepId)
  awardXp(15, { source: 'ritual step' })
  if (r.allCompleted) {
    awardXp(50, { silent: true, source: 'perfect ritual bonus' })
    useNotifications.getState().push({
      type: 'system',
      title: 'Perfect Ritual',
      body: 'All 6 daily ritual steps. +50 bonus XP.',
    })
  }
  evaluateAchievements()
  return r
}

export function actionAnswerOneDegree(questionId: string, text: string) {
  useModules.getState().saveAnswer({ questionId, text })
  awardXp(15, { source: 'one degree' })
  evaluateAchievements()
}

export function actionWriteUnsent(input: { recipient: string; subject?: string; body: string }) {
  useModules.getState().addDraft(input)
  awardXp(20, { source: 'unsent draft' })
  evaluateAchievements()
}

export function actionLogSilence(input: { trigger: string; emotion: string; pattern?: string; insight?: string }) {
  useModules.getState().addSilence(input)
  awardXp(12, { source: 'silence log' })
  evaluateAchievements()
}

export function actionMarkWeek(args: {
  isoYear: number
  isoWeek: number
  status: 'gray' | 'green' | 'amber' | 'gold' | 'boss' | 'broken'
  note?: string
}) {
  useModules.getState().setWeekStatus(args)
  const xpMap = { gray: 10, green: 40, amber: 20, gold: 80, boss: 50, broken: 5 } as const
  awardXp(xpMap[args.status], { source: 'finite week mark' })
  evaluateAchievements()
}

export function actionSaveEulogy(body: string) {
  useModules.getState().saveEulogy(body)
  awardXp(20, { source: 'eulogy update' })
  evaluateAchievements()
}

export function actionSaveValuesScore(ratings: Record<string, number>) {
  useModules.getState().saveValues(ratings)
  awardXp(30, { source: 'values score' })
  evaluateAchievements()
}

export function actionApplyShield(): boolean {
  const c = useCharacter.getState()
  if (c.streakShields <= 0) {
    useNotifications.getState().push({
      type: 'streak',
      title: 'No shields available.',
      body: 'Shields regenerate on the 1st of each month.',
      emoji: '🛡️',
    })
    return false
  }
  const goals = useGoals.getState().goals
  const hasBroken = goals.some((g) => {
    if (!g.lastLoggedAt || g.currentStreak === 0) return false
    const last = g.lastLoggedAt.slice(0, 10)
    const t = todayISO()
    return daysBetween(last, t) > 1
  })
  if (!hasBroken) {
    useNotifications.getState().push({
      type: 'streak',
      title: 'No broken streaks to shield.',
      body: 'Save it for when you need it.',
      emoji: '🛡️',
    })
    return false
  }
  c.consumeShield()
  const r = useGoals.getState().applyShieldToBrokenStreaks()
  useNotifications.getState().push({
    type: 'streak',
    title: 'Streak Shield used.',
    body: `${r.restored} streak${r.restored === 1 ? '' : 's'} preserved. Don't waste this gift.`,
    emoji: '🛡️',
  })
  return true
}

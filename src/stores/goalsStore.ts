import { create } from 'zustand'
import type { Goal, ProgressLog, BossBattleConfig, AreaId } from '@/types'
import { loadJSON, saveJSON } from './persist'
import { nowISO, todayISO } from '@/engine/dates'
import { nextStreak, isStreakBroken } from '@/engine/streakEngine'
import { XP, DIFFICULTY_MULTIPLIER, streakMultiplier } from '@/data/xp'

interface GoalsState {
  goals: Goal[]
  addGoal(input: Omit<Goal, 'id' | 'createdAt' | 'logs' | 'currentStreak' | 'longestStreak'>): Goal
  updateGoal(id: string, patch: Partial<Goal>): void
  archiveGoal(id: string): void
  deleteGoal(id: string): void
  completeGoal(id: string): void
  addMilestone(id: string, title: string): void
  toggleMilestone(goalId: string, milestoneId: string): void
  enableBoss(goalId: string, cfg: BossBattleConfig): void
  // Logs progress for today. Returns XP awarded + streak info.
  logProgress(goalId: string, opts?: { note?: string; amount?: number }): {
    xp: number
    newStreak: number
    isMilestone: boolean
    milestoneDays?: number
    bossDamageDealt?: number
    bossDefeated?: boolean
    alreadyLoggedToday: boolean
  }
  // Apply a streak shield that protects a broken streak
  applyShieldToBrokenStreaks(): { restored: number }
  goalById(id: string): Goal | undefined
  goalsByArea(area: AreaId): Goal[]
}

const initial = loadJSON<Goal[]>('goals', [])

function persist(state: GoalsState) {
  saveJSON('goals', state.goals)
}

export const useGoals = create<GoalsState>((set, get) => ({
  goals: initial,

  addGoal: (input) => {
    const g: Goal = {
      id: crypto.randomUUID(),
      createdAt: nowISO(),
      logs: [],
      currentStreak: 0,
      longestStreak: 0,
      ...input,
    }
    set({ goals: [...get().goals, g] })
    persist(get())
    return g
  },

  updateGoal: (id, patch) => {
    set({
      goals: get().goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    })
    persist(get())
  },

  archiveGoal: (id) => {
    set({
      goals: get().goals.map((g) => (g.id === id ? { ...g, archivedAt: nowISO() } : g)),
    })
    persist(get())
  },

  deleteGoal: (id) => {
    set({ goals: get().goals.filter((g) => g.id !== id) })
    persist(get())
  },

  completeGoal: (id) => {
    set({
      goals: get().goals.map((g) => (g.id === id ? { ...g, completedAt: nowISO() } : g)),
    })
    persist(get())
  },

  addMilestone: (id, title) => {
    set({
      goals: get().goals.map((g) =>
        g.id === id
          ? { ...g, milestones: [...g.milestones, { id: crypto.randomUUID(), title }] }
          : g
      ),
    })
    persist(get())
  },

  toggleMilestone: (goalId, milestoneId) => {
    set({
      goals: get().goals.map((g) =>
        g.id === goalId
          ? {
              ...g,
              milestones: g.milestones.map((m) =>
                m.id === milestoneId
                  ? { ...m, completedAt: m.completedAt ? undefined : nowISO() }
                  : m
              ),
            }
          : g
      ),
    })
    persist(get())
  },

  enableBoss: (goalId, cfg) => {
    set({
      goals: get().goals.map((g) =>
        g.id === goalId ? { ...g, isBossBattle: true, bossBattleConfig: cfg } : g
      ),
    })
    persist(get())
  },

  logProgress: (goalId, opts) => {
    const goal = get().goals.find((g) => g.id === goalId)
    if (!goal) {
      return {
        xp: 0,
        newStreak: 0,
        isMilestone: false,
        alreadyLoggedToday: false,
      }
    }
    const today = todayISO()
    const alreadyLoggedToday = goal.logs.some((l) => l.date.slice(0, 10) === today)

    const streakInfo = nextStreak(goal, today)

    // XP calc
    const baseXp = goal.gamePoints ?? XP.logGoalProgress
    const diffMult = DIFFICULTY_MULTIPLIER[goal.difficultyRating]
    const sMult = streakMultiplier(streakInfo.newStreak)
    let xp = Math.round(baseXp * diffMult * sMult)
    if (alreadyLoggedToday) xp = 0 // cap one log per day for XP

    // Boss damage
    let bossDamageDealt: number | undefined
    let bossDefeated = false
    let updatedBoss: BossBattleConfig | undefined
    if (goal.isBossBattle && goal.bossBattleConfig && !alreadyLoggedToday) {
      const dmg = goal.bossBattleConfig.damagePerLog
      const newHp = Math.max(0, goal.bossBattleConfig.currentHp - dmg)
      bossDamageDealt = dmg
      updatedBoss = { ...goal.bossBattleConfig, currentHp: newHp }
      if (newHp === 0 && !goal.bossBattleConfig.defeated) {
        bossDefeated = true
        updatedBoss.defeated = true
      }
    }

    const newLog: ProgressLog = {
      id: crypto.randomUUID(),
      date: nowISO(),
      note: opts?.note,
      amount: opts?.amount,
      xpAwarded: xp,
    }

    set({
      goals: get().goals.map((g) =>
        g.id !== goalId
          ? g
          : {
              ...g,
              logs: [...g.logs, newLog],
              lastLoggedAt: alreadyLoggedToday ? g.lastLoggedAt : nowISO(),
              currentStreak: alreadyLoggedToday ? g.currentStreak : streakInfo.newStreak,
              longestStreak: alreadyLoggedToday ? g.longestStreak : streakInfo.longestStreak,
              bossBattleConfig: updatedBoss ?? g.bossBattleConfig,
            }
      ),
    })
    persist(get())

    return {
      xp,
      newStreak: streakInfo.newStreak,
      isMilestone: streakInfo.isMilestone,
      milestoneDays: streakInfo.milestoneDays,
      bossDamageDealt,
      bossDefeated,
      alreadyLoggedToday,
    }
  },

  applyShieldToBrokenStreaks: () => {
    let restored = 0
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    set({
      goals: get().goals.map((g) => {
        if (isStreakBroken(g)) {
          restored++
          return { ...g, lastLoggedAt: yesterday.toISOString() }
        }
        return g
      }),
    })
    if (restored > 0) persist(get())
    return { restored }
  },

  goalById: (id) => get().goals.find((g) => g.id === id),
  goalsByArea: (area) => get().goals.filter((g) => g.area === area),
}))

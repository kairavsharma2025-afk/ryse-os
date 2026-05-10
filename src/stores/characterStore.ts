import { create } from 'zustand'
import type { Character, CharacterClassId, AreaId } from '@/types'
import { loadJSON, saveJSON } from './persist'
import { todayISO, ymForDate } from '@/engine/dates'
import { computeClass, STARTING_STAT_BONUSES } from '@/data/classes'
import { STREAK_SHIELD_PER_MONTH } from '@/data/xp'

const DEFAULT: Character = {
  initialised: false,
  name: '',
  avatar: 'wizard',
  classId: 'generalist',
  startingClassId: 'generalist',
  level: 1,
  xp: 0,
  stats: { career: 0, health: 0, relationships: 0, finance: 0, learning: 0, mind: 0 },
  titles: [],
  activeTitle: 'Wanderer',
  unlockedThemes: ['default'],
  activeTheme: 'default',
  unlockedAvatarFrames: ['none'],
  activeAvatarFrame: 'none',
  achievements: [],
  loot: [],
  createdAt: todayISO(),
  lastOpenedAt: todayISO(),
  daysOpened: [todayISO()],
  streakShields: 1,
  shieldLastGrantedMonth: ymForDate(),
}

interface CharacterState extends Character {
  initialise(args: { name: string; avatar: string; startingClass: CharacterClassId }): void
  recordOpened(): void
  applyXp(delta: number): { newLevel: number; oldLevel: number; gained: boolean }
  setStats(partial: Partial<Character['stats']>): void
  recomputeClass(): void
  setAvatar(id: string): void
  setName(name: string): void
  unlockTheme(themeId: string): boolean
  setActiveTheme(themeId: string): void
  unlockTitle(title: string): boolean
  setActiveTitle(title: string): void
  unlockFrame(id: string): boolean
  setActiveFrame(id: string): void
  addAchievement(id: string): boolean
  addLoot(loot: Character['loot'][number]): void
  consumeShield(): boolean
  grantShieldsIfNewMonth(): void
  hardReset(): void
}

const persisted = loadJSON<Partial<Character>>('character', {})
const initial: Character = { ...DEFAULT, ...persisted }

function persist(state: CharacterState) {
  const { initialise, recordOpened, applyXp, setStats, recomputeClass,
    setAvatar, setName,
    unlockTheme, setActiveTheme, unlockTitle, setActiveTitle, unlockFrame,
    setActiveFrame, addAchievement, addLoot, consumeShield, grantShieldsIfNewMonth, hardReset,
    ...rest } = state
  void initialise; void recordOpened; void applyXp; void setStats; void recomputeClass
  void setAvatar; void setName
  void unlockTheme; void setActiveTheme; void unlockTitle; void setActiveTitle; void unlockFrame
  void setActiveFrame; void addAchievement; void addLoot; void consumeShield
  void grantShieldsIfNewMonth; void hardReset
  saveJSON('character', rest)
}

import { levelFromXp } from '@/engine/xpEngine'

export const useCharacter = create<CharacterState>((set, get) => ({
  ...initial,

  initialise: ({ name, avatar, startingClass }) => {
    const bonus = STARTING_STAT_BONUSES[startingClass] ?? {}
    const stats = { ...DEFAULT.stats, ...bonus }
    const next: Character = {
      ...get(),
      initialised: true,
      name: name.trim() || 'Hero',
      avatar: avatar || 'wizard',
      classId: startingClass,
      startingClassId: startingClass,
      stats: stats as Character['stats'],
      activeTitle: 'Wanderer',
      titles: ['Wanderer'],
      createdAt: todayISO(),
      lastOpenedAt: todayISO(),
      daysOpened: [todayISO()],
    }
    set(next)
    persist(get())
  },

  recordOpened: () => {
    const today = todayISO()
    const cur = get()
    if (!cur.daysOpened.includes(today)) {
      set({ daysOpened: [...cur.daysOpened, today].slice(-365) })
    }
    set({ lastOpenedAt: today })
    get().grantShieldsIfNewMonth()
    persist(get())
  },

  applyXp: (delta) => {
    const cur = get()
    const oldLevel = cur.level
    const newXp = Math.max(0, cur.xp + delta)
    const { level } = levelFromXp(newXp)
    set({ xp: newXp, level })
    persist(get())
    return { newLevel: level, oldLevel, gained: level > oldLevel }
  },

  setStats: (partial) => {
    set({ stats: { ...get().stats, ...partial } as Character['stats'] })
    get().recomputeClass()
    persist(get())
  },

  recomputeClass: () => {
    const cur = get()
    const cls = computeClass(cur.stats, cur.startingClassId)
    if (cls !== cur.classId) {
      set({ classId: cls })
      persist(get())
    }
  },

  setAvatar: (id) => {
    set({ avatar: id })
    persist(get())
  },

  setName: (name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    set({ name: trimmed })
    persist(get())
  },

  unlockTheme: (themeId) => {
    const cur = get()
    if (cur.unlockedThemes.includes(themeId)) return false
    set({ unlockedThemes: [...cur.unlockedThemes, themeId] })
    persist(get())
    return true
  },
  setActiveTheme: (themeId) => {
    set({ activeTheme: themeId })
    persist(get())
  },

  unlockTitle: (title) => {
    const cur = get()
    if (cur.titles.includes(title)) return false
    set({ titles: [...cur.titles, title] })
    persist(get())
    return true
  },
  setActiveTitle: (title) => {
    set({ activeTitle: title })
    persist(get())
  },

  unlockFrame: (id) => {
    const cur = get()
    if (cur.unlockedAvatarFrames.includes(id)) return false
    set({ unlockedAvatarFrames: [...cur.unlockedAvatarFrames, id] })
    persist(get())
    return true
  },
  setActiveFrame: (id) => {
    set({ activeAvatarFrame: id })
    persist(get())
  },

  addAchievement: (id) => {
    const cur = get()
    if (cur.achievements.includes(id)) return false
    set({ achievements: [...cur.achievements, id] })
    persist(get())
    return true
  },

  addLoot: (loot) => {
    set({ loot: [...get().loot, loot] })
    persist(get())
  },

  consumeShield: () => {
    const cur = get()
    if (cur.streakShields <= 0) return false
    set({ streakShields: cur.streakShields - 1 })
    persist(get())
    return true
  },

  grantShieldsIfNewMonth: () => {
    const cur = get()
    const ym = ymForDate()
    if (cur.shieldLastGrantedMonth !== ym) {
      set({
        streakShields: Math.min(3, cur.streakShields + STREAK_SHIELD_PER_MONTH),
        shieldLastGrantedMonth: ym,
      })
      persist(get())
    }
  },

  hardReset: () => {
    set({ ...DEFAULT, initialised: false })
    persist(get())
  },
}))

// stat-aware area helpers
export function statForArea(area: AreaId): number {
  return useCharacter.getState().stats[area]
}

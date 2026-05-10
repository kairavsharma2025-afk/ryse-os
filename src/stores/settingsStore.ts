import { create } from 'zustand'
import type { Settings } from '@/types'
import { loadJSON, saveJSON } from './persist'

const DEFAULTS: Settings = {
  theme: 'default',
  notifications: 'unknown',
  reduceMotion: false,
  hardModeXp: false,
  sound: {
    master: true,
    byCategory: {
      questComplete: true,
      levelUp: true,
      achievement: true,
      boss: true,
      streak: true,
      loot: true,
      streakBroken: true,
    },
  },
  wakeTime: '07:00',
  windDownTime: '22:30',
  weeklyReviewDay: 0,
  anthropicApiKey: '',
  quietHours: undefined,
}

interface SettingsState extends Settings {
  set<K extends keyof Settings>(key: K, value: Settings[K]): void
  toggleSound(category?: keyof Settings['sound']['byCategory']): void
  resetAll(): void
}

const SETTINGS_KEYS = Object.keys(DEFAULTS) as (keyof Settings)[]

function pickSettings(s: SettingsState): Settings {
  const out: Record<string, unknown> = {}
  for (const k of SETTINGS_KEYS) out[k] = s[k]
  return out as unknown as Settings
}

const initial: Settings = { ...DEFAULTS, ...loadJSON<Partial<Settings>>('settings', {}) }

export const useSettings = create<SettingsState>((set, get) => ({
  ...initial,
  set: (key, value) => {
    set({ [key]: value } as Partial<SettingsState>)
    saveJSON('settings', pickSettings(get()))
  },
  toggleSound: (category) => {
    const cur = get().sound
    if (!category) {
      set({ sound: { ...cur, master: !cur.master } })
    } else {
      set({
        sound: { ...cur, byCategory: { ...cur.byCategory, [category]: !cur.byCategory[category] } },
      })
    }
    saveJSON('settings', pickSettings(get()))
  },
  resetAll: () => {
    set({ ...DEFAULTS })
    saveJSON('settings', { ...DEFAULTS })
  },
}))

// auto-persist on every change
useSettings.subscribe((s) => {
  saveJSON('settings', pickSettings(s))
})

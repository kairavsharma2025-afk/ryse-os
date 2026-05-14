import type { Rarity } from '@/types'

export interface ThemeMeta {
  id: string
  name: string
  description: string
  className: string
  rarity: Rarity
  unlockedByDefault: boolean
  preview: { bg: string; surface: string; accent: string; accent2: string }
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'ryse',
    name: 'Ryse',
    description: 'The canonical look. Apple-clean, focused, calm. Adapts to light & dark.',
    className: 'theme-ryse',
    rarity: 'common',
    unlockedByDefault: true,
    preview: { bg: '#000000', surface: '#1c1c1e', accent: '#0a84ff', accent2: '#64b4ff' },
  },
  {
    id: 'cosmos',
    name: 'Cosmos',
    description: 'Starfield over deep blue. Adapts to light & dark.',
    className: 'theme-cosmos',
    rarity: 'common',
    unlockedByDefault: true,
    preview: { bg: '#070b1c', surface: '#101630', accent: '#60a5fa', accent2: '#a7c5ff' },
  },
  {
    id: 'default',
    name: 'Obsidian Dawn',
    description: 'Clean, premium, dark. The original look.',
    className: 'theme-default',
    rarity: 'common',
    unlockedByDefault: true,
    preview: { bg: '#0b0d12', surface: '#12161e', accent: '#b89454', accent2: '#e6c882' },
  },
  {
    id: 'forge',
    name: 'Forge',
    description: 'Dark steel, amber heat. Earned by surviving the Grind.',
    className: 'theme-forge',
    rarity: 'rare',
    unlockedByDefault: false,
    preview: { bg: '#0e0c0a', surface: '#181410', accent: '#d97706', accent2: '#fbbf24' },
  },
  {
    id: 'scholar',
    name: 'Scholar',
    description: 'Cream, brown, candle-glow. The library at midnight.',
    className: 'theme-scholar',
    rarity: 'rare',
    unlockedByDefault: false,
    preview: { bg: '#18130e', surface: '#261e16', accent: '#a16207', accent2: '#d9a24f' },
  },
  {
    id: 'neon',
    name: 'Neon Monk',
    description: 'Teal hum in the dark. For nights of focus.',
    className: 'theme-neon',
    rarity: 'epic',
    unlockedByDefault: false,
    preview: { bg: '#080e12', surface: '#0c161c', accent: '#14b8a6', accent2: '#5eead4' },
  },
  {
    id: 'samurai',
    name: 'Samurai',
    description: 'Charcoal, white, blood-red. Discipline incarnate.',
    className: 'theme-samurai',
    rarity: 'epic',
    unlockedByDefault: false,
    preview: { bg: '#0c0c0c', surface: '#161212', accent: '#dc2626', accent2: '#f87171' },
  },
  {
    id: 'arctic',
    name: 'Arctic',
    description: 'Cold blues, clear ice.',
    className: 'theme-arctic',
    rarity: 'rare',
    unlockedByDefault: false,
    preview: { bg: '#080e16', surface: '#0e1620', accent: '#60a5fa', accent2: '#bfdbfe' },
  },
  {
    id: 'verdant',
    name: 'Verdant',
    description: 'Living forest. Growth itself.',
    className: 'theme-verdant',
    rarity: 'rare',
    unlockedByDefault: false,
    preview: { bg: '#08100c', surface: '#0e1a14', accent: '#22c55e', accent2: '#86efac' },
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    description: 'Deep void purple. The interior, made visible.',
    className: 'theme-obsidian',
    rarity: 'epic',
    unlockedByDefault: false,
    preview: { bg: '#0c0810', surface: '#160e20', accent: '#9333ea', accent2: '#c084fc' },
  },
  {
    id: 'solstice',
    name: 'Solstice',
    description: 'Warm gold sunset. The long quiet evening.',
    className: 'theme-solstice',
    rarity: 'rare',
    unlockedByDefault: false,
    preview: { bg: '#120c08', surface: '#20160e', accent: '#ea580c', accent2: '#facc15' },
  },
  {
    id: 'void',
    name: 'Voidwalker',
    description: 'Pure monochrome. Reserved for the legendary.',
    className: 'theme-void',
    rarity: 'legendary',
    unlockedByDefault: false,
    preview: { bg: '#000000', surface: '#0c0c0c', accent: '#f5f5f5', accent2: '#c8c8c8' },
  },
]

export function getTheme(id: string): ThemeMeta {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}

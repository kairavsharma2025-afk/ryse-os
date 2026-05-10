import type { CharacterClass, CharacterClassId, CharacterStats, AreaId } from '@/types'

export const CLASSES: Record<CharacterClassId, CharacterClass> = {
  operator: {
    id: 'operator',
    name: 'The Operator',
    tagline: 'Builds value, builds wealth.',
    description: 'Disciplined builder. High output meets high savings.',
    primaryAreas: ['career', 'finance'],
    emoji: '⚙️',
  },
  monk: {
    id: 'monk',
    name: 'The Monk',
    tagline: 'Body and mind, in concert.',
    description: 'Rooted in the body, calm in the mind.',
    primaryAreas: ['health', 'mind'],
    emoji: '🧘',
  },
  scholar: {
    id: 'scholar',
    name: 'The Scholar',
    tagline: 'Compounds knowledge into power.',
    description: 'Curious craftsperson. Reads, builds, ships.',
    primaryAreas: ['career', 'learning'],
    emoji: '📜',
  },
  empath: {
    id: 'empath',
    name: 'The Empath',
    tagline: 'Holds people. Holds themselves.',
    description: 'Inner peace fuels deep relationships.',
    primaryAreas: ['relationships', 'mind'],
    emoji: '💗',
  },
  generalist: {
    id: 'generalist',
    name: 'The Generalist',
    tagline: 'Master of the whole life.',
    description: 'Balanced across every area. Few weaknesses, no excuses.',
    primaryAreas: ['career', 'health', 'relationships', 'finance', 'learning', 'mind'],
    emoji: '🎴',
  },
  // Onboarding starters
  builder: {
    id: 'builder',
    name: 'The Builder',
    tagline: 'Career + Finance.',
    description: 'You start with focus on output and wealth.',
    primaryAreas: ['career', 'finance'],
    emoji: '🛠️',
  },
  warrior: {
    id: 'warrior',
    name: 'The Warrior',
    tagline: 'Health + Mind.',
    description: 'You start with body and mind under your command.',
    primaryAreas: ['health', 'mind'],
    emoji: '⚔️',
  },
  connector: {
    id: 'connector',
    name: 'The Connector',
    tagline: 'Relationships + Learning.',
    description: 'You start fluent in people and ideas.',
    primaryAreas: ['relationships', 'learning'],
    emoji: '🤝',
  },
  // Invented additional classes
  sovereign: {
    id: 'sovereign',
    name: 'The Sovereign',
    tagline: 'Finance + Mind.',
    description: 'Cool head, clear ledger. You play the long game.',
    primaryAreas: ['finance', 'mind'],
    emoji: '👑',
  },
  wanderer: {
    id: 'wanderer',
    name: 'The Wanderer',
    tagline: 'Learning + Relationships.',
    description: 'You move through the world gathering both stories and people.',
    primaryAreas: ['learning', 'relationships'],
    emoji: '🧭',
  },
}

export const STARTING_CLASSES: CharacterClassId[] = [
  'builder',
  'warrior',
  'connector',
  'generalist',
]

// Bonus stats given by starting class at level 1
export const STARTING_STAT_BONUSES: Record<CharacterClassId, Partial<CharacterStats>> = {
  builder: { career: 15, finance: 15 },
  warrior: { health: 15, mind: 15 },
  connector: { relationships: 15, learning: 15 },
  generalist: { career: 6, health: 6, relationships: 6, finance: 6, learning: 6, mind: 6 },
  // computed classes don't get bonuses (they're inferred at runtime)
  operator: {},
  monk: {},
  scholar: {},
  empath: {},
  sovereign: {},
  wanderer: {},
}

// Compute the runtime class based on top stats. Falls back to startingClassId.
export function computeClass(stats: CharacterStats, fallback: CharacterClassId): CharacterClassId {
  const entries = Object.entries(stats) as [AreaId, number][]
  const sorted = [...entries].sort((a, b) => b[1] - a[1])
  const top = sorted.slice(0, 2).map(([k]) => k)
  const set = new Set(top)
  // Detect the runtime classes
  if (set.has('career') && set.has('finance')) return 'operator'
  if (set.has('health') && set.has('mind')) return 'monk'
  if (set.has('career') && set.has('learning')) return 'scholar'
  if (set.has('relationships') && set.has('mind')) return 'empath'
  if (set.has('finance') && set.has('mind')) return 'sovereign'
  if (set.has('learning') && set.has('relationships')) return 'wanderer'
  // Balanced detection: if all stats within 12 of each other
  const max = sorted[0][1]
  const min = sorted[sorted.length - 1][1]
  if (max > 25 && max - min <= 12) return 'generalist'
  return fallback
}

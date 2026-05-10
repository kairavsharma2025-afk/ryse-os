import type { AreaId, AreaMeta } from '@/types'

export const AREAS: Record<AreaId, AreaMeta> = {
  career: {
    id: 'career',
    name: 'Career',
    color: 'career',
    emoji: '💼',
    description: 'Work, craft, output, contribution.',
  },
  health: {
    id: 'health',
    name: 'Health',
    color: 'health',
    emoji: '💪',
    description: 'Body, energy, sleep, movement.',
  },
  relationships: {
    id: 'relationships',
    name: 'Relationships',
    color: 'relationships',
    emoji: '❤️',
    description: 'People who matter. Family, partner, friends.',
  },
  finance: {
    id: 'finance',
    name: 'Finance',
    color: 'finance',
    emoji: '🪙',
    description: 'Money, savings, freedom.',
  },
  learning: {
    id: 'learning',
    name: 'Learning',
    color: 'learning',
    emoji: '📚',
    description: 'Curiosity, skill, depth.',
  },
  mind: {
    id: 'mind',
    name: 'Mind',
    color: 'mind',
    emoji: '🧠',
    description: 'Awareness, calm, clarity.',
  },
}

export const AREA_LIST = Object.values(AREAS)

export const AREA_PASSIVES: Record<
  AreaId,
  { mastery3: { name: string; effect: string }; mastery5: { name: string; effect: string; title: string } }
> = {
  career: {
    mastery3: {
      name: 'Compounding',
      effect: 'Career goals grant +10% XP for the next 30 days each time a milestone is hit.',
    },
    mastery5: {
      name: 'Architect',
      effect: 'Boss battles in Career deal +1 damage per attack.',
      title: 'The Architect',
    },
  },
  health: {
    mastery3: {
      name: 'Resilient',
      effect: 'Streak breaks no longer reset XP multiplier — it decays gracefully instead.',
    },
    mastery5: {
      name: 'Ironclad',
      effect: 'Streak Shields regenerate every 3 weeks instead of every month.',
      title: 'The Ironclad',
    },
  },
  relationships: {
    mastery3: {
      name: 'Held',
      effect: 'Logging any relationships goal awards +5 XP to all areas (cared-for ripple).',
    },
    mastery5: {
      name: 'Anchor',
      effect: 'You are the still point others return to. Unlocks Anchor title.',
      title: 'The Anchor',
    },
  },
  finance: {
    mastery3: {
      name: 'Discipline',
      effect: 'Finance milestone XP doubles when completed before the planned date.',
    },
    mastery5: {
      name: 'Sovereign',
      effect: 'Finance boss battles reveal one extra "weak point" that doubles damage on a chosen day.',
      title: 'The Sovereign',
    },
  },
  learning: {
    mastery3: {
      name: 'Voracious',
      effect: 'Logging a Learning goal carries a 20% chance to drop a rare quote into the Loot inventory.',
    },
    mastery5: {
      name: 'Erudite',
      effect: 'One Degree answers count as 2 each toward Full Map.',
      title: 'The Erudite',
    },
  },
  mind: {
    mastery3: {
      name: 'Stillness',
      effect: 'Daily Ritual completion XP +50% on days you log a Mind goal.',
    },
    mastery5: {
      name: 'Awakened',
      effect: 'Streak Shields can be used once per week, no longer monthly.',
      title: 'The Awakened',
    },
  },
}

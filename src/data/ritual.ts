import type { RitualStep } from '@/types'

export const RITUAL_STEPS: RitualStep[] = [
  {
    id: 'wake',
    emoji: '🌅',
    label: 'Wake with intent',
    description: 'No phone for the first 5 minutes. Sit up. Breathe.',
    xpReward: 10,
  },
  {
    id: 'move',
    emoji: '💪',
    label: 'Move the body',
    description: 'Walk, stretch, lift, run. Anything that gets the blood up.',
    xpReward: 25,
  },
  {
    id: 'feed',
    emoji: '🥗',
    label: 'Feed well',
    description: 'A meal that feeds tomorrow, not just today.',
    xpReward: 20,
  },
  {
    id: 'work',
    emoji: '⚒️',
    label: 'Deep work block',
    description: '90 minutes on the thing that matters most.',
    xpReward: 40,
  },
  {
    id: 'connect',
    emoji: '❤️',
    label: 'Connect',
    description: 'A real conversation. Five minutes is enough.',
    xpReward: 25,
  },
  {
    id: 'reflect',
    emoji: '🌙',
    label: 'Reflect',
    description: 'Three lines. What was true today?',
    xpReward: 20,
  },
]

export const RITUAL_PERFECT_BONUS = 50 // bonus for hitting all 6

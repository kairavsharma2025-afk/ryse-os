import type { Season } from '@/types'

export const SEASONS: Season[] = [
  {
    id: 's1-beginning',
    number: 1,
    name: 'Season I — The Beginning',
    theme: 'curiosity and momentum',
    focusAreas: ['career', 'learning'],
    bossName: 'The Comfort Zone',
    bossDescription:
      'A soft, smiling fog. It tells you tomorrow is fine. It is not.',
    bossInitialHp: 90,
    reward: { title: 'Awakened', badgeEmoji: '🌅' },
    flavour: [
      'Beginnings are forgivable. Stagnation is not.',
      'The first 90 days set the shape.',
    ],
  },
  {
    id: 's2-grind',
    number: 2,
    name: 'Season II — The Grind',
    theme: 'discipline and output',
    focusAreas: ['career', 'health'],
    bossName: 'The Distraction',
    bossDescription:
      'A thousand small, brightly coloured things. Each one feels like progress.',
    bossInitialHp: 120,
    reward: { title: 'Grinder', themeId: 'forge', badgeEmoji: '🛠️' },
    flavour: [
      'Output buys freedom. The body funds the work.',
      'Drag the line forward, day after day.',
    ],
  },
  {
    id: 's3-healer',
    number: 3,
    name: 'Season III — The Healer',
    theme: 'love and stillness',
    focusAreas: ['relationships', 'mind'],
    bossName: 'Neglect',
    bossDescription:
      'Quiet. Drifty. The friend you forgot to call. The morning you stopped sitting still.',
    bossInitialHp: 90,
    reward: { title: 'The Healer', themeId: 'verdant', badgeEmoji: '💗' },
    flavour: [
      'You cannot earn your way out of distance.',
      'Show up. With them. In yourself.',
    ],
  },
  {
    id: 's4-accumulator',
    number: 4,
    name: 'Season IV — The Accumulator',
    theme: 'patience and compounding',
    focusAreas: ['finance', 'learning'],
    bossName: 'The Impulse',
    bossDescription:
      'A persuasive voice. It always has a reason. It is always wrong by year five.',
    bossInitialHp: 110,
    reward: { title: 'Strategist', themeId: 'scholar', badgeEmoji: '🪙' },
    flavour: [
      'Money is a slow game. So is mastery.',
      'Patience is a stat you can train.',
    ],
  },
]

export function getSeason(id: string) {
  return SEASONS.find((s) => s.id === id) ?? SEASONS[0]
}

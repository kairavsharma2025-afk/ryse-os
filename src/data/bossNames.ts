// Boss name generator: maps a goal title to a dramatic, memorable villain.
// Used when user enables boss-battle mode without specifying a name.

import type { AreaId } from '@/types'

interface BossTemplate {
  match: RegExp
  area?: AreaId
  name: string
  description: string
  hp: number
}

const TEMPLATES: BossTemplate[] = [
  // Health
  {
    match: /(weight|fat|lose.*kg|lose.*pound|cut|shred)/i,
    area: 'health',
    name: 'The Weight Dragon',
    description: 'It feeds on missed mornings and second helpings. Each rep you skip, it grows a scale.',
    hp: 90,
  },
  {
    match: /(gym|workout|lift|exercise|run|cardio)/i,
    area: 'health',
    name: 'The Iron Idol',
    description: 'A statue that only crumbles when you show up. It does not care if you feel like it.',
    hp: 60,
  },
  {
    match: /(sleep|bed|earlier|insomnia)/i,
    area: 'health',
    name: 'The Midnight King',
    description: 'He rules the hours after 11pm. He offers you "just one more episode." Refuse.',
    hp: 60,
  },
  {
    match: /(sugar|junk|diet|eat)/i,
    area: 'health',
    name: 'The Sweet Wraith',
    description: 'It haunts the kitchen at 9pm. Past it lies a body that thanks you in the morning.',
    hp: 75,
  },
  {
    match: /(smoke|drink|alcohol|quit)/i,
    area: 'health',
    name: 'The Easy Out',
    description: 'A familiar shadow. It promises relief and delivers fog.',
    hp: 90,
  },
  // Finance
  {
    match: /(save|saving|emergency.*fund|build.*fund)/i,
    area: 'finance',
    name: 'The Impulse',
    description: 'Persuasive, urgent, always reasonable. The voice that costs you the future.',
    hp: 90,
  },
  {
    match: /(debt|loan|credit|pay.*off)/i,
    area: 'finance',
    name: 'The Compounding Chain',
    description: 'Every month you hesitate, it grows a link. Every payment shortens it visibly.',
    hp: 120,
  },
  {
    match: /(invest|portfolio|stock|index|sip)/i,
    area: 'finance',
    name: 'The Patience Test',
    description: 'It does nothing. It just waits to see if you will.',
    hp: 90,
  },
  // Career
  {
    match: /(launch|ship|build|side.*project|product)/i,
    area: 'career',
    name: 'The Half-Built Tower',
    description: 'It looms. Every day you don\'t add a brick, you imagine what it might have been.',
    hp: 120,
  },
  {
    match: /(promotion|raise|review|career)/i,
    area: 'career',
    name: 'The Glass Ceiling',
    description: 'You cannot punch through. You can only chip away, day after day.',
    hp: 100,
  },
  {
    match: /(write|book|blog|essay|publish)/i,
    area: 'career',
    name: 'The Empty Page',
    description: 'It stares back. Every sentence written is a bruise on its blank face.',
    hp: 100,
  },
  // Learning
  {
    match: /(learn|course|study|skill|language)/i,
    area: 'learning',
    name: 'The Plateau',
    description: 'A long, flat, uninteresting stretch. Cross it, and the next slope is yours.',
    hp: 90,
  },
  {
    match: /(read|book|reading)/i,
    area: 'learning',
    name: 'The Unread Stack',
    description: 'It teeters on the bedside table. It judges you mildly. Knock it over by reading.',
    hp: 60,
  },
  // Relationships
  {
    match: /(call.*mom|call.*dad|call.*parent|family)/i,
    area: 'relationships',
    name: 'The Long Silence',
    description: 'Every week you don\'t call, it gets harder to. Pick up the phone.',
    hp: 60,
  },
  {
    match: /(date.*night|partner|spouse|wife|husband)/i,
    area: 'relationships',
    name: 'The Drift',
    description: 'No villain, no dragon. Just a quiet widening. Reverse it with attention.',
    hp: 75,
  },
  {
    match: /(friend|reach.*out)/i,
    area: 'relationships',
    name: 'The Empty Address Book',
    description: 'The names are still there. The relationships fade if not watered.',
    hp: 60,
  },
  // Mind
  {
    match: /(meditat|breath|mindful)/i,
    area: 'mind',
    name: 'The Static',
    description: 'A constant, low-grade hum in the head. Sit, and it settles.',
    hp: 75,
  },
  {
    match: /(journal|reflect|write.*morning)/i,
    area: 'mind',
    name: 'The Unexamined Life',
    description: 'Worth less than the lived one. Lift the lid daily.',
    hp: 75,
  },
  {
    match: /(phone|screen|social|scroll)/i,
    area: 'mind',
    name: 'The Algorithm',
    description: 'It does not love you. It loves your time. Take some back.',
    hp: 90,
  },
]

const AREA_FALLBACK: Record<AreaId, { name: string; description: string; hp: number }> = {
  career: {
    name: 'The Stagnant Forge',
    description: 'A cold furnace. You are the spark.',
    hp: 90,
  },
  health: {
    name: 'The Soft Beast',
    description: 'It grew when you weren\'t looking. Outgrow it.',
    hp: 90,
  },
  relationships: {
    name: 'The Drift',
    description: 'Quiet, slow, terminal. Reversible with attention.',
    hp: 75,
  },
  finance: {
    name: 'The Leak',
    description: 'You don\'t see it. The future does.',
    hp: 90,
  },
  learning: {
    name: 'The Plateau',
    description: 'Flat. Long. Crossable.',
    hp: 90,
  },
  mind: {
    name: 'The Noise',
    description: 'A loud, constant interior. Sit until it quiets.',
    hp: 75,
  },
}

export function suggestBoss(title: string, area: AreaId): { name: string; description: string; hp: number } {
  const t = title || ''
  for (const tpl of TEMPLATES) {
    if (tpl.match.test(t) && (!tpl.area || tpl.area === area)) {
      return { name: tpl.name, description: tpl.description, hp: tpl.hp }
    }
  }
  return AREA_FALLBACK[area]
}

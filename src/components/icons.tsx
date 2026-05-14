import {
  // Areas
  Briefcase,
  Activity,
  Heart,
  Coins,
  BookOpen,
  Brain,
  // Ritual
  Sunrise,
  Dumbbell,
  Salad,
  Hammer,
  Users,
  Moon,
  // Nav
  Home,
  Swords,
  Trophy,
  Gem,
  Sparkles,
  CalendarDays,
  CalendarClock,
  Bell,
  Bot,
  Cake,
  LayoutGrid,
  Telescope,
  Mail,
  MoonStar,
  Settings,
  User,
  BookHeart,
  // Class
  Cog,
  Scroll,
  HeartHandshake,
  Layers,
  Wrench,
  Sword,
  Crown,
  Compass,
  // Achievement specifics
  Droplet,
  Scale,
  Globe,
  Feather,
  Map as MapIcon,
  Castle,
  Eye,
  Library,
  DoorOpen,
  Footprints,
  // Avatars
  Wand2,
  Bird,
  Cat,
  Mountain,
  GraduationCap,
  Star,
  Flame,
  // UI markers
  Check,
  Lock,
  Pencil,
  RotateCcw,
  Shield,
  // Generic
  Award,
  Medal,
  BellRing,
  type LucideIcon,
} from 'lucide-react'
import type { AreaId, CharacterClassId, Rarity } from '@/types'

export type { LucideIcon }

export const AREA_ICONS: Record<AreaId, LucideIcon> = {
  career: Briefcase,
  health: Activity,
  relationships: Heart,
  finance: Coins,
  learning: BookOpen,
  mind: Brain,
}

export const RITUAL_ICONS: Record<string, LucideIcon> = {
  wake: Sunrise,
  move: Dumbbell,
  feed: Salad,
  work: Hammer,
  connect: Users,
  reflect: Moon,
}

export const NAV_ICONS: Record<string, LucideIcon> = {
  '/': Home,
  '/plan': CalendarDays,
  '/life': Compass,
  '/schedule': CalendarClock,
  '/reminders': Bell,
  '/ritual': Sunrise,
  '/goals': Swords,
  '/skills': Sparkles,
  '/season': CalendarDays,
  '/achievements': Trophy,
  '/birthdays': Cake,
  '/finite': LayoutGrid,
  '/values': BookHeart,
  '/silence': MoonStar,
  '/unsent': Mail,
  '/onedegree': Telescope,
  '/loot': Gem,
  '/profile': User,
  '/settings': Settings,
}

export const CLASS_ICONS: Record<CharacterClassId, LucideIcon> = {
  operator: Cog,
  monk: Brain,
  scholar: Scroll,
  empath: HeartHandshake,
  generalist: Layers,
  builder: Wrench,
  warrior: Sword,
  connector: Users,
  sovereign: Crown,
  wanderer: Compass,
}

export const RARITY_ICONS: Record<Rarity, LucideIcon> = {
  common: Award,
  rare: Medal,
  epic: Trophy,
  legendary: Crown,
}

export const STREAK_ICONS: Record<string, LucideIcon | null> = {
  cold: null,
  building: Sparkles,
  burning: Flame,
  inferno: Flame,
  legendary: Crown,
}

export const AVATAR_OPTIONS: { id: string; emoji: string; label: string }[] = [
  // Heroes & people
  { id: 'wizard', emoji: '🧙', label: 'Wizard' },
  { id: 'ninja', emoji: '🥷', label: 'Ninja' },
  { id: 'monk', emoji: '🧘', label: 'Monk' },
  { id: 'sovereign', emoji: '👑', label: 'Sovereign' },
  { id: 'detective', emoji: '🕵️', label: 'Detective' },
  { id: 'duelist', emoji: '🤺', label: 'Duelist' },
  // Arms & arts
  { id: 'warrior', emoji: '⚔️', label: 'Warrior' },
  { id: 'archer', emoji: '🏹', label: 'Archer' },
  { id: 'assassin', emoji: '🗡️', label: 'Assassin' },
  { id: 'guardian', emoji: '🛡️', label: 'Guardian' },
  { id: 'scholar', emoji: '📚', label: 'Scholar' },
  { id: 'mage', emoji: '🔮', label: 'Mage' },
  { id: 'alchemist', emoji: '⚗️', label: 'Alchemist' },
  { id: 'wildcard', emoji: '🃏', label: 'Wildcard' },
  { id: 'wanderer', emoji: '🧭', label: 'Wanderer' },
  // Beasts
  { id: 'dragon', emoji: '🐉', label: 'Dragon' },
  { id: 'falcon', emoji: '🦅', label: 'Falcon' },
  { id: 'owl', emoji: '🦉', label: 'Owl' },
  { id: 'fox', emoji: '🦊', label: 'Fox' },
  { id: 'wolf', emoji: '🐺', label: 'Wolf' },
  { id: 'lion', emoji: '🦁', label: 'Lion' },
  { id: 'tiger', emoji: '🐯', label: 'Tiger' },
  { id: 'bear', emoji: '🐻', label: 'Bear' },
  { id: 'serpent', emoji: '🐍', label: 'Serpent' },
  { id: 'kraken', emoji: '🐙', label: 'Kraken' },
  { id: 'unicorn', emoji: '🦄', label: 'Unicorn' },
  // Forces of nature
  { id: 'flame', emoji: '🔥', label: 'Flame' },
  { id: 'frost', emoji: '❄️', label: 'Frost' },
  { id: 'storm', emoji: '⚡', label: 'Storm' },
  { id: 'star', emoji: '⭐', label: 'Star' },
  { id: 'comet', emoji: '☄️', label: 'Comet' },
  { id: 'mountain', emoji: '⛰️', label: 'Mountain' },
  // Shades
  { id: 'specter', emoji: '👻', label: 'Specter' },
  { id: 'reaper', emoji: '💀', label: 'Reaper' },
  { id: 'automaton', emoji: '🤖', label: 'Automaton' },
]

const AVATAR_EMOJI: Record<string, string> = Object.fromEntries(
  AVATAR_OPTIONS.map((a) => [a.id, a.emoji])
)

export function avatarEmoji(id: string): string {
  return AVATAR_EMOJI[id] ?? '🙂'
}

const ACHIEVEMENT_BY_ID: Record<string, LucideIcon> = {
  'first-blood': Droplet,
  honest: Scale,
  'say-it': Mail,
  curious: Telescope,
  'still-here': DoorOpen,
  'first-quest': Scroll,
  'perfect-day': Sunrise,
  'on-fire': Flame,
  'world-wider': Globe,
  'dear-me': Feather,
  planner: MapIcon,
  unbeaten: Shield,
  'first-green': Sparkles,
  'five-streaks': Footprints,
  'iron-man': Footprints,
  scholar: BookOpen,
  'dragon-slayer': Sword,
  'long-game': Eye,
  eulogy: BookHeart,
  father: Heart,
  comeback: Moon,
  legendary: Crown,
  mastery: Library,
  'full-map': MapIcon,
  'the-life': Sparkles,
  'all-seasons': Moon,
  phoenix: Feather,
  'silent-witness': MoonStar,
  'green-year': BookHeart,
  cathedral: Castle,
}

export function achievementIcon(id: string, rarity: Rarity): LucideIcon {
  return ACHIEVEMENT_BY_ID[id] ?? RARITY_ICONS[rarity]
}

// Re-export common UI icons for direct import
export {
  Check,
  Lock,
  Pencil,
  RotateCcw,
  Shield,
  Crown,
  Sparkles,
  Flame,
  Star,
  BellRing,
  User,
  Trophy,
}

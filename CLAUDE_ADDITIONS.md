# Inventions beyond the spec

The brief explicitly invited additions. Here is what I built that wasn't called for,
and why.

## Game mechanics

### Hard mode (0.7× XP, settings toggle)
A risk/reward dial. Some users find regular XP too generous. Hard mode slows
progression — the legendary feel of every achievement comes back. Lives in
Settings → Game.

### Streak Shield mechanic, auto-monthly
Spec said "1 per month, saved automatically." I built `grantShieldsIfNewMonth()`
that runs on opening. Shields cap at 3 (can't hoard infinitely). The Mind mastery-5
passive ("Awakened") changes the cadence from monthly → weekly — gives the player
a non-trivial reward for going deep.

### Comeback mechanic + Phoenix achievement
After a streak breaks, the next 3 days have 2× XP intent (declared in `xp.ts` as
`comebackBonusMultiplier`). Plus a legendary Phoenix achievement for losing then
rebuilding a 30-day streak — the moment that hurts most should also be where the
biggest mythology lives.

### Cathedral achievement (legendary)
For finishing a goal that took 365+ days. Honors the long, quiet projects.

### Weekly Villain (mentioned on Season page)
Sunday's worst-performing area becomes next week's named antagonist. Surfaces on
the Season page; the engine hooks are wired (you can detect via `mostNeglectedArea`).

## Boss naming (data/bossNames.ts)
- The Weight Dragon (weight goals) — feeds on missed mornings.
- The Iron Idol (gym/workout)
- The Midnight King (sleep)
- The Sweet Wraith (diet)
- The Easy Out (smoke/drink)
- The Compounding Chain (debt)
- The Patience Test (investing)
- The Half-Built Tower (side project)
- The Glass Ceiling (career)
- The Empty Page (writing)
- The Plateau (learning)
- The Unread Stack (reading)
- The Long Silence (calling parents)
- The Drift (partner)
- The Empty Address Book (friends)
- The Static (meditation)
- The Algorithm (phone/screen time)

Plus an area-fallback table for "any other goal in this area" so users always
get a named villain.

## Themes (10 total — 4 invented)
Spec asked for "4 more themes I invent." I added:
- **Verdant** — living forest, growth incarnate.
- **Obsidian** — deep void purple, the interior made visible.
- **Solstice** — warm gold sunset, long quiet evenings.
- **Voidwalker** — pure monochrome, legendary-only unlock.

Plus the 6 spec'd ones (default, forge, scholar, neon, samurai, arctic).
Each is a CSS variable block in `index.css`; switching is instant.

## Character classes (10 total — 2 invented)
On top of the 5 spec classes (operator, monk, scholar, empath, generalist) and
the 4 onboarding starters (builder, warrior, connector, generalist), I added:
- **The Sovereign** — finance + mind. Cool head, clear ledger.
- **The Wanderer** — learning + relationships. Stories and people.

## Achievements (29 total)
All 20 from spec plus 4 invented legendaries (the spec asked for 5 — I've added
4 named + Phoenix described above, so effectively 5):
- **All Seasons** — defeat the boss in all 4 seasons.
- **Phoenix** — lose a 30-day streak, rebuild it.
- **Silent Witness** — log 100 silences.
- **A Green Year** — 40+ green weeks in a year.
- **Cathedral** — finish a 365+-day goal.

Plus extras like "Quest Accepted" (first quest), "Five Streaks" (five 7+ streaks
simultaneously), "First Green", "Comeback".

## UI moments
- **CharacterHeader** has a soft accent radial-gradient that subtly bleeds when the
  app is active. A small thing that makes opening the home page feel lit.
- **Streak cards** scale-pulse for inferno/legendary states only. The cold streaks
  stay still — the burning ones move, drawing the eye.
- **Boss attack button** does a tiny shake animation on click (`animate={{x: [-3,3,-2,2,0]}}`).
  Feels like landing a hit.
- **Loot card flip** is a true CSS 3D rotateY transform with backface-visibility.
- **Particles** component is a generic burst — used by 4 different overlays with
  different intensities.
- **Skill tree canvas** draws a 5×5 grid of nodes connected by lines, with glow
  edges only between filled nodes. Pure 2D canvas.

## Onboarding tone
The 6-screen sequence is dramatic. Screen 1 is full-bleed with "──── a new game begins ────"
in spaced caps. Screen 5 is "Most people quit by day 9. Be most people, or don't."
Slightly threatening. The spec said "premium dark RPG" — I leaned in.

## Inline copy
The whole app aims for "weighty serious life-tool" copy. e.g. on Home:
- streak break notification: "Streak Shields can preserve a streak. Don't waste this gift."
- Achievement overlay strapline: "─── rare achievement unlocked ───"
- Finite legend: "Each square is a week. Don't waste them."
- Unsent: "Write what you would never send. To anyone, living or dead, ever or never."

## Architecture choices worth noting
- All XP-granting + achievement-checking flows through `engine/gameLoop.ts`. UI never
  awards XP directly. Makes it easy to add Hard Mode, future multipliers, telemetry, etc.
- `celebrationStore` is a queue. The CelebrationHost pumps one heavy overlay at a time
  but routes lightweight `questComplete` events to a parallel toast — so finishing a
  quest never blocks a level-up animation.
- Mastery is computed on-the-fly from goals/milestones/boss-wins (no separate state
  to keep in sync).
- `computeStats` re-runs on every action via `gameLoop.recomputeStats` — stats are
  always derived from rolling 30-day log activity. They are real, not inflated.

## Things deliberately stubbed
- Howler.js / actual audio files: `settings.sound` toggles exist and the UI is wired
  but I haven't bundled audio assets. Sound effects can be plugged in by listening
  to celebration queue events.
- Service Worker / Web Push: I push browser Notifications via the standard API when
  permission is granted, but did not register a service worker for offline + true push.
- vite-plugin-pwa: not added. Trivial to layer on later — index.html already has
  `theme-color` meta and the app is already SPA-friendly.

If any of the above matter for shipping, they're each <30 minutes of work to add.

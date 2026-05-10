# Ryse — codebase guide (formerly "Life OS"; localStorage prefix stays `lifeos:v1:`)

A gamified personal life operating system. Real life as the most important RPG.
Single-page React app, no backend, everything on device.

## Stack
- React 18 + Vite + TypeScript strict
- TailwindCSS v3 with CSS-variable theme tokens (light/dark/many)
- React Router v6
- Zustand (state) + custom localStorage persistence (under `lifeos:v1:` prefix)
- Framer Motion (every animation)
- date-fns (all date logic)
- No backend. PWA-friendly but no SW yet.

## Map
- `src/types` — every type lives here, single source of truth.
- `src/data` — static tables (areas, classes, themes, achievements, seasons, ritual steps,
  one-degree questions, boss-name templates, XP rewards).
- `src/stores` — Zustand stores; each persists to localStorage on every relevant change.
  - `characterStore`, `goalsStore`, `questsStore`, `modulesStore`, `seasonStore`,
    `notificationsStore`, `celebrationStore`, `settingsStore`,
    `scheduleStore` (time-blocked calendar events), `remindersStore`,
    `assistantStore` (chat history + today's AI plan; transient `panelOpen`/`thinking`/`error`).
- `src/engine` — pure functions: `xpEngine` (level curves), `streakEngine`,
  `statEngine` (rolling 30-day computation), `questGenerator` (3 daily quests),
  `achievementChecker`, `masteryEngine`, `seasonEngine`, `dates`, `remindersEngine`
  (occurrence rules), the central orchestrator `gameLoop.ts` which is what UI calls
  (e.g. `actionLogGoal`), plus the AI layer: `claudeApi` (browser → api.anthropic.com
  with the user's stored key), `assistantContext` (builds the live player-context string),
  `assistantActions` (`askAssistant`, `generateDailyPlan`, parses `lifeos-actions` blocks
  the model emits to create reminders/events).
- `src/hooks/useReminderEngine` — 30s poll fired from Layout; raises desktop + in-app
  notifications for due reminders; requests Notification permission on first load.
- Reminders model (`types.Reminder`): repeat `once|daily|weekly|monthly`, optional `priority`
  (`low|normal|high`), optional `goalId` link, and `snoozedUntil` (one-shot 10-min snooze via
  `remindersStore.snoozeReminder`). `remindersEngine` (`occursOn`/`fireTimeOn`/`nextFireTime`)
  handles all four cadences, the snooze override, and `settings.quietHours` (`{from,to}` HH:mm —
  fires that would land in the window defer to `to`, passed as the optional last arg to those fns).
- `src/components` — UI primitives (`ui/`), Layout, celebrations (overlays + toast),
  home widgets (incl. `AiPlanCard`, `UpcomingReminders`), `assistant/*` (drawer panel,
  FAB, `RichText` mini-markdown), `schedule/EventForm`, `character/Avatar` (circular
  avatar — renders the minimal flat OpenMoji SVG picture for the avatar's name-matched
  emoji from `AVATAR_OPTIONS` in `components/icons.tsx` (35 options), falling back to the
  emoji glyph if the CDN is unreachable; `avatarEmoji(id)` helper lives there too).
- `src/pages` — Onboarding, Home (Today), Schedule, Reminders, Goals + GoalDetail,
  Profile, Achievements, Loot, Skills, Settings, SeasonPage, plus `pages/modules/*`
  for the seven modules.

## AI assistant
- Disabled until the user pastes an Anthropic API key in Settings (`settings.anthropicApiKey`,
  localStorage only). Model id lives in `engine/claudeApi.ts` (`ASSISTANT_MODEL`).
- Every call gets `PERSONA + ACTION_INSTRUCTIONS + buildAssistantContext()` as the system prompt
  so replies know the hero's goals, season, ritual, schedule and reminders.
- The model can create reminders/events by appending a ```lifeos-actions {"actions":[…]}``` block;
  `assistantActions.applyActions` validates and writes them, then strips the block from the message.
- `AiPlanCard` (home) auto-generates today's plan ~500ms after mount when `settings.anthropicApiKey`
  is set and `assistantStore.plan?.date !== today`; shows a loading state, an inline error + "Try again"
  on failure (`generateDailyPlan` never throws), and the "assistant is asleep" copy only when no key.
- `settingsStore` persists exactly the keys of `Settings` via `pickSettings()` — to add a setting,
  just add it to the `Settings` type and `DEFAULTS`; persistence is automatic.
- One-time demo seed in `data/seed.ts` (gated by the `seed_v1` flag) pre-fills 4 weeks of the
  intern/CFA/CAT/gym routine into Schedule + Reminders; runs from `runOpeningTick`.

## Persistence
- `localStorage` keys are prefixed `lifeos:v1:`. To wipe everything use Settings → Reset
  or `clearAll()` from `src/stores/persist`.
- All actions go through `gameLoop.ts` so XP/stats/achievements stay in sync.

## Adding stuff
- New achievement: add to `src/data/achievements.ts` then handle the condition in
  `src/engine/achievementChecker.ts` (the `cond` map).
- New theme: add to `src/data/themes.ts` plus a `.theme-id` block in `src/index.css`.
- New season: append to `src/data/seasons.ts`. Rotation is automatic at 90 days.
- New module: type in `types/index.ts`, store slice in `modulesStore.ts`, page in
  `pages/modules/*`, route in `App.tsx`, nav entry in `Layout.tsx`.
- New top-level page: route in `App.tsx`, nav entry in `NAV_GROUPS` in `Layout.tsx`,
  icon in `NAV_ICONS` in `components/icons.tsx`. Sidebar badges are wired via `badgeFor()` in Layout.
- Schedule events & reminders both use `AreaId` as their category so `data/areas` colours apply.

## Notes
- XP curve: `xpForLevel(n) = round(50 * n^1.8)` (≈Lv25 around 6 months of regular play).
- Class is fixed by user choice at onboarding but auto-recomputes from stat rankings.
- Streak shields auto-grant once per month; spend via `actionApplyShield`.
- Boss battles inherit HP from `data/bossNames.ts` heuristics if user doesn't name them.
- PWA: `public/manifest.webmanifest` + `public/sw.js` (minimal app-shell/runtime cache, bump `CACHE`
  in it to invalidate) + apple meta tags in `index.html`; `main.tsx` registers the SW in PROD only.
  `public/icon.svg` is the (maskable) app icon. `hooks/useInstallPrompt` powers the "Install Ryse"
  card in Settings (`beforeinstallprompt` on Chrome/Android; manual hint on iOS Safari).
  Deployed on Vercel — `vercel.json` sets framework/build/output, an SPA rewrite, and `no-cache` on `/sw.js`.

## Run
```
npm install
npm run dev
npm run build
```

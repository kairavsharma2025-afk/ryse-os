# Life OS

A gamified personal life operating system. Real life as the most important RPG.

- React 18 + Vite + TypeScript
- Tailwind v3 (CSS variables, 10 themes, dark by default)
- Zustand stores persisted to `localStorage`
- Framer Motion for everything that moves
- Single-page app, no backend, everything on device

## Run

```
npm install
npm run dev
```

Then http://localhost:5173.

> **Note (2026-05-08):** I couldn't run `npm install` from this session — the local
> environment was returning HTTP 403 on several packages from `registry.npmjs.org`
> (rate limit / network policy). The code itself is complete and self-contained.
> Once your network can reach the registry, the install above should work end-to-end.
> If `@vitejs/plugin-react` 403s persist, try a fresh shell, `npm cache clean --force`,
> or your usual VPN/proxy.

## Build

```
npm run build
npm run preview
```

## Reset

Settings → Reset everything. Or delete keys prefixed `lifeos:v1:` from localStorage.

## Files

- `CLAUDE.md` — codebase guide.
- `CLAUDE_ADDITIONS.md` — every invention beyond the spec, with rationale.

## Highlights

- **6 life areas** (career / health / relationships / finance / learning / mind),
  each with a stat (rolling 30-day) and a skill tree.
- **30 achievements** across common/rare/epic/legendary; full-bleed unlock celebrations.
- **Boss battles**: any goal can be flagged a boss. Each log deals damage. Defeat
  drops loot.
- **3 daily quests** generated each morning: most-neglected, top-priority, wildcard.
- **Streak system** with auto-monthly Streak Shields (use sparingly).
- **4 seasons**, 90 days each. Auto-rotates.
- **10 themes**, 6 from spec + 4 invented. Earned via achievements.
- **7 modules**: Finite week grid, Daily Ritual, One Degree, Unsent, Silence,
  Values + Eulogy.

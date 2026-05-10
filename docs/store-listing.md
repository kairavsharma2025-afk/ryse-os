# Ryse — App Store / Google Play listing copy (draft)

Fill in the `TODO`s, generate the images (icon ✓ done — see `public/icon.svg` / the PNGs;
you still need screenshots + a Play "feature graphic"), and paste these fields into the consoles.

---

## App name (max 30 chars on both stores)

Pick one:
- `Ryse` — cleanest, but weak for search
- `Ryse: Life RPG` *(14)* — recommended
- `Ryse — Life RPG & Habits` *(24)*
- `Ryse: Habits & Life Quest` *(25)*

> The "secondary" words help discoverability without looking spammy. On the App Store, words in
> your app name + subtitle are auto-indexed, so don't repeat them in `keywords`.

---

## Google Play

**Short description** (max 80 chars):
> Turn real life into an RPG — goals, streaks, seasons & an AI Game Master. *(74)*

Alternates:
- `A gamified life OS: quests, streaks, seasons, reminders & an on-device AI planner.` *(80)*
- `Real life is the longest game. Level up your goals, habits & seasons.` *(68)*

**Full description** (max 4000 chars — this draft ≈ 2.4k):
```
Real life is the most important game you'll ever play. It has goals. It has streaks. It has boss battles. It just never came with a HUD.

Ryse is that HUD.

Turn the things you actually want — career, health, relationships, money, learning, mind — into quests. Log progress, build streaks, level up a character that evolves from how you actually live, and watch your stats shift toward the life you're trying to build. Everything stays on your device. No account. No servers. No ads. No tracking.

— YOUR GAME —
• Goals as quests: set them, log them, keep streaks, hit milestones, and turn the hard ones into boss battles.
• Levels, XP, and a class that recomputes itself from your real activity.
• 90-day Seasons, each with a season boss and rewards.
• A daily Ritual, three daily quests, and a "perfect day" worth chasing.
• Reflection tools that go deeper than a habit tracker — a "Finite" grid of your life in weeks, an "Unsent" drawer for letters you'll never send, a "Silence" log for the patterns under your reactions, a Values & eulogy exercise, daily one-degree questions, and more.
• Achievements, themes, and 35 avatars — make it yours.

— YOUR GAME MASTER (AI, optional) —
Add your own Anthropic API key and Ryse gets a Game Master: a chat assistant that knows your goals, your season, your ritual, and your calendar. It drafts a time-blocked plan for your day, creates reminders when you ask ("remind me to call mom Sunday evening"), and suggests what to do this week and this season. Your prompts go directly from your device to Anthropic with your own key — never through our servers, because we don't have any. (Standard Anthropic API usage applies; AI features are entirely optional — everything else works with no key.)

— PLAN & REMEMBER —
• A weekly Schedule you can time-block.
• Reminders with once / daily / weekly / monthly repeats, a 10-minute snooze, priorities, quiet hours, and links to your goals.
• Notifications scheduled and fired on-device.

— PRIVACY, FOR REAL —
Ryse keeps everything in your device's local storage. We don't collect it, we can't see it, and we never sell it. No accounts, no analytics, no trackers, no ads. Erase everything anytime with one tap. Full policy: https://ryse-os.vercel.app/privacy

Ryse is a personal-growth tool — not medical, psychological, or therapeutic advice.

Most people quit by day 9. Be most people, or don't.

Start your run. Ryse.
```

**App category:** Productivity (primary). *Alt: Lifestyle, or Health & Fitness.*
**Tags / "what users can do":** habit tracking, goal setting, journaling, planning.
**Content rating (IARC questionnaire):** answer truthfully — Ryse has no violence/sexual/gambling content; "Unsent letters", "Silence" journaling, and the "Finite" life-in-weeks grid are contemplative/wellness features, not graphic. Expect **Everyone / PEGI 3**.
**Contains ads:** No. **In-app purchases:** No.
**Data safety form:** select **"No data collected"** and **"No data shared"** (the optional AI feature sends *your* prompts with *your* key directly to Anthropic — that's the user acting, not Ryse collecting; if you want to be extra-conservative, disclose under "App functionality": text the user types may be sent to Anthropic when the user enables the assistant). Privacy policy URL: `https://ryse-os.vercel.app/privacy`.

**Release notes (v1.0.0):**
> First public release. Goals as quests, streaks, levels, 90-day seasons & boss battles, a weekly schedule, reminders, deep reflection tools, and an optional on-device AI Game Master (bring your own Anthropic key). Everything stays on your device.

---

## Apple App Store

**Subtitle** (max 30 chars):
> Real life is the longest game *(29)*

Alternates:
- `Habits, goals & boss battles` *(28)*
- `Level up your life, on-device` *(29)*

**Promotional text** (max 170 chars — editable any time without review):
> New: a Game Master that drafts your day, builds reminders, and plots your season — powered by your own Anthropic key, never leaving your device. *(≈143)*

**Keywords** (max 100 chars, comma-separated, no spaces — don't repeat the app name/subtitle words):
```
habit,tracker,goals,RPG,gamify,productivity,planner,routine,streak,journal,AI,assistant,life,quest
```
*(≈95 chars. Tweak to taste; "discipline,focus,self,growth" are good swaps.)*

**Description** (max 4000 chars): use the same body as the Play "Full description" above. (App Store descriptions are plain text + `•` bullets — no markdown — which is exactly what's written there.)

**Category:** Productivity (primary), Lifestyle (secondary). *Health & Fitness is also defensible.*
**Age rating:** **4+** (no objectionable content; the introspective features are wellness-oriented, not mature).
**App Privacy ("nutrition labels"):** **Data Not Collected.** In the App Review notes, add: *"AI features are optional and require the user's own Anthropic API key; when used, the user's prompts are sent directly from the device to api.anthropic.com — no Ryse backend exists. All other data is stored only in on-device local storage."* (This pre-empts a Guideline 5.1 / 2.1 question.)
**Privacy Policy URL:** `https://ryse-os.vercel.app/privacy`

**"What's New" (v1.0.0):** same as the Play release notes above.

---

## Shared metadata

| Field | Value |
|---|---|
| Support URL | `https://github.com/kairavsharma2025-afk/ryse-os/issues`  *(or a mailto/contact page — App Store needs a reachable one)* |
| Marketing URL | `https://ryse-os.vercel.app` |
| Privacy Policy URL | `https://ryse-os.vercel.app/privacy`  *(remember to set the real contact email in `src/pages/Privacy.tsx`)* |
| Copyright (App Store) | `© 2026 TODO_YOUR_NAME` |
| Bundle ID / appId | `app.ryse`  *(must match what you register in App Store Connect / Play Console)* |
| Developer / publisher name | `TODO` |
| Contact email | `TODO` |

---

## Screenshot caption ideas

You need ~3–8 screenshots per store (App Store wants 6.7" iPhone + 13" iPad sizes; Play wants phone + a 1024×500 feature graphic). Suggested screens + overlay captions:

1. **Today / AI Plan** — "Your day, time-blocked by a Game Master."
2. **Goals list** — "Real goals. As quests you actually finish."
3. **Goal detail with a boss battle** — "Turn the hard ones into boss fights."
4. **Season page** — "90-day Seasons. One boss. A reward at the end."
5. **Schedule (week view)** — "Block your week. The assistant plans around it."
6. **Reminders** — "Reminders that snooze, repeat, and know your goals."
7. **Profile / avatars / character header** — "Level up. Pick your avatar. Make it yours."
8. **A reflection module (Finite / Unsent / Values)** — "Tools that go deeper than a streak."
9. **Settings → privacy line** — "Everything stays on your device. No account. No tracking."

---

## Quick checklist before you submit

- [ ] Replace `CONTACT_EMAIL` in `src/pages/Privacy.tsx`, rebuild & redeploy.
- [ ] Pick the final app name + subtitle.
- [ ] Generate screenshots (and Play's 1024×500 feature graphic).
- [ ] Play: $25 developer account, sign the `.aab` (keep the keystore safe — it's gitignored), fill the Data Safety form.
- [ ] App Store: $99/yr Apple Developer, build the archive in Xcode on a Mac, fill App Privacy as "Data Not Collected", add the review note about the optional AI key.
- [ ] (Play TWA route only) host `public/.well-known/assetlinks.json` with your signing-key SHA-256.
```

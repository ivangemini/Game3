# Game3 Agent Operating Manual

## Mission
Build a polished, highly replayable HTML5 game for Yandex Games, CrazyGames, Poki-compatible distribution and other web portals. The game is a compact roguelite inventory autobattler / boss-rush built around an absurd original junk universe.

Working concept: **Junkpack: Boss Rush**. The name is provisional; the gameplay pillars are not.

## Product pillars
1. **Readable in 3 seconds.** The player immediately understands backpack placement, synergies and the current threat.
2. **Small content set, deep combinatorics.** Prefer systems that multiply possibilities over large quantities of handcrafted levels.
3. **Juicy, premium presentation.** Never ship programmer-art UI, placeholder-feeling motion, flat interactions or visually inconsistent assets as final work.
4. **Short sessions, long mastery.** A normal decision or battle resolves quickly; builds, discoveries, daily runs and endless scaling create long-term retention.
5. **Original absurdity.** Use surreal internet-chaos energy without copying specific copyrighted meme characters, brands or recognizable third-party IP.
6. **Web-first performance.** Mobile browsers and lower-end devices are first-class targets.
7. **Monetization must respect gameplay.** Ads belong at natural breaks or as optional rewarded value, never as arbitrary interruptions during active combat.

## Mandatory skill routing
Before substantial work, read the relevant file(s) under `skills/`:

- Game systems, loops, progression, encounters: `skills/game-design/SKILL.md`
- Moment-to-moment controls, combat, inventory interactions: `skills/gameplay/SKILL.md`
- UI, visual hierarchy, responsive layout, art direction: `skills/visual-design/SKILL.md`
- Motion, feedback, transitions, VFX timing: `skills/animation/SKILL.md`
- Economy, rewards, ads, retention systems: `skills/economy-retention/SKILL.md`
- Performance, portal SDK boundaries and web constraints: `skills/web-platform/SKILL.md`
- Testing, balancing, regressions and acceptance: `skills/qa-balancing/SKILL.md`

For cross-cutting tasks, read every applicable skill before editing.

## Source-of-truth documents
- `docs/GAME_DESIGN.md` — core design and product rules.
- `docs/ARCHITECTURE.md` — technical boundaries and code organization.
- `docs/ART_DIRECTION.md` — visual language and asset constraints.
- `ROADMAP.md` — implementation sequence and release gates.

If implementation and documentation disagree, do not silently choose one. Update the relevant source of truth in the same change or explicitly record the discrepancy.

## Technical direction
- Phaser 4 + TypeScript + Vite.
- Keep the simulation/domain layer independent from Phaser rendering where practical.
- Prefer deterministic seeded RNG for runs, shops, encounters and daily challenges.
- Keep portal integrations behind adapters; gameplay code must not depend directly on a specific platform SDK.
- Avoid a backend until a feature genuinely requires one.
- Persist versioned local save data and include migrations from the first schema change.

## Engineering rules
- TypeScript strict mode stays enabled.
- Avoid `any`; if unavoidable, isolate and document it.
- No giant god-scenes or god-managers. Separate domain state, rules, presentation and platform services.
- Gameplay numbers live in data/config, not scattered magic literals.
- Randomness must be injectable/seedable for tests.
- New mechanics need deterministic unit tests for their rules.
- Asset keys and IDs are stable identifiers; displayed names may change without breaking saves.
- Do not couple frame rate to simulation results.

## Design quality bar
Every player-facing action should answer all three questions visually:
1. What did I do?
2. What changed?
3. Why did it matter?

Interactions must have clear hover/press/drag/drop states where relevant. Important effects need anticipation, impact and recovery rather than instantaneous state swaps.

## Scope discipline
Do not add multiplayer, real-time PvP, guilds, chat, open world, story cinematics, server-authoritative economy or battle pass unless the roadmap explicitly promotes them.

Prefer additions such as one new item tag that creates ten new build interactions over ten isolated items with no systemic value.

## Definition of done
A gameplay feature is not done merely because it compiles. It requires:
- correct rules,
- readable presentation,
- responsive input,
- feedback/animation,
- persistence implications considered,
- mobile/web performance considered,
- tests for deterministic logic,
- no obvious console errors,
- documentation updated when behavior or architecture changes.

## Required checks before commit
Run, when applicable:
- `npm run typecheck`
- `npm run test`
- `npm run build`

When browser verification tooling is available, also verify the main loop at desktop and narrow mobile viewport and inspect the console.

## Commit discipline
Keep commits coherent and descriptive. Do not mix unrelated refactors with feature work. Never delete working systems merely to simplify an implementation unless the roadmap explicitly calls for replacement.

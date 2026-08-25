# Architecture v0.7

## Stack
- Phaser 4.2.1
- TypeScript (strict)
- Vite 8
- Vitest for deterministic domain and simulation tests

Phaser 4 uses namespace imports from npm (`import * as Phaser from 'phaser'`).

## Layers
### `src/game/domain/`
Pure TypeScript simulation and rules. No Phaser imports. Inventory geometry, seeded shop generation, synergies, RNG, combat/effect ordering, fusions, events, perks, heroes and run state belong here.

### `src/game/data/`
Declarative content: items, combat profiles, encounters, bosses, perks, heroes, events, fusion recipes and balance tables. Stable IDs only.

### `src/game/simulation/`
Offline/QA simulation that composes domain rules with declarative game data. It remains deterministic and outside Phaser. Pacing reports protect session structure; combat/build reports generate legal seeded backpacks across weak/typical/strong power bands and execute the real combat engine against progression checkpoints.

### `src/game/audio/`
Asset-agnostic semantic audio cues derived from presentation events. Cue IDs/priorities/cooldowns are presentation contracts only: sound loading, WebAudio lifecycle, mixing and music remain outside the combat domain.

### `src/game/scenes/`
Phaser presentation/orchestration. Scenes translate domain state into visuals/input and coordinate persistence without making presentation the source of gameplay rules.

### `src/game/ui/`
Reusable game UI components/widgets. Components expose serializable state snapshots rather than scene-object references. Hero/perk/event overlays collect decisions; their callbacks update domain/persistence state rather than owning rules.

### `src/platform/`
Portal abstraction and implementations. Game logic calls one adapter API.

### `src/persistence/`
Versioned local save schema, serialization, validation and migrations.

## Determinism
All run-affecting randomness comes from seeded RNG. `Math.random()` is prohibited in domain run logic. Shops, mutations, events and other generated choices derive from stable seed namespaces so reloads cannot reroll outcomes.

QA simulations also use explicit seed namespaces. A pacing or balance regression must therefore be reproducible from its seed.

## Inventory rules
Backpack geometry, blocked pocket cells, fusion placement and synergy evaluation are deterministic domain rules. UI coordinates never determine whether an item fits or whether a synergy is active. Purchased prototype junk uses deterministic legal placement until a dedicated staging tray is promoted.

## Heroes and combat build
Heroes are light per-run rule-benders, not classes. `src/game/domain/heroes.ts` applies optional tagged bonuses to the same `ItemBonuses` vocabulary used by spatial synergies and perks. The build pipeline is:

1. resolve spatial synergies;
2. apply the selected hero's matching bonus;
3. apply selected run perks;
4. create immutable combat items.

This keeps hero effects deterministic and testable without Phaser. The Scavenger's starting-coin bonus is an economy effect applied once when the hero is chosen; combat-oriented heroes never mutate the backpack or combat state directly.

## Combat
`src/game/domain/combat.ts` owns the combat clock and ordered effect queue. The queue resolves by `dueAtMs`, then stable `sequence`, so equal-time effects have a documented deterministic order.

The render loop passes explicit elapsed milliseconds to `advanceCombat`; render FPS never determines trigger count, damage or outcome. A single large advance and many smaller advances over the same simulated duration must converge to the same state.

Backpack effects are converted into combat stats before simulation. Current examples include trigger speed, poison, laser shots, chaos damage and scrap armor. Boss interference can jam item triggers, slime occupied cells or temporarily scramble crossing rows. Phaser consumes presentation events for animation/audio/UI but cannot modify the combat result through presentation timing.

`CombatPanel` also maps each presentation event to a semantic `AudioCue` and exposes it through an optional callback. This is one-way presentation output: muting, throttling or failing to play audio cannot influence combat state.

## Time, pacing and balance QA
Combat simulation receives explicit elapsed time. Human decision pacing is modeled separately in `src/game/simulation/pacing.ts` so design-duration assumptions never leak into combat rules.

The seeded pacing model composes the real 12-encounter campaign/loop structure with target human decision-time ranges and produces first-boss, campaign, Loop 2 and Loop 3 percentile checkpoints. It is a regression guard, not a substitute for real play telemetry.

The seeded combat/build model generates legal backpacks against the current pocket constraints, samples perk/fusion exposure by power band, feeds those builds through the real synergy/perk/combat pipeline and reports outcomes plus item correlations. Synthetic build reports diagnose balance; soft-launch telemetry remains the authority for player behavior.

## Saves
Current schema: **v8**.

Persist IDs and values, never scene object references. Active-run persistence includes the run seed, hero ID, shop/economy state, backpack placements/rotations, generated-instance sequence, run progression/loop state, claim-once encounter rewards, selected perks and deterministic event cursor/history/pending event.

Legacy v1–v7 saves migrate forward. A v7 active run migrates with `heroId: null`; the next scene load asks for one hero choice without discarding backpack, economy, events or progression. Malformed save payloads fall back safely, and restored backpack items are sanitized against current definitions, blocked cells, duplicates and collisions before scene objects are created.

Meta persistence also tracks durable discovery and deepest completed corrupted-loop progress. Content removal must continue to tolerate legacy IDs safely. Every future schema change requires migration coverage in the same change.

## Platform adapter outline
Capabilities may include init, player identity when available, locale, storage/cloud save, interstitial, rewarded ad, gameplay start/stop signals and leaderboard hooks. Every capability requires a graceful unsupported fallback.

## Asset strategy
Use generated/source art → reviewed final exports → atlases where beneficial. Keep source assets separate from runtime-optimized assets. Never bind gameplay rules to filename semantics.

## Quality gates
Typecheck + unit tests + production build on every main-branch push. Deterministic pacing/balance simulations run in tests as regression guards. Browser smoke verification is required once a connected/runnable browser environment is available.

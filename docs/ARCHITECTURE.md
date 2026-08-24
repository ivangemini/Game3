# Architecture v0.3

## Stack
- Phaser 4.2.1
- TypeScript (strict)
- Vite 8
- Vitest for deterministic domain tests

Phaser 4 uses namespace imports from npm (`import * as Phaser from 'phaser'`).

## Layers
### `src/game/domain/`
Pure TypeScript simulation and rules. No Phaser imports. Inventory geometry, seeded shop generation, synergies, RNG, combat/effect ordering and run state belong here.

### `src/game/data/`
Declarative content: items, combat profiles, enemies, bosses, perks and balance tables. Stable IDs only.

### `src/game/scenes/`
Phaser presentation/orchestration. Scenes translate domain state into visuals/input and coordinate persistence without making presentation the source of gameplay rules.

### `src/game/ui/`
Reusable game UI components/widgets. Components expose serializable state snapshots rather than scene-object references.

### `src/platform/`
Portal abstraction and implementations. Game logic calls one adapter API.

### `src/persistence/`
Versioned local save schema, serialization, validation and migrations.

## Determinism
All run-affecting randomness comes from a seeded RNG instance passed to systems. `Math.random()` is prohibited in domain run logic. Shop offers are derived from `runSeed + shopIndex`, and definitions are sorted before weighted selection so source-array order cannot change a Daily Run.

## Inventory rules
Backpack geometry and synergy evaluation are deterministic domain rules. UI coordinates never determine whether an item fits or whether a synergy is active. Purchased prototype junk uses deterministic first-fit placement until a dedicated staging tray is promoted.

## Combat
`src/game/domain/combat.ts` owns the combat clock and ordered effect queue. The queue resolves by `dueAtMs`, then stable `sequence`, so equal-time effects have a documented deterministic order.

The render loop passes explicit elapsed milliseconds to `advanceCombat`; render FPS never determines trigger count, damage or outcome. A single large advance and many smaller advances over the same simulated duration must converge to the same state.

Backpack effects are converted into combat stats before simulation:
- Battery synergy modifies trigger interval;
- Poison adds poison-on-hit;
- Cat/Laser adds additional laser shots;
- Duck/Chaos adds provisional chaos damage;
- Magnet/Metal scrap armor becomes opening shield.

Combat emits presentation events (`item-triggered`, damage, poison, shield, player hit, outcome). Phaser consumes those events for animation/audio/UI but cannot modify the combat result through presentation timing.

## Time
Simulation receives explicit delta/ticks. Do not encode damage or trigger counts directly from render FPS.

## Saves
Current schema: **v2**.

Persist IDs and values, never scene object references. Active-run persistence currently stores:
- run seed;
- shop index;
- run coins;
- sold offer IDs for the current shop step;
- placed item IDs, origins and rotations;
- next generated loot-instance sequence.

`v1` meta saves migrate to `v2` with no active run. Malformed save payloads fall back safely. Restored backpack items are also sanitized against current item definitions, blocked cells, duplicates and placement collisions before scene objects are created.

Content removal must continue to tolerate legacy IDs safely. Future save changes require a migration in the same change.

## Platform adapter outline
Capabilities may include init, player identity when available, locale, storage/cloud save, interstitial, rewarded ad, gameplay start/stop signals and leaderboard hooks. Every capability requires a graceful unsupported fallback.

## Asset strategy
Use generated/source art → reviewed final exports → atlases where beneficial. Keep source assets separate from runtime-optimized assets. Never bind gameplay rules to filename semantics.

## Quality gates
Typecheck + unit tests + production build on every main-branch push. Browser smoke verification is required once a connected/runnable browser environment is available.

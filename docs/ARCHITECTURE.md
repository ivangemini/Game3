# Architecture v0.2

## Stack
- Phaser 4.2.1
- TypeScript (strict)
- Vite 8
- Vitest for deterministic domain tests

Phaser 4 uses namespace imports from npm (`import * as Phaser from 'phaser'`).

## Layers
### `src/game/domain/`
Pure TypeScript simulation and rules. No Phaser imports. Inventory geometry, seeded shop generation, synergies, RNG, item/effect data structures, recipes, combat resolution and run state belong here.

### `src/game/data/`
Declarative content: items, bosses, perks, balance tables. Stable IDs only.

### `src/game/scenes/`
Phaser presentation/orchestration. Scenes translate domain state into visuals/input and coordinate persistence without making persistence the source of gameplay rules.

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
Typecheck + unit tests + production build on every main-branch push. Browser smoke verification is added once the first interactive scene lands.

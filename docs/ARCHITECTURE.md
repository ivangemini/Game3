# Architecture v0.1

## Stack
- Phaser 4.2.1
- TypeScript (strict)
- Vite 8
- Vitest for deterministic domain tests

Phaser 4 uses namespace imports from npm (`import * as Phaser from 'phaser'`).

## Layers
### `src/game/domain/`
Pure TypeScript simulation and rules. No Phaser imports. Inventory geometry, RNG, item/effect data structures, recipes, combat resolution and run state belong here.

### `src/game/data/`
Declarative content: items, bosses, perks, balance tables. Stable IDs only.

### `src/game/scenes/`
Phaser presentation/orchestration. Scenes translate domain state into visuals and input.

### `src/game/ui/`
Reusable game UI components/widgets once the prototype grows.

### `src/platform/`
Portal abstraction and implementations. Game logic calls one adapter API.

### `src/persistence/`
Versioned local save schema, serialization and migrations.

## Determinism
All run-affecting randomness comes from a seeded RNG instance passed to systems. `Math.random()` is prohibited in domain run logic.

## Time
Simulation receives explicit delta/ticks. Do not encode damage or trigger counts directly from render FPS.

## Saves
Persist IDs and values, never scene object references. Save schema starts versioned. Content removal must handle legacy IDs safely.

## Platform adapter outline
Capabilities may include init, player identity when available, locale, storage/cloud save, interstitial, rewarded ad, gameplay start/stop signals and leaderboard hooks. Every capability requires a graceful unsupported fallback.

## Asset strategy
Use generated/source art → reviewed final exports → atlases where beneficial. Keep source assets separate from runtime-optimized assets. Never bind gameplay rules to filename semantics.

## Quality gates
Typecheck + unit tests + production build on every main-branch push. Browser smoke verification is added once the first interactive scene lands.
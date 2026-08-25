# Architecture v0.14

## Stack
- Phaser 4.2.1
- TypeScript (strict)
- Vite 8
- Vitest for deterministic domain and simulation tests

Phaser 4 uses namespace imports from npm (`import * as Phaser from 'phaser'`).

## Layers
### `src/game/domain/`
Pure TypeScript simulation and rules. No Phaser imports. Inventory geometry, seeded shop generation, synergies, RNG, combat/effect ordering, boss-rule composition, fusions, events, perks, heroes, collection visibility and run state belong here.

### `src/game/data/`
Declarative content: items, combat profiles, encounters, bosses, perks, heroes, events, fusion recipes and balance tables. Stable IDs only.

Large content additions may live in wave modules such as `items.wave4.ts`, `combatProfiles.wave4.ts`, `fusionRecipes.wave4.ts`, `perks.wave4.ts` and `runEvents.wave4.ts`. Stable aggregators (`items.ts`, `combatProfiles.ts`, `fusionRecipes.ts`, `perks.ts`, `runEvents.ts`) remain the public runtime surface so scenes/domain code do not depend on content-wave file layout.

### `src/game/simulation/`
Offline/QA simulation that composes domain rules with declarative game data. It remains deterministic and outside Phaser. Pacing reports protect session structure; combat/build reports generate legal seeded backpacks across weak/typical/strong power bands and execute the same combat + boss-rule wrapper used by runtime encounters.

### `src/game/audio/`
Asset-agnostic semantic audio cues derived from presentation events. Cue IDs/priorities/cooldowns are presentation contracts only: sound loading, WebAudio lifecycle, mixing and music remain outside the combat domain.

### `src/game/scenes/`
Phaser presentation/orchestration. Scenes translate domain state into visuals/input and coordinate persistence without making presentation the source of gameplay rules.

### `src/game/ui/`
Reusable game UI components/widgets. Components expose serializable state snapshots rather than scene-object references. Hero/perk/event overlays collect decisions; callbacks update domain/persistence state rather than owning rules. `CollectionOverlay` is read-only and receives discovery through a scene callback instead of reading/writing persistence itself.

### `src/platform/`
Portal abstraction and implementations. Game logic calls one adapter API.

### `src/persistence/`
Versioned local save schema, serialization, validation and migrations.

## Determinism
All run-affecting randomness comes from seeded RNG. `Math.random()` is prohibited in domain run logic. Shops, mutations, events and other generated choices derive from stable seed namespaces so reloads cannot reroll outcomes.

Run events use the existing `coins / item / gamble` reward algebra. Expanding the event pool is declarative: `selectRunEvent` sorts stable IDs before seeded selection and suppresses immediate repeats when alternatives exist. Item rewards resolve deterministically from sorted definition IDs. Adding event definitions therefore requires no new save schema or UI state.

QA simulations also use explicit seed namespaces. A pacing or balance regression must therefore be reproducible from its seed.

## Inventory rules
Backpack geometry, blocked pocket cells, fusion placement and synergy evaluation are deterministic domain rules. UI coordinates never determine whether an item fits or whether a synergy is active. Purchased prototype junk uses deterministic legal placement until a dedicated staging tray is promoted.

Physical side contact is also a reusable gameplay concept separate from synergy activation. Closet Monster's Clutter Crush treats an item as anchored when any occupied cell shares an orthogonal side with a cell owned by another item. Tags do not matter for this defensive contact rule.

The fixed prototype backpack boundary is another domain-level geometry concept. Border Shark's Edge Rent classifies an item as a perimeter item when any occupied cell lies on `x = 0`, `x = BACKPACK_WIDTH - 1`, `y = 0` or `y = BACKPACK_HEIGHT - 1`. The rule counts items rather than edge cells.

## Heroes and combat build
Heroes are light per-run rule-benders, not classes. `src/game/domain/heroes.ts` applies optional tagged bonuses to the same `ItemBonuses` vocabulary used by spatial synergies and perks. The build pipeline is:

1. resolve spatial synergies;
2. apply the selected hero's matching bonus;
3. apply selected run perks;
4. create immutable combat items.

Combat items retain stable definition IDs, gameplay tags and occupied cells. Boss rules can therefore reason about exact duplicates, tag composition and geometry without importing declarative item data back into combat execution.

## Fusion tiers
Fusion remains data-driven: recipes only declare ingredient definition IDs and one result definition ID. Second-stage evolutions use exactly the same domain path as normal recipes; their distinction is that every ingredient is itself fusion-only.

`SECOND_STAGE_FUSION_RECIPE_IDS` / `SECOND_STAGE_FUSION_RESULT_IDS` are declarative QA/content metadata, not save state. Runtime availability still comes from `findFusionCandidate` against the player's real inventory. This keeps secret transformations discoverable without a second fusion engine or progression flag.

## Collection / meta discovery
`src/game/domain/collection.ts` is the presentation-safe boundary for Itemdex and Recipe Book state. It combines the current item/recipe catalog with durable discovery IDs and returns tagged union entries:

- undiscovered item entries contain only the stable item ID plus `discovered: false`;
- discovered item entries additionally expose the real definition and shop-vs-fusion source;
- undiscovered recipe entries contain only the stable recipe ID plus `discovered: false`;
- discovered recipe entries expose ingredients/result and derive first-stage vs second-stage classification.

This design deliberately prevents the Phaser UI from accidentally reading hidden names, tags, descriptions or recipe ingredients before discovery.

Collection progress is derived from the current catalog, not raw save-array length. Unknown/stale IDs left by removed content are ignored instead of inflating completion or requiring an immediate save migration.

`CollectionOverlay` owns pagination/rendering only. The scene supplies the current discovery IDs through a callback, and the overlay cannot mutate inventory, currency, discovery or combat state. While visible, scene actions that would advance/fuse/cash-out are gated.

## Combat
`src/game/domain/combat.ts` owns the generic combat clock and ordered effect queue. The queue resolves by `dueAtMs`, then stable `sequence`, so equal-time effects have a documented deterministic order.

The render loop passes explicit elapsed milliseconds to combat advancement; render FPS never determines trigger count, damage or outcome. A single large advance and many smaller advances over the same simulated duration must converge to the same state.

Backpack effects are converted into combat stats before simulation. Current examples include trigger speed, poison, laser shots, chaos damage and scrap armor. Core interference can jam item triggers, slime occupied cells, scramble crossing rows or temporarily eclipse a dominant item tag. Phaser consumes presentation events for animation/audio/UI but cannot modify the combat result through presentation timing.

TV Tyrant owns item/cell/row interference primitives. Baby Moon owns tag interference. `src/game/domain/bossCombat.ts` composes four additional wrapper families:
- **Deadline Snail / Time Tax** — shifts the fastest meaningful item's next trigger;
- **Closet Monster / Clutter Crush** — pressure from loose geometry;
- **Copycat Auditor / Duplicate Debt** — pressure from exact-definition repetition;
- **Border Shark / Edge Rent** — pressure from perimeter occupancy.

The wrapper advances generic combat exactly to boss telegraph/impact boundaries before applying deterministic transforms. Corrupted-loop encounter generation alternates World 2/World 3 wrapper families without increasing encounter count: even loops use Copycat Auditor + Border Shark, odd loops use Deadline Snail + Closet Monster. World 1 remains TV Tyrant and World 4 remains Baby Moon.

## Time, pacing and balance QA
Combat simulation receives explicit elapsed time. Human decision pacing is modeled separately in `src/game/simulation/pacing.ts` so design-duration assumptions never leak into combat rules.

The seeded pacing model composes the real 12-encounter campaign/loop structure with target human decision-time ranges and produces first-boss, campaign, Loop 2 and Loop 3 percentile checkpoints. It is a regression guard, not a substitute for real play telemetry.

The seeded combat/build model generates legal backpacks, samples perks/fusions by power band, feeds builds through the real synergy/perk/combat pipeline and advances through the same boss-rule wrapper used by runtime.

Synthetic fusion availability is progression-aware. Campaign checkpoints exclude all IDs in `SECOND_STAGE_FUSION_RESULT_IDS`; Corrupted Loop checkpoints may sample the full fusion pool. This prevents impossible early-game secret evolutions from distorting campaign reports while still exercising their combat profiles in late-run QA.

Synthetic build reports diagnose balance; soft-launch telemetry remains the authority for player behavior.

## Saves
Current schema: **v8**.

Persist IDs and values, never scene object references. Active-run persistence includes the run seed, hero ID, shop/economy state, backpack placements/rotations, generated-instance sequence, run progression/loop state, claim-once encounter rewards, selected perks and deterministic event cursor/history/pending event.

Legacy v1–v7 saves migrate forward. Malformed save payloads fall back safely, and restored backpack items are sanitized against current definitions, blocked cells, duplicates and collisions before scene objects are created.

Meta persistence also tracks durable item/recipe discovery and deepest completed corrupted-loop progress. Itemdex/Recipe Book are views over those existing discovery arrays and therefore required no schema bump from v8. Content removal must continue to tolerate legacy IDs safely. Every future schema change requires migration coverage in the same change.

## Platform adapter outline
Capabilities may include init, player identity when available, locale, storage/cloud save, interstitial, rewarded ad, gameplay start/stop signals and leaderboard hooks. Every capability requires a graceful unsupported fallback.

## Asset strategy
Use generated/source art → reviewed final exports → atlases where beneficial. Keep source assets separate from runtime-optimized assets. Never bind gameplay rules to filename semantics.

## Quality gates
Typecheck + unit tests + production build on every main-branch push. Deterministic pacing/balance/boss/event/collection tests run as regression guards. Browser smoke verification is required once a connected/runnable browser environment is available.

# Architecture v0.16

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

Large content additions may live in wave modules such as `items.wave4.ts`, `combatProfiles.wave4.ts`, `fusionRecipes.wave4.ts`, `perks.wave4.ts` and `runEvents.wave4.ts`. Stable aggregators remain the public runtime surface so scenes/domain code do not depend on content-wave file layout.

### `src/game/simulation/`
Offline/QA simulation that composes domain rules with declarative game data. It remains deterministic and outside Phaser. Pacing reports protect session structure; combat/build reports generate legal seeded backpacks and execute the same combat + boss-rule wrapper used by runtime encounters.

### `src/game/audio/`
Semantic audio cues are the stable contract. `audioMix.ts` owns runtime-independent cooldown/priority/voice-budget admission, `audioSynthesis.ts` maps accepted cues to short deterministic synth patches, `musicPattern.ts` defines deterministic menu/combat/boss beds, and `GameAudio.ts` owns browser WebAudio lifecycle and music/SFX buses.

Audio may be dropped or mixed differently for readability, but it can never change simulation state.

### `src/game/scenes/`
Phaser presentation/orchestration. Scenes translate domain state into visuals/input and coordinate persistence without making presentation the source of gameplay rules. `PrototypeScene` fans semantic cues out to audio and presentation feedback.

### `src/game/ui/`
Reusable game UI components/widgets. Components expose serializable state snapshots rather than scene-object references where state leaves the UI layer.

Presentation-only modules include:
- `visualTokens.ts` — material/rarity tokens plus stable item-art keys;
- `ItemGlyph.ts` — shared item renderer with atlas-first / procedural-fallback behavior;
- `BackpackSkin.ts` — decorative leather/scrap shell only;
- `CombatFeedback` / `RunFeedback` — transient effects only;
- `TopHudActions`, overlays and `uiMotion` — input/presentation controls.

These modules may animate or decorate but cannot decide inventory validity, fusion validity, combat outcomes, run rewards or seeded choices.

### `src/platform/`
Portal abstraction and implementations. Game logic calls one adapter API.

### `src/persistence/`
Versioned local save schema, serialization, validation and migrations.

## Determinism
All run-affecting randomness comes from seeded RNG. `Math.random()` is prohibited in domain run logic. Shops, mutations, events and generated choices derive from stable seed namespaces so reloads cannot reroll outcomes.

Run events use the existing `coins / item / gamble` reward algebra. `selectRunEvent` sorts stable IDs before seeded selection and suppresses immediate repeats when alternatives exist. Item rewards resolve deterministically from sorted definition IDs.

QA simulations also use explicit seed namespaces so any pacing/balance regression can be reproduced from its seed.

## Inventory rules
Backpack geometry, blocked pocket cells, fusion placement and synergy evaluation are deterministic domain rules. UI coordinates never determine whether an item fits or whether a synergy is active.

Physical side contact is a reusable gameplay concept separate from synergy activation. Closet Monster's Clutter Crush treats an item as anchored when any occupied cell shares an orthogonal side with a cell owned by another item. Tags do not matter for this defensive contact rule.

Border Shark's Edge Rent classifies an item as a perimeter item when any occupied cell lies on the fixed backpack boundary. The rule counts items rather than edge cells.

The tactile backpack visuals introduced in P6 are strictly presentation: leather frame, stitched cells, locked-pocket labels, item glyphs, tape labels and synergy trails do not participate in placement calculations.

## Heroes and combat build
Heroes are light per-run rule-benders, not classes. `heroes.ts` applies optional tagged bonuses to the same `ItemBonuses` vocabulary used by spatial synergies and perks. The build pipeline is:

1. resolve spatial synergies;
2. apply selected hero bonuses;
3. apply selected run perks;
4. create immutable combat items.

Combat items retain stable definition IDs, gameplay tags and occupied cells so boss rules can reason about exact duplicates, tag composition and geometry without importing declarative item data back into combat execution.

## Fusion tiers
Fusion remains data-driven: recipes only declare ingredient definition IDs and one result definition ID. Second-stage evolutions use the same domain path as normal recipes; their distinction is that every ingredient is itself fusion-only.

`SECOND_STAGE_FUSION_RECIPE_IDS` / `SECOND_STAGE_FUSION_RESULT_IDS` are declarative QA/content metadata, not save state. Runtime availability still comes from `findFusionCandidate` against the player's real inventory.

## Collection / meta discovery
`collection.ts` is the presentation-safe boundary for Itemdex and Recipe Book state. Undiscovered entries never expose hidden definition/recipe payloads. Collection progress is derived from the current catalog, so stale IDs cannot inflate completion.

`CollectionOverlay` owns pagination/rendering only. The scene supplies discovery IDs through a callback, and the overlay cannot mutate inventory, currency, discovery or combat state. While visible, scene actions that advance/fuse/cash-out are gated.

## Combat
`combat.ts` owns the generic combat clock and ordered effect queue. The queue resolves by `dueAtMs`, then stable `sequence`, so equal-time effects have documented deterministic order.

The render loop passes explicit elapsed milliseconds to combat advancement; render FPS never determines trigger count, damage or outcome. A single large advance and many smaller advances over the same simulated duration must converge.

Backpack effects are converted into combat stats before simulation. Phaser consumes presentation events for animation/audio/UI but cannot modify combat through presentation timing.

TV Tyrant owns item/cell/row interference primitives. Baby Moon owns tag interference. `bossCombat.ts` composes four wrapper families:
- Deadline Snail / Time Tax;
- Closet Monster / Clutter Crush;
- Copycat Auditor / Duplicate Debt;
- Border Shark / Edge Rent.

Corrupted-loop encounter generation alternates World 2/World 3 wrapper families without increasing encounter count: even loops use Copycat Auditor + Border Shark, odd loops use Deadline Snail + Closet Monster. World 1 remains TV Tyrant and World 4 remains Baby Moon.

## Presentation feedback and audio
Combat presentation uses one semantic cue stream for both sound and juice:

1. `CombatPanel` converts combat/boss presentation events into `AudioCue` records.
2. `PrototypeScene` forwards cues to `GameAudio` and `CombatFeedback`.
3. `GameAudio` applies cooldown and a 10-voice semantic budget before rendering SFX.
4. `CombatFeedback` independently throttles visual spam and uses a bounded particle pool.

Non-combat shop/fusion/reward/pocket actions use separate semantic UI cues and `RunFeedback` without importing WebAudio into those widgets.

The WebAudio context is created/resumed only after an actual pointer/key interaction. Page visibility suspends running audio; returning only resumes a context that was previously unlocked. Existing save-v8 `sfxVolume` and `musicVolume` values feed the runtime directly.

Current SFX/music are procedural prototypes. Final authored samples can replace renderers without changing gameplay or semantic cue sources.

## Settings / motion
Settings remain inside save v8: separate Music/SFX volumes plus Reduced Motion. The Settings overlay edits a draft and commits through the scene. Audio gains update immediately; a Reduced Motion change refreshes the presentation scene so all components use one consistent motion policy.

Reduced-motion mode removes camera shake and traveling particle effects while retaining static rings/flashes and state text so causality remains readable.

## Item visual / atlas boundary
Item identity remains `definitionId`; art is replaceable presentation.

Runtime contract:
- texture key: `junk-items`;
- frame: `item.<definitionId>`;
- `ItemGlyph` checks for that frame and uses it if available;
- otherwise it renders a deterministic primary-tag procedural silhouette.

Backpack, shop and fusion all consume `ItemGlyph`, so reviewed item art can arrive incrementally and automatically replace fallback visuals without changing layout code, persistence or gameplay data.

Rarity borders, selected states, synergy badges, labels and locked states stay in UI rendering rather than being baked into item sprites. See `docs/SYSTEMS/ART_PIPELINE.md`.

## Time, pacing and balance QA
Combat simulation receives explicit elapsed time. Human decision pacing is modeled separately in `simulation/pacing.ts` so design-duration assumptions never leak into combat rules.

The seeded pacing model composes the real 12-encounter campaign/loop structure with target human decision-time ranges. The seeded combat/build model generates legal backpacks, samples perks/fusions by power band and advances through the same boss-rule wrapper used by runtime.

Campaign balance sampling excludes second-stage fusion results; Corrupted Loop checkpoints may sample the full fusion pool.

Synthetic reports diagnose balance; soft-launch telemetry remains the authority for player behavior.

## Saves
Current schema: **v8**.

Persist IDs and values, never scene object references. Active-run persistence includes seed, hero, shop/economy state, backpack placements/rotations, generated-instance sequence, progression/loop state, claim-once encounter rewards, perks and deterministic event cursor/history/pending event.

Legacy v1–v7 saves migrate forward. Malformed payloads fall back safely, and restored backpack items are sanitized against current definitions, blocked cells, duplicates and collisions.

Meta persistence tracks durable item/recipe discovery and deepest completed corrupted-loop progress. Audio settings persist separately from run state. Visual/atlas changes never require save migrations because saves do not contain texture/frame names.

## Platform adapter outline
Capabilities may include init, player identity when available, locale, storage/cloud save, interstitial, rewarded ad, gameplay start/stop signals and leaderboard hooks. Every capability requires a graceful unsupported fallback.

## Asset strategy
Use generated/source art → reviewed final exports → runtime atlases. Keep source assets separate from runtime-optimized assets. Never bind gameplay rules to filename semantics.

Item atlas keys are stable presentation identifiers only. Atlas pages may be split during P8 profiling without changing frame keys. Boss art and UI chrome use separate atlases from items.

Final audio samples/music keep the semantic mixer contract: short high-information SFX, compressed web-friendly assets, separate music/SFX buses and no dependency of gameplay on sample duration.

## Quality gates
Typecheck + unit tests + production build on every main-branch push. Deterministic pacing/balance/boss/event/collection/audio/visual-token tests run as regression guards. Browser smoke verification is required once a connected/runnable browser environment is available.

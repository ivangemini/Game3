# Runtime Presentation Layer

## Purpose

`RuntimePresentationScene` and `RuntimeSurfacePolishScene` are presentation-only composition layers for the live `PrototypeScene`. They exist to close the gap between functional gameplay and the production visual target: tactile junk-built chrome, stronger boss staging, a physical backpack silhouette, clearer first-run choices, and more deliberate screen hierarchy.

`RuntimePresentationScene` owns the high-level atmosphere and boss portrait staging. `RuntimeSurfacePolishScene` performs the final runtime cleanup pass around legacy developer-facing copy and static surfaces: build-link readout, shop crate hardware, and boss-only arena-floor treatment.

## Boundary

The presentation scenes never own or mutate gameplay state. They may:

- install decorative objects into the active gameplay scene at controlled depths;
- hide legacy developer-facing explanatory copy when equivalent game-facing presentation is installed;
- mirror already-rendered encounter/boss copy for presentation;
- show authored boss portrait art through `BossPortraitLayer`;
- react to presentation text that was already produced by combat events to trigger telegraph/impact motion;
- add atmosphere, frames, material wear, lighting accents and composition chrome.

They must not:

- decide combat outcomes, rewards, item placement, synergy validity, encounter selection or progression;
- generate gameplay randomness;
- mutate inventory or save state;
- make simulation timing depend on animation timing;
- block or replace existing gameplay hit targets.

## Lifecycle

`AssetPreloadScene` launches `runtime-presentation` and `runtime-surface-polish` before starting `prototype`. Both presentation scenes watch the active prototype scene and reinstall their decorative layer after each prototype restart. Hidden markers owned by the target scene make restart detection deterministic and avoid accumulating duplicate chrome.

## Boss staging

The live combat panel remains the source of enemy identity and boss-rule status. The presentation layer recognizes the currently rendered boss name, resolves the existing authored boss asset, and delegates idle/telegraph/impact motion to `BossPortraitLayer`. Boss effects remain driven by the existing semantic combat/audio presentation path; portrait motion is visual feedback only.

The arena-floor treatment is boss-gated. It stays hidden during normal encounters so non-boss names and combat readouts remain unobstructed, then appears only while the existing boss presentation label reports a live boss.

## Production surfaces

The production pass deliberately preserves deterministic gameplay behavior while replacing dashboard-like presentation:

- first-run hero cards expose the already-existing hero build hook as a strong visual stat band;
- `RunProgressPanel` reads as a boss contract / route ticket while preserving encounter and CTA coordinates;
- `ShopPanel` offers read as physical loot crates while keeping deterministic offers, prices, rerolls and rewarded-ad behavior;
- `FusionPanel` reads as a compact reaction machine while keeping recipe discovery, unlock, consumption and result placement unchanged;
- legacy backpack/synergy specification copy is replaced at runtime by a compact link readout without changing the underlying synergy system.

## Visual target

The production target is original premium cartoon junk-surrealism: worn leather and scrap framing, clear item silhouettes, dark structural surfaces, and concentrated neon around active synergies and boss pressure. The runtime should evoke the density and tactile energy of the approved direction without copying another game's signature UI or third-party characters.

## Performance and accessibility

The layers use Phaser primitives, existing atlas portraits and deterministic lightweight material overlays. They add no gameplay texture fetches and no per-frame simulation work beyond small presentation-state checks. Large boss motion respects reduced-motion preference; gameplay remains readable when those motions are suppressed.

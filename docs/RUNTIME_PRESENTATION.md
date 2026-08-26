# Runtime Presentation Layer

## Purpose

`RuntimePresentationScene` is a presentation-only composition layer for the live `PrototypeScene`. It exists to close the gap between functional gameplay and the production visual target: tactile junk-built chrome, stronger boss staging, a physical backpack silhouette, and more deliberate screen hierarchy.

## Boundary

The scene never owns or mutates gameplay state. It may:

- install decorative objects into the active gameplay scene at controlled depths;
- mirror already-rendered encounter/boss copy for presentation;
- show authored boss portrait art through `BossPortraitLayer`;
- react to presentation text that was already produced by combat events to trigger telegraph/impact motion;
- add atmosphere, frames, material wear, lighting accents and composition chrome.

It must not:

- decide combat outcomes, rewards, item placement, synergy validity, encounter selection or progression;
- generate gameplay randomness;
- mutate inventory or save state;
- make simulation timing depend on animation timing.

## Lifecycle

`AssetPreloadScene` launches `runtime-presentation` before starting `prototype`. The presentation scene watches the active prototype scene and installs its decorative layer after each prototype restart. A hidden marker owned by the target scene makes restart detection deterministic and avoids accumulating duplicate chrome.

## Boss staging

The live combat panel remains the source of enemy identity and boss-rule status. The presentation layer recognizes the currently rendered boss name, resolves the existing authored boss asset, and delegates idle/telegraph/impact motion to `BossPortraitLayer`. Boss effects remain driven by the existing semantic combat/audio presentation path; portrait motion is visual feedback only.

## Visual target

The production target is original premium cartoon junk-surrealism: worn leather and scrap framing, clear item silhouettes, dark structural surfaces, and concentrated neon around active synergies and boss pressure. The runtime should evoke the density and tactile energy of the approved direction without copying another game's signature UI or third-party characters.

## Performance and accessibility

The layer uses Phaser primitives, existing atlas portraits and deterministic lightweight material overlays. It adds no gameplay texture fetches and no per-frame simulation work beyond small presentation-state checks. Large boss motion respects reduced-motion preference; gameplay remains readable when those motions are suppressed.

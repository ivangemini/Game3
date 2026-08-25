# UI Motion Foundation

## Goal
Use one small motion vocabulary for overlays and controls instead of ad-hoc tweens scattered through every Phaser component.

Motion must answer what changed and reinforce hierarchy. It must not become constant ambient noise.

## Shared primitives
`src/game/ui/uiMotion.ts` currently defines:

- `revealOverlay(...)` — fast fade + short vertical settle;
- `dismissOverlay(...)` — shorter fade/settle out;
- `pressPulse(...)` — 3% press compression with yoyo recovery;
- `prefersReducedUiMotion()` — browser reduced-motion fallback.

Default timings follow the project animation skill:

- overlay open: 180 ms;
- overlay close: 120 ms;
- button press: 70 ms per half of the yoyo.

## Applied surfaces
The first pass is live on:

- `Trophy Shelf / Archive Ranks`;
- `Junk Archive / Itemdex / Recipe Book`.

Both overlays now share open/close behavior and close-button press feedback. Meta completion is also represented with physical progress bars rather than percentage text alone.

## Accessibility
When `prefers-reduced-motion: reduce` is active, overlay transitions resolve immediately and press pulses are skipped. Gameplay rules and input gating are unchanged.

The existing in-game `SaveSettings.reducedMotion` remains the authority for combat/backpack animation paths that already receive it. A later P6 consolidation pass can route that user setting into every UI motion surface without changing these primitives.

## Performance
The helper kills existing tweens on the same targets before starting a new overlay transition. Frequent particle systems are deliberately not part of this helper; they require their own pooling/budget contract.

## Remaining animation/VFX work
The roadmap's full animation/VFX item remains open until runtime review covers:

- backpack pickup/drop/snap polish;
- fusion/reward reveal staging;
- combat hit and trigger emphasis;
- boss anticipation/impact/recovery consistency;
- milestone/secret-discovery celebration;
- mobile frame-budget validation.

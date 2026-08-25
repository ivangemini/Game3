# Responsive HUD / Web-Shell Foundation

## Goal
Keep Junkpack readable and touch-safe on mobile web without moving browser geometry into combat, inventory or run rules.

The game remains landscape-first. Narrow landscape is supported; portrait is treated as an orientation problem instead of shrinking a 1600×900 playfield until labels and boss telegraphs become unreadable.

## Viewport contract
`src/platform/viewport.ts` classifies the browser viewport into:

- `standard-landscape` — normal desktop/tablet presentation;
- `compact-landscape` — phone/small-tablet landscape where later HUD reflow should prefer larger critical controls and less secondary chrome;
- `portrait` — shows the rotate-device gate.

The classifier is pure and unit-tested. Phaser gameplay does not decide orientation.

## Safe areas
The web shell uses CSS environment insets on `#app`:

- `safe-area-inset-top`;
- `safe-area-inset-right`;
- `safe-area-inset-bottom`;
- `safe-area-inset-left`.

The Phaser canvas therefore fits inside notches / Dynamic Island / browser-edge safe areas instead of drawing critical controls underneath them.

## Portrait behavior
`src/main.ts` owns a lightweight DOM orientation gate. In portrait:

- the game canvas is visually de-emphasized and stops accepting pointer input;
- a short rotate-device message stays inside safe areas;
- rotating back to landscape removes the gate without restarting the run.

This is intentionally presentation-only. No save or run state changes occur.

## Compact landscape
Compact-landscape is currently a stable profile signal exposed through `data-viewport-mode` / `data-compact-hud`. It is the hook for the next P6 pass that will reflow/resize the smallest Phaser HUD labels and secondary controls after real-device visual review.

## Mobile browser hygiene
The shell also:

- uses dynamic viewport height (`100dvh`) with fallback;
- disables overscroll and touch callout selection around the canvas;
- disables browser tap highlight on the canvas;
- keeps the canvas bounded by the safe-area content box;
- respects `prefers-reduced-motion` for shell-level behavior.

## QA
`tests/viewport.test.ts` covers standard landscape, phone landscape, portrait gating and invalid-dimension sanitization.

Browser/device verification is still required before the roadmap's full `responsive game HUD` item can be marked complete. The remaining work is visual reflow/legibility validation of Phaser panels, not viewport detection or safe-area plumbing.

# Runtime Profiling

## Goal
Keep the web-first build within a stable soft-launch performance envelope without pretending CI hardware is a substitute for physical devices.

## Automated browser baseline
`tests/e2e/performance.spec.ts` runs against the production build inside the existing Playwright matrix and protects three regression surfaces:

1. **Idle frame cadence** — samples `requestAnimationFrame` deltas after boot. The gate is deliberately broad (`p95 < 100 ms`, max frame `< 500 ms`, no more than three `>100 ms` frames during the sample) so shared CI runner jitter does not become a false release blocker.
2. **WebGL backing store** — requires a live, non-lost WebGL context and keeps the canvas backing store below 4,000,000 pixels. This catches accidental high-DPI framebuffer explosions.
3. **Initial network waterfall** — keeps same-origin boot resources bounded, requires all three runtime atlases (`junk-items`, `junk-portraits`, `junk-ui`, each SVG + JSON) and rejects fallback requests to standalone authored item/hero/boss/UI source folders.

These checks are regression ceilings, not product targets.

## Physical-device acceptance
Before portal submission, profile at least one older iPhone-class Safari/WebKit device and one mid-range Android Chromium device in landscape.

Record:

- first interactive frame after navigation;
- median and p95 frame time during backpack dragging;
- median and p95 frame time during a dense boss fight;
- worst observed long frame and what caused it;
- canvas backing-store dimensions and device pixel ratio;
- approximate GPU/texture memory pressure where browser tooling exposes it;
- peak JS heap where browser tooling exposes it;
- initial request count and transferred bytes with cache disabled;
- repeat-load request count/bytes with warm cache;
- behavior after background → foreground;
- behavior after a portal ad overlay;
- behavior after orientation portrait → landscape;
- whether WebGL context loss or page eviction is observed under memory pressure.

## Acceptance guidance
Do not fail a build because one physical run has a single scheduler spike. Treat repeatable regressions as blockers:

- sustained animation visibly below ~30 FPS during ordinary backpack manipulation;
- repeated >150 ms stalls during normal interaction;
- canvas backing-store growth inconsistent with the configured viewport;
- standalone authored SVG waterfalls replacing the packed atlases;
- WebGL context loss during an ordinary 20–30 minute run;
- audio/game loop remaining suspended after ad or visibility resume;
- input becoming unresponsive after orientation recovery.

## Reporting
Attach the device/browser/build SHA and scenario to each measurement. Use the shared release-acceptance evidence file so measurements are tied to the exact CI candidate rather than copied into free-form notes:

```bash
npm run release:acceptance:template
npm run release:acceptance:check -- reports/release-acceptance.json --out reports/release-acceptance.md
```

The validator converts sustained sub-30-FPS medians, repeated >150 ms p95 stalls and failed lifecycle/WebGL observations into explicit blockers while leaving tool-unavailable heap/texture estimates optional. See `docs/RELEASE_ACCEPTANCE.md` for the schema and status semantics.

P8 `real-device performance profiling` remains open until the physical-device pass is actually recorded; a green automated browser baseline or an empty evidence template cannot close it.

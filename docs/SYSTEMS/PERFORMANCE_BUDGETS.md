# Production Performance Budgets

## Purpose
Turn web-performance expectations into executable release gates rather than informal review notes. These budgets protect portal first-load cost, texture memory and cacheability without changing gameplay or save behavior.

## Generated art atlases
`npm run assets:prepare` performs two steps:
1. `scripts/build-atlases.mjs` deterministically scans reviewed SVG sources and generates runtime atlases under `public/assets/atlas/`.
2. `scripts/check-asset-budget.mjs` rejects output that exceeds the launch budgets below.

Current runtime atlases:
- `junk-items`: 60 frames, 160×160 cells, 1280×1280 page.
- `junk-portraits`: 10 frames (4 heroes + 6 bosses), 320×240 cells, 1280×720 page.

Stable frame keys remain unchanged:
- `item.<definitionId>`
- `hero.<heroId>`
- `boss.<bossId>`

The generated atlas directory is intentionally ignored by git. Source SVGs remain reviewable individually; local dev, CI and production builds reproduce runtime atlases from source.

## Measured baseline — 2026-08-25
CI measured:
- authored SVG sources: **48.9 KiB** total;
- generated SVG atlas + JSON payload: **86.2 KiB** total;
- estimated uncompressed RGBA texture memory: **9.77 MiB**;
- network texture/metadata requests for authored catalog: **70 standalone sources → 2 atlas requests**;
- largest item source SVG: **944 B**;
- largest portrait source SVG: **1.2 KiB**.

## Enforced asset ceilings
CI fails when any of these are exceeded:
- item frames must equal 60;
- portrait frames must equal 10;
- atlas dimension > 2048 px;
- a source SVG > 24 KiB;
- total authored SVG source payload > 768 KiB;
- generated atlas payload > 2 MiB;
- estimated atlas RGBA texture memory > 16 MiB;
- runtime authored-art atlas request count > 2.

These are launch guardrails, not permission to fill the entire budget. New content should stay materially below the ceiling when possible.

## JavaScript chunking
Vite/Rolldown isolates Phaser into a stable `phaser-*` vendor chunk. Game/application code remains in the app chunk. This improves cache reuse between gameplay/content releases even though Phaser is still required for first play.

Measured production baseline:
- game/app JS: **199.8 KiB raw / 57.1 KiB gzip**;
- Phaser vendor: **1342.7 KiB raw / 347.7 KiB gzip**;
- total JS gzip: **404.8 KiB**.

`npm run bundle:check` enforces:
- total JS gzip ≤ 500 KiB;
- largest single JS chunk gzip ≤ 450 KiB;
- non-Phaser game/app JS gzip ≤ 120 KiB.

Source maps are excluded because they are not runtime payload.

## Runtime loading behavior
`AssetPreloadScene` queues the two generated atlases before entering `PrototypeScene`.

Presentation lookup order is:
1. packed atlas frame;
2. standalone authored SVG texture if explicitly loaded/fallback-requested;
3. procedural item glyph where applicable.

The fallback path is resilience for development/future content. The current 60-item, 4-hero and 6-boss catalog is expected to resolve from packed atlases in normal production builds.

## What is not proven by these gates
Static budgets do not replace real-device profiling. P8 still requires:
- mobile/browser matrix;
- peak WebGL texture memory observation;
- frame-time checks during particle-heavy boss fights;
- network waterfall on representative portal hosting/CDNs;
- low-memory tab suspend/resume behavior;
- portal SDK/ad lifecycle profiling.

Those device/browser results may tighten these budgets further.

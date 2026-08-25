# Production Performance Budgets

## Purpose
Turn web-performance expectations into executable release gates rather than informal review notes. These budgets protect portal first-load cost, texture memory and cacheability without changing gameplay or save behavior.

## Generated art atlases
`npm run assets:prepare` performs three asset stages:
1. `scripts/build-atlases.mjs` deterministically scans reviewed SVG sources and generates runtime atlases under `public/assets/atlas/`.
2. `scripts/check-asset-budget.mjs` rejects runtime atlas output that exceeds launch budgets.
3. `npm run assets:store` generates and validates exact portal PNG marketing outputs from editable SVG sources.

Current runtime atlases:
- `junk-items`: 60 frames, 160×160 cells, 1280×1280 page.
- `junk-portraits`: 10 frames (4 heroes + 6 bosses), 320×240 cells, 1280×720 page.
- `junk-ui`: 10 core UI frames, 128×128 cells, 640×256 page.

Stable frame keys:
- `item.<definitionId>`
- `hero.<heroId>`
- `boss.<bossId>`
- `ui.<id>`

The generated atlas and store-output directories are intentionally ignored by git. Source SVGs remain reviewable individually; local dev, CI and production builds reproduce runtime output from source.

## Measured atlas baseline — 2026-08-25
CI measured:
- authored runtime SVG sources: **53.0 KiB** total;
- generated SVG atlas + JSON payload: **94.7 KiB** total;
- estimated uncompressed RGBA texture memory: **10.39 MiB**;
- network texture/metadata groups for authored catalog: **80 standalone sources → 3 atlases**;
- `junk-items`: 60 frames, 1280×1280;
- `junk-portraits`: 10 frames, 1280×720;
- `junk-ui`: 10 frames, 640×256;
- largest item source SVG: **944 B**;
- largest portrait source SVG: **1.2 KiB**;
- largest UI source SVG: **582 B**.

Normal production browser QA also rejects fallback traffic under `public/assets/art/items|heroes|bosses|ui/`: the three atlases are expected to satisfy the current catalog without 80 individual source requests.

## Enforced asset ceilings
CI fails when any of these are exceeded:
- item frames must equal 60;
- portrait frames must equal 10;
- core UI frames must equal 10;
- atlas dimension > 2048 px;
- a source SVG > 24 KiB;
- total authored SVG source payload > 768 KiB;
- generated atlas payload > 2 MiB;
- estimated atlas RGBA texture memory > 16 MiB;
- runtime authored-art atlas count > 3.

These are launch guardrails, not permission to fill the entire budget. New content should stay materially below the ceiling when possible.

## Store-art output budget
`npm run assets:store` rasterizes the editable portal compositions with Sharp and verifies exact PNG dimensions.

Measured outputs:
- 512×512 icon: **28.2 KiB**;
- 800×470 cover: **32.8 KiB**;
- 1560×520 hero image: **48.3 KiB**.

Current byte ceilings:
- icon ≤ 512 KiB;
- cover ≤ 768 KiB;
- hero image ≤ 1536 KiB.

These marketing files are separate from the runtime texture budget because they are portal listing/upload assets rather than in-game textures.

## JavaScript chunking
Vite/Rolldown isolates Phaser into a stable `phaser-*` vendor chunk. Game/application code remains in the app chunk. This improves cache reuse between gameplay/content releases even though Phaser is still required for first play.

Measured production baseline before later analytics/platform additions:
- game/app JS: **199.8 KiB raw / 57.1 KiB gzip**;
- Phaser vendor: **1342.7 KiB raw / 347.7 KiB gzip**;
- total JS gzip: **404.8 KiB**.

`npm run bundle:check` remains authoritative and enforces:
- total JS gzip ≤ 500 KiB;
- largest single JS chunk gzip ≤ 450 KiB;
- non-Phaser game/app JS gzip ≤ 120 KiB.

Source maps are excluded because they are not runtime payload.

## Runtime loading behavior
`AssetPreloadScene` queues the three generated atlases before entering `PrototypeScene`.

Presentation lookup order is:
1. packed atlas frame;
2. standalone authored SVG texture if explicitly loaded/fallback-requested;
3. procedural item glyph where applicable.

The fallback path is resilience for development/future content. The current 60-item, 4-hero, 6-boss and 10-core-UI catalog is expected to resolve from packed atlases in normal production builds.

## What is not proven by static gates
Static budgets and headless browser coverage do not replace physical-device profiling. P8 still requires:
- peak WebGL texture memory observation on representative phones;
- frame-time checks during particle-heavy boss fights;
- network waterfall on representative portal hosting/CDNs;
- low-memory tab suspend/resume behavior;
- real portal SDK/ad lifecycle profiling.

Those results may tighten these budgets further.

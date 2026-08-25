# Portal Store Art Pipeline

## Purpose
Keep portal promotional assets reproducible, reviewable and separate from gameplay screenshots/UI. Source compositions live as SVG; exact upload-ready PNGs are generated during the normal asset pipeline.

## Sources
Editable compositions:
- `public/assets/store-src/icon-512.svg`
- `public/assets/store-src/cover-800x470.svg`
- `public/assets/store-src/hero-1560x520.svg`

Generated outputs under ignored `public/assets/store/`:
- `icon-512.png` — 512×512
- `cover-800x470.png` — 800×470
- `hero-1560x520.png` — 1560×520

These dimensions match the current Yandex Games visual-material slots used for icon, cover and hero image. The sources remain original Junkpack compositions rather than screenshots or portal UI captures.

## Build and validation
`npm run assets:store` runs:
1. `scripts/build-store-art.mjs` — Sharp-based deterministic rasterization/compression;
2. `scripts/check-store-art.mjs` — PNG format, exact dimensions and byte ceilings.

Current measured outputs:
- icon: **28.2 KiB**;
- cover: **32.8 KiB**;
- hero image: **48.3 KiB**.

Current ceilings:
- icon ≤ 512 KiB;
- cover ≤ 768 KiB;
- hero ≤ 1536 KiB.

## Composition rules
- Store art is marketing composition, not a screenshot of the gameplay HUD.
- Use recognizable game-world assets: the Junkpack bag, original junk items, heroes and bosses.
- The square icon must read without title text at small card sizes.
- Do not place platform badges, fake ratings, fake buttons or third-party logos in the art.
- Keep focal content away from outer edges so portal cropping remains safe.
- Cover/hero title treatment can be adjusted without changing runtime asset IDs.

## Release review
Before portal upload:
- inspect all generated PNGs at 100% and thumbnail size;
- check title legibility and crop safety;
- compare against the portal's current publishing form because visual-material requirements may change;
- run `npm run assets:store` and use only generated outputs, not arbitrary editor exports.

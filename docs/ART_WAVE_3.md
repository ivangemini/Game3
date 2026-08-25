# Authored Item Art Wave 2

Status: implemented and wired through the existing lazy authored-art loader.

## Coverage milestone

- Item catalog: 60 definitions total.
- Authored item SVGs before this wave: 12.
- New authored item SVGs in this wave: 20.
- Authored item SVGs after this wave: **32 / 60 (53.3%)**.
- Hero portraits: 4 / 4 authored.
- Boss family portraits: 6 / 6 authored.

The runtime still keeps the deterministic procedural glyph fallback for every item without reviewed authored art.

## Newly authored base/shop items

1. Battery Snail
2. Disco Orb
3. Panic Noodles
4. Feral Router
5. Alarm Hamster
6. Toxic Umbrella
7. Satellite Fork
8. Canned Lightning
9. Slime Donut
10. Catellite Dish
11. Emergency Microwave
12. Laser Mop

This group completes authored coverage for the original 24 base/shop items that predate Wave 4. These are high-frequency visual exposures because they can appear directly in shops/rewards.

## Newly authored fusion results

1. Shock Toaster
2. Cyber Cat
3. Biohazard Turbine
4. Polarity Duck
5. Toxic Fish Cannon
6. Gravity Toaster
7. Turbo Router
8. Slime Sword

These were prioritized because fusion is a high-salience reward moment. Their silhouettes deliberately combine visual motifs from their ingredient families rather than looking like generic rarity upgrades.

## Runtime contract

No new gameplay/UI branch is required.

`src/game/ui/authoredArt.ts` owns the manifest. Every item asset uses:

- key: `item.<definitionId>`
- URL: `/assets/art/items/<definitionId>.svg`

`ItemGlyph` requests authored textures lazily. If the asset is unavailable or has not loaded yet, the existing procedural glyph remains visible. This keeps gameplay usable under slow/missing asset conditions and preserves future atlas compatibility.

## QA contract

`tests/authoredArt.test.ts` now protects:

- exactly 32 authored item entries for this milestone;
- at least 50% coverage of the live 60-item catalog;
- every authored item key resolves to a current item definition;
- stable key-to-URL mapping;
- all eight highlighted Wave-2 evolution rewards remain fusion-only and authored;
- all hero/boss mapping regressions from prior art waves.

## Still open

- Remaining 28 item definitions.
- Reviewed refinements after real browser/mobile visual acceptance.
- Production packing/compression into item atlas pages.
- Authored UI/loading/store art.

Atlas packing should happen after the authored catalog is substantially closer to complete so page churn and repeated repacking stay low.

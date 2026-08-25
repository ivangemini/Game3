# Authored Art Wave 4 — Complete Item Catalog

## Outcome

This wave closes authored-art coverage for the current 60-item launch catalog.

Coverage after this wave:

- base/shop items: **36 / 36**
- fusion-only items: **24 / 24**
- second-stage evolutions: **4 / 4** (included in the fusion count)
- total item definitions: **60 / 60**
- heroes: **4 / 4**
- boss families: **6 / 6**

The procedural item glyph renderer remains intentionally available as a fallback for future content, missing assets and development branches. It is no longer the expected renderer for any item in the current launch catalog.

## Wave 4 base additions

The twelve Wave 4 shop items now have authored SVGs:

- Fermented Gamepad
- Magnet Croissant
- Slime Pager
- Battery Pigeon
- Duck Drill
- Cat Battery Pack
- Poison Printer
- Laser Kettle
- Chaos Stapler
- Antenna Sausage
- Slime Magnet
- Feral Roomba

This completes authored coverage for the full 36-item shop pool.

## Remaining fusion additions

The remaining first-stage fusion results now have authored SVGs:

- Laser Banana
- Radio Duck
- Noodle Fan
- Disco Snail
- Reactor Hamster
- Acid Parasol
- Broadcast Trident
- Storm Disco
- Bio Snack Pack
- Orbital Cat
- Apocalypse Microwave
- Rail Mop

## Secret second-stage evolutions

All four second-stage results now have dedicated high-salience silhouettes:

- Singularity Toaster
- Cataclysm Satellite
- Plague Picnic
- Thunder Rail Mop

These use denser energy motifs and stronger contrast than ordinary base items so the late-game evolution reveal reads as a tier jump even at backpack scale.

## Runtime contract

The existing authored-art pipeline remains unchanged:

1. gameplay requests stable key `item.<definitionId>`;
2. `authoredArt.ts` resolves the local SVG path;
3. TextureManager loads it lazily;
4. the procedural renderer remains visible until the texture is ready;
5. the same stable key is preserved for the future packed `junk-items` atlas.

No gameplay, save or combat schema changed in this wave.

## Regression contract

`tests/authoredArt.test.ts` now requires exact catalog parity:

- exactly 60 authored item assets;
- the authored item ID set equals the live `PROTOTYPE_ITEMS` ID set;
- all 36 shop items have authored art;
- all 24 fusion results have authored art;
- all second-stage results have authored art;
- hero and boss coverage remains complete.

Adding a new item definition without adding its authored-art manifest entry now fails CI. Removing or renaming an existing authored item also fails CI.

## What is still not complete

This closes the **authored item catalog**, not the entire production-art milestone.

Still open:

- UI-specific authored decoration/illustration;
- final visual review/refinement of individual SVGs at real device scale;
- packing items/bosses/UI into production atlases;
- compression and asset-budget profiling;
- browser/mobile visual acceptance;
- store/loading/thumbnail art.

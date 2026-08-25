# Authored Art Wave 1

## Purpose
Prove the final-art replacement path inside the real game before producing the entire 60-item / 6-boss catalog.

This wave deliberately targets objects that appear early and often so visual review gets maximum coverage from a small asset batch.

## Item assets — 12
Runtime key remains identical to the future atlas frame key: `item.<definitionId>`.

- `item.laser-cat`
- `item.angry-battery`
- `item.cursed-toaster`
- `item.mutant-duck`
- `item.toxic-fan`
- `item.fish-blaster`
- `item.poison-flask`
- `item.scrap-magnet`
- `item.tactical-banana`
- `item.pocket-radio`
- `item.slime-can`
- `item.wrench-sword`

Source/runtime files live under `public/assets/art/items/*.svg` for this review wave.

## Hero portraits — 4
- `hero.scavenger` — Scrapster
- `hero.engineer` — Socket
- `hero.alchemist` — Moldwitch
- `hero.beastfriend` — Snacklord

Hero SVGs live under `public/assets/art/heroes/*.svg` and are used by the real hero-selection overlay.

## Boss portrait — TV Tyrant
- runtime key: `boss.tv-tyrant`
- source/runtime file: `public/assets/art/bosses/tv-tyrant.svg`

`CombatFeedback` resolves the portrait from the semantic `combat.start` cue source ID. Normal TV Tyrant and corrupted-loop IDs share the same stable visual key. The portrait is presentation-only and never changes combat state.

## Runtime adoption
`src/game/ui/authoredArt.ts` owns the review-wave manifest and lazy browser texture loading.

Behavior:
1. UI creates normally with the procedural fallback.
2. If a reviewed authored asset exists, its local SVG is requested once.
3. The loaded `HTMLImageElement` is registered in Phaser `TextureManager` under the stable key.
4. Item glyphs overlay the authored texture without changing layout/shape rules.
5. Missing/failed assets keep the procedural fallback instead of breaking the scene.

This allows art to be replaced incrementally and avoids making the whole launch dependent on all final sprites arriving at once.

## Atlas compatibility
Wave-1 standalone SVG keys intentionally match the atlas contract from `docs/SYSTEMS/ART_PIPELINE.md`.

A later packed export can therefore replace:

`/assets/art/items/laser-cat.svg` loaded as `item.laser-cat`

with:

texture `junk-items`, frame `item.laser-cat`

without changing item IDs, save data, shop logic, backpack geometry or fusion recipes.

## Visual acceptance target
At gameplay size each asset should:
- have one dominant silhouette/joke;
- survive downscaling to roughly 50–70 px for item UI;
- use thick dark outlines against VFX-heavy backgrounds;
- avoid text, logos and third-party character references;
- remain identifiable without rarity color;
- preserve transparent breathing room around the silhouette.

Hero/boss portraits may carry more detail but must still read as a single strong mass at card/combat size.

## Status
Wave 1 is a real runtime-authored-art slice, not the final complete launch atlas. Final acceptance still requires browser/mobile visual review, refinement of these sources where needed, authored art for the remaining items/bosses/UI, packing/compression, and performance verification.

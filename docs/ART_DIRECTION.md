# Art Direction v0.2

## North star
**Premium cartoon surreal junk.** The world should feel like a coherent toybox after an internet fever dream: funny at thumbnail size, readable during play, polished enough not to resemble low-effort AI/asset-store collage.

## Shape language
- Items: one dominant silhouette and one dominant visual joke.
- Player-side junk: compact, tactile, collectible.
- Bosses: large asymmetric silhouettes built from 2–4 memorable motifs.
- Backpack/UI: worn leather/scrap framing that visually contains the colorful chaos.

## Palette
Neutral/dark structural panels + controlled saturated item colors. Neon green/purple/electric blue/orange are effect accents, not universal base colors.

Current runtime structural palette uses dark ink, worn brown leather, painted scrap metal, warm paper/tape and rarity-specific restrained color fields. Bright neon is reserved for selection, valid placement, active synergy, fusion and boss signals.

## Materials
Leather, painted scrap metal, rubber, slime, cheap plastic, glowing electricity and worn stickers. Keep material rendering consistent across assets.

Gameplay chrome should feel physically assembled:
- backpack = leather shell, straps, rivets and stitched cells;
- shop = junk-market crate / taped price-card language;
- fusion = illegal improvised machine / purple coil language;
- item labels = worn tape/paper rather than generic floating dashboard labels.

Large structural surfaces now use sparse deterministic material overlays rather than perfectly flat fills: leather grain/scuffs, painted-scrap scratches, paper wear and CRT scanline/glitch marks are generated as lightweight Phaser graphics with stable seeds. These overlays are presentation-only, add no texture requests and must remain subtle enough that text and gameplay silhouettes stay dominant.

The backpack shell combines this material pass with explicit stitched edges, corner scuffs, strap wear and rivets. Hero-select cards use the same shared material language so the first-run choice no longer reads as a generic flat dashboard.

## UI language
Chunky readable display type for headings; high-legibility text for stats. Thick but consistent outlines, tactile cards, modest shadows, strong selected/invalid states. No generic flat web-dashboard look.

Do not rely on color alone:
- rarity has border + explicit label where space permits;
- selected items get a white outline + `SELECTED` marker;
- locked backpack cells say `POCKET LOCKED`;
- invalid placement uses both red state and rejection motion/copy.

## Item rendering contract
Gameplay uses a stable item-art frame key: `item.<definitionId>` inside the `junk-items` atlas.

`ItemGlyph` is the shared rendering boundary for backpack, shop and fusion previews. When reviewed atlas art exists it is used automatically; otherwise a deterministic primary-tag silhouette is rendered as a procedural fallback.

The fallback is intentionally coherent and readable, but it is not the final asset target. See `docs/SYSTEMS/ART_PIPELINE.md`.

## Item examples
Laser Cat, Tactical Sausage, Cursed Toaster, Mutant Duck, Toxic Fan, Fish Blaster, Angry Battery, Eye-TV, Slime Magnet, Cactus Gadget. Final names/designs must remain original.

## Animation personality
Appliances rattle and overheat, animals anticipate before attacking, slime stretches, magnets pull with visible arcs. Effects show cause → target.

Inventory-specific motion:
- pickup: short 5–6% lift;
- valid/invalid placement cells remain explicit;
- drop: short Back.Out snap;
- new synergy: source → target directional trail, then brief item pulse;
- major unlocks/fusions receive a staged reveal rather than instant state swap.

## Mobile readability
The game remains landscape-first. On narrow mobile landscape:
- critical encounter/action text must survive FIT scaling;
- tiny explanatory copy is secondary and must never carry the only explanation of a state;
- buttons use short labels and strong borders;
- gameplay hierarchy remains danger → backpack → primary action/resource → meta.

The current runtime pass increased run/fusion/shop hierarchy and logical font sizes, but final mobile legibility is accepted only after real-device/browser review.

## Thumbnail test
A store/card thumbnail should communicate: absurd character/boss + backpack chaos + strong face/emotion. Avoid tiny text and overfilled compositions.

## Prohibited direction
Direct copies of recognizable meme characters, brand logos, copyrighted mascots, another game's exact backpack/UI framing, photorealistic gore, or inconsistent render styles between assets.

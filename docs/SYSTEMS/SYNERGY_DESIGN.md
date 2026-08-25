# Synergy Design — Canonical Spatial Rules

## Goal
Turn backpack placement into buildcraft. A synergy is valuable because **where** an item is packed changes the build, not merely because two tags exist somewhere in the inventory.

The source of truth is:
- `docs/GAME_DESIGN.md`
- `src/game/domain/synergies.ts`

`src/game/domain/synergy.ts` is only a compatibility re-export and must not grow a second rule engine.

## Contact rule
A synergy activates when the source and target occupy cells that touch **orthogonally by a side**. Diagonal proximity does not count.

The current content pack has ten rules split across multiple build families:

### Core families
- `CAT → LASER`: Cat gets +1 laser shot from an adjacent laser-compatible item.
- `BATTERY → DEVICE`: adjacent Device triggers 25% faster.
- `POISON → WEAPON`: adjacent Weapon applies +2 poison.
- `DUCK → CHAOS`: Duck gains +1 chaos power from an adjacent Chaos item.
- `MAGNET → METAL`: Magnet gains +1 scrap armor for each adjacent Metal item.

### Expansion families
- `FOOD → PET`: adjacent Pet triggers 20% faster.
- `ANTENNA → DEVICE`: adjacent Device triggers 15% faster.
- `SLIME → POISON`: Slime gains +2 poison-on-hit when touching a Poison item.
- `METAL → WEAPON`: adjacent Weapon contributes +1 scrap armor.
- `CHAOS → LASER`: adjacent Laser fires +1 unstable bonus shot.

The expansion intentionally cross-links existing and new tags. A Tactical Banana next to a Laser Cat, for example, can activate both `FOOD → PET` and `CHAOS → LASER`, creating a spatial payoff without a bespoke new combat subsystem.

## Design rules
- Readable in under three seconds once the link is shown.
- Visual link must explain source → target.
- One item may participate in multiple valid links.
- Some rules may stack when each extra contact creates a meaningful spatial tradeoff.
- Prefer new tags that interact with several existing systems rather than isolated one-off tags.
- Global tag-count synergies may be added later, but they are a separate mechanic and must not silently replace spatial adjacency.
- New rules require deterministic unit coverage.

## Current content coverage
The prototype now has 16 shop/base items and 12 fusion-only result items. The new `food`, `antenna` and `slime` families are represented in both base items and fusion results so they can appear early, pivot mid-run and remain relevant in deeper loops.

## Future extensions
Directional arcs, row/column effects, discovery/Itemdex and sparse secret combinations can extend the system after the expanded contact puzzle is validated in runtime playtests.

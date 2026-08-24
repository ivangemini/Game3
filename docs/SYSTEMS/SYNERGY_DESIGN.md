# Synergy Design — Canonical Spatial Rules

## Goal
Turn backpack placement into buildcraft. A synergy is valuable because **where** an item is packed changes the build, not merely because two tags exist somewhere in the inventory.

The source of truth is:
- `docs/GAME_DESIGN.md`
- `src/game/domain/synergies.ts`

`src/game/domain/synergy.ts` is only a compatibility re-export and must not grow a second rule engine.

## Prototype contact rule
A prototype synergy activates when the source and target occupy cells that touch **orthogonally by a side**. Diagonal proximity does not count.

Implemented rules:
- `CAT → LASER`: Cat gets +1 laser shot from an adjacent laser-compatible item.
- `BATTERY → DEVICE`: adjacent Device triggers 25% faster.
- `POISON → WEAPON`: adjacent Weapon applies +2 poison.
- `DUCK → CHAOS`: Duck gains +1 chaos power from an adjacent Chaos item.
- `MAGNET → METAL`: Magnet gains +1 scrap armor for each adjacent Metal item.

## Design rules
- Readable in under three seconds once the link is shown.
- Visual link must explain source → target.
- One item may participate in multiple valid links.
- Some rules may stack when each extra contact creates a meaningful spatial tradeoff.
- Global tag-count synergies may be added later, but they are a separate mechanic and must not silently replace spatial adjacency.
- New rules require deterministic unit coverage.

## Future extensions
Directional arcs, row/column effects, fusion recipes, discovery/Itemdex and secret combinations can extend the system after the core spatial puzzle is proven fun.

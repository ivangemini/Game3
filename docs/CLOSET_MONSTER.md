# Closet Monster Boss Family — Clutter Crush

## Fantasy
Closet Monster is the fourth real boss family. It hates loose junk. Instead of disabling an item or a tag, it turns empty spacing into incoming pressure: isolated items are marked, then the backpack is crushed around them.

## Core rule
`Clutter Crush` evaluates the immutable combat-start item geometry. An item is **anchored** when at least one of its occupied cells has an orthogonally adjacent cell occupied by a different item. Otherwise it is **loose**.

This is physical contact, not synergy activation. Two items with unrelated tags still anchor each other when they share a side.

The campaign rule uses:
- 6.0s cadence;
- 1.2s telegraph;
- 3 pressure damage per loose item.

At each cycle:
1. all loose items are resolved deterministically from the combat snapshot;
2. every loose item's occupied cells are telegraphed;
3. normal combat advances to the impact timestamp;
4. damage equals `loose item count × 3`;
5. shield absorbs pressure first, then player HP;
6. if every item is anchored, the impact deals zero damage.

## Counterplay
The player can respond before the fight by:
- packing items into touching clusters instead of scattering them around the grid;
- using multi-cell items as geometric bridges;
- rotating/fusing junk to connect otherwise isolated pockets;
- accepting one deliberate loose item if its combat value justifies the recurring pressure.

The rule creates a defensive value for packing geometry without requiring every contact to be a synergy.

## Determinism
`src/game/domain/bossCombat.ts` computes contact from immutable occupied-cell coordinates. Item iteration and reported IDs use stable instance-ID ordering.

Clutter Crush shares the boss-boundary wrapper used by Time Tax: generic combat advances exactly to telegraph/impact timestamps, then the boss rule is applied. One large update and many small updates must converge to the same state.

## Corrupted Loop escalation
Corrupted Closet Monster retains 3 damage per loose item but shortens cadence through loop depth, with a 4.0s floor. Difficulty therefore increases through frequency, while the rule and counterplay stay readable.

## Audio / VFX contract
Semantic audio hooks:
- `boss.clutter.telegraph` — priority 3;
- `boss.clutter.impact` — priority 4.

Telegraph highlights every loose item's cells. Impact flashes the same footprint. Reduced-motion mode removes pulsing but preserves the full target footprint and damage readout.

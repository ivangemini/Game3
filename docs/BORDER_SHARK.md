# Border Shark Boss Family — Edge Rent

## Fantasy
Border Shark owns the outside wall of the backpack and charges rent to every piece of junk touching it. The mechanic turns the same 6×5 geometry used for synergies into a defensive packing problem during deeper runs.

## Core rule
`Edge Rent` scans the immutable combat-start build for items with at least one occupied cell on the backpack perimeter (`x = 0`, `x = 5`, `y = 0` or `y = 4`).

The boss then:
1. telegraphs every perimeter-touching item;
2. shows the affected item count;
3. after the telegraph, deals **2 damage per edge item**;
4. lets shield absorb rent before HP;
5. repeats on a deterministic cadence.

The base rule uses a 6.5s cadence with a 1.3s telegraph.

The rule counts **items, not edge cells**. A large item occupying several border cells pays once. This creates shape/rotation counterplay and avoids making a full late-run backpack automatically fatal.

## Counterplay
Viable counters:
- move the build's productive core inward before the fight;
- use larger multi-cell items as perimeter buffers so fewer separate items pay rent;
- rotate/fuse small edge clutter into more efficient shapes;
- preserve shield generation and intentionally absorb some rent when centralizing would break a stronger synergy.

A full backpack is not expected to reach zero rent. Mastery is minimizing the cost without destroying the build.

## Corrupted Loop placement
In **even Corrupted Loops**, the World 3 boss slot swaps Closet Monster for Border Shark. In odd corrupted loops, Closet Monster returns.

Together with Copycat Auditor in World 2, Loop 2 therefore introduces two boss lessons not present in the base campaign without increasing the 12-encounter cycle.

## Scaling
Corrupted IDs encode loop depth (`loop-N-border-shark`). Loop depth shortens cadence with a 4.2s floor while damage per edge item stays at 2. The rule becomes harder by demanding more frequent spatial efficiency rather than by inflating damage endlessly.

## Determinism and presentation
Perimeter classification, telegraph timing, shield resolution and HP damage live in `src/game/domain/bossCombat.ts`. Phaser only consumes presentation events.

Events:
- `boss-edge-telegraph`;
- `boss-edge-impact`.

Semantic audio cues:
- `boss.edge-rent.telegraph` — priority 3;
- `boss.edge-rent.impact` — priority 4.

# Seeded Combat / Build Balance Simulation

## Purpose
`src/game/simulation/combatBalance.ts` runs the **real deterministic combat engine** against the current boss encounter definitions using reproducible legal backpack builds.

This complements `PACING_MODEL.md`: pacing QA protects the intended session structure, while combat/build QA exposes difficulty cliffs, ineffective power growth and suspicious item correlations.

## Checkpoints
The first report covers five high-value gates:

- Campaign Boss 1;
- Campaign Boss 2;
- Campaign Boss 3;
- Campaign Boss 4;
- Loop 2 final boss.

Each checkpoint uses the real pocket unlock count, enemy/mutation resolution and a progression-appropriate synthetic build budget.

## Power bands
Every checkpoint is sampled in three bands:

- **weak** — one fewer target item, fewer perks and lower fusion exposure;
- **typical** — expected prototype progression budget;
- **strong** — one additional target item/perk and higher fusion exposure.

These are QA sampling bands, not player classes and not a hidden difficulty system.

## Build generation
Builds are deterministic from the report seed. Items are placed only through `validatePlacement`, so blocked pocket cells, item shapes, rotations and collisions are respected.

The generator samples current base items and, after fusion is available, some fusion-result items. This deliberately explores legal build space efficiently; it does **not** pretend every sampled fusion inventory was reached through an exact shop/recipe/economy history. A future economy-path simulator may add that constraint if soft-launch data shows it is necessary.

Selected perks use the real perk definitions, and the resulting inventory/perks are converted through the real synergy + perk + combat-build pipeline before combat starts.

## Report fields
For every checkpoint × power band the report records:

- win / defeat / timeout rates;
- mean item, fusion-item and perk counts;
- median and P90 combat duration;
- mean HP remaining on wins;
- per-definition appearance count;
- win rate when each definition is present;
- win-rate delta versus that band's baseline.

The item delta is a **diagnostic correlation**, not proof that an item causes the win. It is useful for finding candidates for deeper inspection, especially when one item repeatedly dominates across several checkpoints.

## Regression policy
Tests currently gate determinism, legal placement, complete report shape and stable power-band construction. They intentionally do not hard-code desired boss win rates yet: the content pool is still prototype-sized and arbitrary thresholds would fossilize unvalidated balance.

Before soft launch, measured playtests should establish target bands for boss win rate, combat duration and build power. Those measured ranges can then be promoted into automated regression thresholds.

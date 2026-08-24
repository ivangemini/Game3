# Skill: QA & Balancing

Use for tests, regression plans, balance reviews, difficulty curves and release gates.

## Determinism
Domain rules must be testable without Phaser. Seeded RNG is mandatory for reproducible runs and Daily Challenge behavior.

## Test layers
1. Unit: placement, rotations, recipes, synergies, damage/effect ordering, RNG.
2. Simulation: thousands of seeded runs/build samples where feasible to find impossible states or dominant strategies.
3. Integration: scene transitions, save/load, portal pause/ad lifecycle.
4. Browser: desktop + narrow mobile viewport, touch simulation, console/network errors.

## Balance principles
- Avoid a single dominant strategy across most seeds.
- A rare item is not automatically stronger in every build; rarity can mean specialization.
- Boss counters must not reduce to owning one specific item.
- Track expected power by stage and compare candidate builds to bands rather than tuning by intuition alone.

## Regression checklist
For inventory changes verify rotation, boundaries, overlap, blocked cells, serialization and boss mutations. For economy changes verify negative/overflow values, duplicate rewards and save migrations.

## Release blocker examples
Crashes, corrupted saves, stuck run states, unreadable mobile UI, ad rewards granted incorrectly, deterministic daily seed divergence, or a boss mechanic with no viable counterplay.
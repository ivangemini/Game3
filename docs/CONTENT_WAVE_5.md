# Content Wave 5 — Deep-Loop Anomaly Pack

## Goal

Expand replayability without enlarging the authored 60-item atlas, changing the save schema or adding another heavyweight combat subsystem. This wave deliberately spends content budget on systems that already multiply each other: perk choices, deterministic run events, stacked Corrupted Loop mutations and enemy-family rotation.

Wave 5 was implemented first as a combinatorial content expansion. A subsequent long-session expansion then extended the base campaign from four to six worlds. The two changes are compatible but intentionally separate: Wave 5 owns the new perks/events/deep-loop anomalies, while the campaign extension owns Worlds 5–6 and the longer 32–42 minute first-clear target.

## Perk expansion

Six perks extend the pool from **21 to 27**:

- **Weaponized Paperwork** — Weapon: +12% trigger speed, +1 poison.
- **Battery Afterparty** — Battery: +1 bonus laser shot.
- **Magnetic Tenure** — Magnet: +12% trigger speed, +1 scrap armor.
- **Poison Subscription** — Poison: +15% trigger speed, +1 poison.
- **Catastrophic Catnip** — Cat: +10% trigger speed, +1 scrap armor.
- **Duck Emergency Powers** — Duck: +1 chaos power, +1 scrap armor.

All six reuse the existing deterministic `ItemBonuses` vocabulary. No new combat stat, serialization field or UI treatment is required. They are intentionally hybrid rather than pure numeric upgrades so a single perk can change which multi-tag item or adjacency cluster the player values.

## Surreal event expansion

Six events extend the deterministic pool from **9 to 15**:

1. **Taxidermy Wi-Fi Cafe** — buy signal junk or sell the password.
2. **Emergency Moon Laundromat** — rent cleaning-adjacent junk or empty the coin traps.
3. **Banana Compliance Desk** — buy certified tactical food or audit the auditor.
4. **Hamster Power Exchange** — buy a battery-oriented asset or short the grid.
5. **Forbidden Printer Support** — accept an office upgrade or claim service credit.
6. **Slime Brunch Court** — settle with toxic lunch or collect court fees.

Each event still has exactly two choices and uses only the existing `coins / item / gamble` reward contract. Every item reward points to a real base/shop definition, so event rewards cannot leak fusion-only content and require no save migration.

With the later six-world campaign, there are now six event opportunities during the campaign and four during each Corrupted Loop. The larger 15-event pool sharply reduces repeated sequences without increasing event frequency inside an individual world.

## Deep-loop mutations

The six-world campaign uses the original six launch world mutations, one seeded identity per world. Loop 2 also keeps that six-modifier pool for continuity with the first-loop balance target.

From **Loop 3 onward**, the mutation pool expands to twelve with six new anomaly rules:

- **Paperwork Storm** — lower HP, much higher damage, higher payout.
- **Overtime Dimension** — HP, damage and attack speed all rise together for a strong payout.
- **Cheap Batteries** — more HP but slightly lower damage; endurance-oriented risk.
- **Static Rain** — substantially faster attacks.
- **Unsafe Coupon** — glass-cannon enemies with very high damage.
- **Warranty Void** — broad HP/damage pressure with a larger reward.

Loop 3 still stacks three mutations and Loop 4+ stacks up to four; only the candidate pool grows. Corrupted Loops remain 12 encounters even after the campaign grows to 18.

## Corrupted enemy-family rotation

From **Loop 3 onward**, the eight non-boss templates used by the four-world loop receive alternate corrupted families with their own pre-loop stat profiles:

- Static Rat Swarm → **Receipt Wasps**
- Trash Brute → **Dumpster Oracle**
- Microwave Brute → **Tax Blender**
- Scrap Collector → **Receipt Mimic**
- Mutant Conveyor → **Escalator Hydra**
- Signal Golem → **Wi-Fi Basilisk**
- Grinning Fridge → **Expired Freezer**
- Rubber Duck Choir → **Invoice Geese**

These variants deliberately reuse the existing generic enemy presentation path. They change names and stat shapes rather than requiring eight new bespoke boss mechanics or portrait assets.

## Subsequent campaign extension

After Wave 5, the base run was extended to **6 worlds / 18 encounters** so all six authored boss families appear in the first successful campaign:

- World 5: Carbon Copy Clerks → Mirror Mule → **Copycat Auditor**;
- World 6: Edge Eel Syndicate → Rent Collector Crab → **Border Shark**.

The campaign now targets **32–42 minutes p50** while first boss remains 3–5 minutes. Corrupted Loops stay **4 worlds / 12 encounters** to prevent every deep cycle from ballooning with the first-run extension.

## Compatibility rules

- Save schema remains **v8**.
- Item/recipe discovery counts remain **60 items / 24 recipes**.
- Campaign mutation selection remains on the original six-modifier pool.
- Loop 2 remains on the original six-modifier pool.
- Deep-loop anomaly variants are derived from loop depth and encounter template; no extra persisted field is needed.
- New perks persist through the existing selected-perk ID array.
- New events persist through the existing pending-event ID/choice flow.
- The campaign uses an 18-encounter progression range; loops use a separate 12-encounter range so the two structures cannot drift together accidentally.

## Regression coverage

The combined expansion tests verify:

- 27 total perks with six unique Wave 5 IDs;
- the new perk effects flow through existing tagged `ItemBonuses` logic;
- 15 unique events and valid non-negative gamble/item contracts;
- every event item reward remains inside the shop/base pool;
- campaign modifier pool remains six while deep-loop pool grows to twelve;
- Loop 2 uses only launch modifiers;
- deep-loop selection can reach the new anomaly modifiers;
- Loop 3 swaps non-boss templates to the new anomaly enemy families while Loop 2 remains unchanged;
- campaign length is 18 encounters / six bosses while loops stay 12 encounters;
- campaign telemetry completes only on the World 6 Border Shark victory;
- structural pacing stays inside the 32–42 / 55–75 / 80+ minute target envelopes across seeded QA runs.

## Result

The combined expansion increases both decision variety and meaningful first-run length without increasing atlas size:

- perks: **21 → 27**;
- run events: **9 → 15**;
- deep-loop mutation candidates: **6 → 12**;
- non-boss deep-loop enemy families: **8 new variants**;
- base campaign: **12 → 18 encounters**;
- campaign boss families encountered: **4 → 6**;
- Corrupted Loop length: unchanged at **12 encounters**;
- authored item/recipe catalog: unchanged at **60 / 24**.

Further content should continue to favor systems that multiply existing build decisions over raw HP-only padding.

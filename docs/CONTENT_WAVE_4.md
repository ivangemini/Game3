# Content Wave 4 — Launch-Range Build Space

## Goal
Cross the lower launch targets for base items and perks without adding new combat subsystems. The wave expands combinatorial depth by reusing the existing tag, synergy, hero, perk, fusion and boss-rule vocabulary.

## Base items
Wave 4 adds 12 shop items, taking the base pool from **24 to 36**:

- **Fermented Gamepad** — Device / Food / Chaos
- **Magnet Croissant** — Food / Magnet / Metal
- **Slime Pager** — Device / Slime / Antenna
- **Battery Pigeon** — Pet / Battery / Antenna
- **Duck Drill** — Pet / Duck / Weapon / Metal
- **Cat Battery Pack** — Pet / Cat / Battery / Device
- **Poison Printer** — Device / Poison / Metal
- **Laser Kettle** — Device / Laser / Food / Metal
- **Chaos Stapler** — Weapon / Metal / Chaos
- **Antenna Sausage** — Food / Antenna / Chaos
- **Slime Magnet** — Slime / Magnet / Metal / Poison
- **Feral Roomba** — Pet / Device / Metal / Chaos

The items intentionally bridge existing families. Example: **Battery Pigeon touching Laser Kettle** activates `BATTERY → DEVICE`, `ANTENNA → DEVICE` and `FOOD → PET` from one physical contact.

## Perks
Wave 4 adds five run perks, taking the pool from **16 to 21**:

- **Laser Tax Refund** — Laser items gain +1 bonus laser shot.
- **Pet Union** — Pets trigger 10% faster and contribute +1 scrap armor.
- **Slime Shell** — Slime items gain +1 poison and +1 scrap armor.
- **Food Chain Reaction** — Food items gain +1 chaos power.
- **Device Liability** — Devices apply +1 poison.

This reaches the lower launch target of 20–25 perks while keeping every effect inside the existing deterministic `ItemBonuses` vocabulary.

## Second-stage transformations
The secret evolution pool grows from one to four recipes:

1. Gravity Toaster + Shock Toaster → **Singularity Toaster**
2. Orbital Cat + Turbo Router → **Cataclysm Satellite**
3. Bio Snack Pack + Apocalypse Microwave → **Plague Picnic**
4. Rail Mop + Storm Disco → **Thunder Rail Mop**

All ingredients are fusion-only results. No new save flag or progression gate is required: the player must physically create both prerequisite branches before the second-stage recipe can become available.

## Fusion totals
The recipe pool moves from **21 to 24**, remaining inside the 20–30 launch target. The three new recipes are deliberately second-stage rather than more first-stage combinations because the base recipe pool already has sufficient breadth and long-session discovery needs more payoff.

## Balance QA rule
Second-stage results are substantially stronger and should not contaminate early synthetic QA. `combatBalance.ts` therefore exposes a progression-aware fusion pool:

- campaign checkpoints sample first-stage fusion results only;
- Corrupted Loop checkpoints may sample the full fusion pool, including second-stage evolutions.

This is still a simplified build generator, not an exact economy-path simulator, but it prevents impossible early-game power from distorting campaign boss reports.

## Scope result
After this wave P4 has reached the lower launch targets for:

- base items: **36 / 35–45**;
- fusion recipes: **24 / 20–30**;
- perks: **21 / 20–25**;
- boss families: **6 / 6**;
- heroes: **4 / 4**;
- second-stage evolution foundation: **4 recipes**.

The main remaining P4 content gap is the mutations/events pool, currently 12 combined entries against a target of roughly 15.

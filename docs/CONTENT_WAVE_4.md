# Content Wave 4 — Launch-Range Build Space

## Goal
Cross the lower launch targets for core combinatorial content without adding bespoke combat subsystems. The wave reuses the existing tag, synergy, hero, perk, fusion, event and boss-rule vocabulary.

## Base items
Wave 4 adds 12 shop items, taking the base pool from **24 to 36**:

- Fermented Gamepad — Device / Food / Chaos
- Magnet Croissant — Food / Magnet / Metal
- Slime Pager — Device / Slime / Antenna
- Battery Pigeon — Pet / Battery / Antenna
- Duck Drill — Pet / Duck / Weapon / Metal
- Cat Battery Pack — Pet / Cat / Battery / Device
- Poison Printer — Device / Poison / Metal
- Laser Kettle — Device / Laser / Food / Metal
- Chaos Stapler — Weapon / Metal / Chaos
- Antenna Sausage — Food / Antenna / Chaos
- Slime Magnet — Slime / Magnet / Metal / Poison
- Feral Roomba — Pet / Device / Metal / Chaos

The items intentionally bridge existing families. Battery Pigeon touching Laser Kettle, for example, activates `BATTERY → DEVICE`, `ANTENNA → DEVICE` and `FOOD → PET` from one physical contact.

## Perks
Wave 4 adds five run perks, taking the pool from **16 to 21**:

- Laser Tax Refund — Laser +1 bonus laser shot.
- Pet Union — Pet +10% speed and +1 scrap armor.
- Slime Shell — Slime +1 poison and +1 scrap armor.
- Food Chain Reaction — Food +1 chaos power.
- Device Liability — Device +1 poison.

This reaches the 20–25 launch target while keeping every effect inside the existing deterministic `ItemBonuses` vocabulary.

## Second-stage transformations
The secret evolution pool grows from one to four:

1. Gravity Toaster + Shock Toaster → **Singularity Toaster**
2. Orbital Cat + Turbo Router → **Cataclysm Satellite**
3. Bio Snack Pack + Apocalypse Microwave → **Plague Picnic**
4. Rail Mop + Storm Disco → **Thunder Rail Mop**

All ingredients are fusion-only. No new save flag or progression gate is required: the player must physically create both prerequisite branches before a second-stage recipe becomes available.

The full fusion pool now has **24 recipes**, inside the 20–30 launch target.

## Event extension
Wave 4 also adds three surreal events, taking the run-event pool from **6 to 9**:

- **Feral Roomba Adoption Center** — buy a Feral Roomba or decline for coins.
- **Pigeon Signal Tower** — buy signal-themed junk or gamble on selling location data.
- **Illegal Brunch Lab** — buy experimental food junk or report the lab for coins.

They use only the existing `coins / item / gamble` action vocabulary. Their item rewards point exclusively at real base/shop items, so the current event UI, deterministic resolver and save v8 persistence need no structural changes.

With six existing world mutations, the game now has **15 combined mutation/event entries**, reaching the P4 target.

## Balance QA rule
Second-stage results are substantially stronger and should not contaminate early synthetic QA. `combatBalance.ts` therefore exposes a progression-aware fusion pool:

- campaign checkpoints sample first-stage fusion results only;
- Corrupted Loop checkpoints may sample the full fusion pool, including second-stage evolutions.

This remains a simplified build generator, not an exact economy-path simulator, but it prevents impossible early-game power from distorting campaign reports.

## Regression coverage
Wave 4 tests verify:

- 36 base items / 24 fusion results / 60 total definitions;
- 24 valid recipes and 21 unique perks;
- every item owns a combat profile;
- every recipe ingredient/result references a known definition;
- one bridge contact can activate three existing spatial rules;
- all four second-stage results remain fusion-only and out of the shop;
- campaign balance pools exclude second-stage results while Loop 2 pools include them;
- nine unique events use valid choice IDs, non-negative costs and only known shop items for item rewards;
- seeded event selection and wave-4 reward resolution remain deterministic.

## P4 result
Content-efficient depth is complete at prototype scope:

- base items: **36 / 35–45**;
- fusion recipes: **24 / 20–30**;
- perks: **21 / 20–25**;
- boss families: **6 / 6**;
- heroes: **4 / 4**;
- mutation/event entries: **15 / ~15**;
- second-stage transformations: **4**.

Further raw content should now be driven by runtime playtests and retention data. The next leverage is retention/meta presentation (Itemdex/Recipe Book, milestones, Daily Run), not enlarging these pools by default.

# Junkpack: Boss Rush — Game Design v0.16

## Elevator pitch
A compact roguelite inventory autobattler where the player chooses a light rule-bending junk pilot, packs absurd junk into a constrained backpack, discovers spatial synergies and fusion recipes, then fights surreal bosses that directly interfere with build valuation and backpack rules.

## Target
Web-first: Yandex Games, CrazyGames and compatible HTML5 portals. Short onboarding, landscape presentation, desktop + touch.

## Core loop
1. Choose one of four light rule-bender heroes.
2. Receive/shop for junk.
3. Place and rotate it in the backpack.
4. Form adjacency/tag synergies.
5. Fight a short automatic battle.
6. Earn currency and resolve occasional surreal events.
7. Rearrange, buy or fuse junk to pivot the build.
8. Defeat a boss, unlock backpack space and choose a perk.
9. Continue through four compact worlds.
10. After the campaign finale, Escape/Cash Out or enter a full Corrupted Loop with the same build.
11. Repeat deeper loops while stacked mutations, alternate corrupted enemies and boss-family rotations force new adaptations.
12. Use the persistent Junk Archive to inspect discoveries and unfinished collection goals between active decisions.

## Pacing target
- Meaningful decision/payoff roughly every 20–45 seconds.
- First normal fight within ~1–2 minutes including setup.
- First boss ~3–5 minutes from run start.
- Base campaign: 4 worlds × 3 encounters = 12 encounters.
- First full campaign target: ~20–25 minutes.
- Strong session: ~30–50 minutes through Loop 2.
- Deep session: 60+ minutes through additional corrupted loops.
- Never pad with HP sponges alone; session length comes from repacking, purchases, perks, events, fusions, mutations, pocket growth and build pivots.

## Backpack
Prototype board: 6×5. Three lower pocket cells start locked; Boss 1, Boss 2 and Boss 3 each unlock one. World 4 therefore begins with the full normal backpack.

Shapes, rotations, blocked cells, placement legality, physical side-contact and fusion placement are deterministic domain rules. UI coordinates never decide gameplay legality.

## Items
Launch target: 35–45 base/shop items. Current prototype: **36 base/shop items + 24 fusion-only results = 60 total item definitions**. The launch-range target is reached.

The latest 12 bridge items deliberately combine existing tags instead of introducing isolated mechanics:
- Fermented Gamepad — Device / Food / Chaos;
- Magnet Croissant — Food / Magnet / Metal;
- Slime Pager — Device / Slime / Antenna;
- Battery Pigeon — Pet / Battery / Antenna;
- Duck Drill — Pet / Duck / Weapon / Metal;
- Cat Battery Pack — Pet / Cat / Battery / Device;
- Poison Printer — Device / Poison / Metal;
- Laser Kettle — Device / Laser / Food / Metal;
- Chaos Stapler — Weapon / Metal / Chaos;
- Antenna Sausage — Food / Antenna / Chaos;
- Slime Magnet — Slime / Magnet / Metal / Poison;
- Feral Roomba — Pet / Device / Metal / Chaos.

## Synergies
Implemented spatial synergies use **orthogonal side contact** between occupied cells. Diagonal proximity does not count.

Current 10 rules:
- `CAT → LASER`: Cat fires +1 laser shot.
- `BATTERY → DEVICE`: Device triggers 25% faster.
- `POISON → WEAPON`: Weapon applies +2 poison.
- `DUCK → CHAOS`: Duck gains +1 chaos power.
- `MAGNET → METAL`: Magnet gains +1 scrap armor per adjacent Metal item.
- `FOOD → PET`: Pet triggers 20% faster.
- `ANTENNA → DEVICE`: Device triggers 15% faster.
- `SLIME → POISON`: Slime gains +2 poison-on-hit.
- `METAL → WEAPON`: Weapon gains +1 scrap armor.
- `CHAOS → LASER`: Laser gains +1 unstable bonus shot.

One contact can activate several rules in both directions. Example: **Battery Pigeon touching Laser Kettle** activates `BATTERY → DEVICE` and `ANTENNA → DEVICE` on the kettle while `FOOD → PET` accelerates the pigeon.

Physical contact can also matter independently of tag synergy: Closet Monster uses contact for anchoring, while Border Shark values perimeter occupancy.

## Fusion and discovery
Launch target: 20–30 recipes. Current prototype: **24 recipes**, so the target is reached.

Twenty first-stage recipes form the normal fusion graph. Four second-stage transformations are late-run discovery payoffs:

1. Gravity Toaster + Shock Toaster → **Singularity Toaster**
2. Orbital Cat + Turbo Router → **Cataclysm Satellite**
3. Bio Snack Pack + Apocalypse Microwave → **Plague Picnic**
4. Rail Mop + Storm Disco → **Thunder Rail Mop**

Every second-stage ingredient is itself fusion-only. The real inventory is therefore the prerequisite; no separate save flag, level requirement or second fusion engine exists. A recipe becomes actionable only when both prerequisite branches have actually been assembled and the result can legally fit.

Fusion unlocks after Boss 1. Ingredients are consumed only when the result has a legal placement. Successful recipes/results feed persistent discovery and can also reduce Copycat Auditor exposure by converting exact duplicates into new definitions.

## Run events
A deterministic event occurs after the first combat of each world: four during campaign and four more during each Corrupted Loop. Pending events are persisted before presentation and cannot be rerolled by reload. Immediate repeats are suppressed when alternatives exist.

Current **15-event pool**:
- **Cursed Vending Machine** — mystery purchase or coin gamble;
- **Cat Courier** — expensive guaranteed Laser Cat or refuse for coins;
- **Duck Tax Office** — buy a Mutant Duck or file a risky appeal;
- **Microwave Oracle** — appliance junk or static coins;
- **Slime Pawnshop** — mystery crate or sell bad advice;
- **Shrine of the Armed Fish** — Fish Blaster purchase or steal coins;
- **Feral Roomba Adoption Center** — buy a Feral Roomba or decline for a small payout;
- **Pigeon Signal Tower** — buy signal-themed junk or gamble on selling location data;
- **Illegal Brunch Lab** — buy experimental food junk or report the lab for coins;
- **Taxidermy Wi-Fi Cafe** — buy signal-heavy junk or sell the password;
- **Emergency Moon Laundromat** — rent dangerous cleaning junk or empty the coin traps;
- **Banana Compliance Desk** — buy certified tactical food or audit the auditor;
- **Hamster Power Exchange** — buy a battery asset or short the grid;
- **Forbidden Printer Support** — accept an office upgrade or claim service credit;
- **Slime Brunch Court** — settle with toxic lunch or collect court fees.

All choices reuse the existing `coins / item / gamble` reward vocabulary. Item rewards resolve to real base/shop definitions and still fail safely when the backpack has no legal placement. No new event-engine state or save migration is required.

The larger pool reduces repeated event sequences during long multi-loop sessions without increasing the number of event interruptions per 12-encounter cycle.

## Heroes
Four prototype heroes are light rule-benders rather than classes:
- **Scrapster / Scavenger** — +25 starting coins.
- **Socket / Engineer** — Device junk triggers 12% faster.
- **Moldwitch / Alchemist** — Poison junk applies +1 poison.
- **Snacklord / Beastfriend** — Pet junk triggers 15% faster.

Build resolution order: spatial synergy → hero bonus → run perks → immutable combat snapshot. A hero must never make off-tag items unusable.

## Perks
Launch target was 20–25. The user-directed Wave 5 expansion brings the current prototype to **27 perks**.

The six newest additions are:
- **Weaponized Paperwork** — Weapon: +12% trigger speed and +1 poison;
- **Battery Afterparty** — Battery: +1 bonus laser shot;
- **Magnetic Tenure** — Magnet: +12% trigger speed and +1 scrap armor;
- **Poison Subscription** — Poison: +15% trigger speed and +1 poison;
- **Catastrophic Catnip** — Cat: +10% trigger speed and +1 scrap armor;
- **Duck Emergency Powers** — Duck: +1 chaos power and +1 scrap armor.

Perks remain inside the same deterministic `ItemBonuses` vocabulary used by synergies and heroes. The new perks are hybrid rather than isolated raw-stat upgrades, encouraging revaluation of multi-tag items and build pivots.

## Bosses
All six planned prototype boss families are implemented.

Base campaign:
1. **TV Tyrant** — Channel Jam, Slime Signal, Magnet Scramble.
2. **Deadline Snail** — Time Tax delays the fastest meaningful item.
3. **Closet Monster** — Clutter Crush punishes isolated geometry.
4. **Baby Moon** — Tag Eclipse suppresses the dominant tag family.

Corrupted-loop alternates:
5. **Copycat Auditor** — Duplicate Debt fines exact copies beyond the first.
6. **Border Shark** — Edge Rent charges pressure per perimeter item.

Even Corrupted Loops use TV Tyrant → Copycat Auditor → Border Shark → Baby Moon. Odd loops use TV Tyrant → Deadline Snail → Closet Monster → Baby Moon. This exposes all six families without increasing the 12-encounter cycle.

## World mutations
The original six seeded risk/reward rules remain the complete **campaign and Loop 2** pool:
- Greedy Signal;
- Glass Reality;
- Rage Network;
- Thick Slime;
- Bad Reception;
- Coupon Apocalypse.

From **Loop 3 onward**, six additional anomaly modifiers join the candidate pool:
- **Paperwork Storm** — lower enemy HP but sharply higher damage;
- **Overtime Dimension** — HP, damage and attack speed all rise together;
- **Cheap Batteries** — higher HP with slightly lower damage;
- **Static Rain** — substantially faster attacks;
- **Unsafe Coupon** — low-HP, extremely high-damage enemies;
- **Warranty Void** — broad HP and damage pressure.

Campaign gets one stable mutation per world. Loop 2 stacks two mutations from the original six. Loop 3 stacks three from the expanded **12-modifier** pool and Loop 4+ stacks up to four. The campaign pool stays unchanged so the base pacing/balance benchmark remains comparable.

## Corrupted enemy variants
Loop 2 retains the campaign's ordinary/elite enemy families. From **Loop 3 onward**, the eight non-boss encounter templates rotate into alternate corrupted families before normal loop scaling and mutation stacking:

- Static Rat Swarm → **Receipt Wasps**;
- Trash Brute → **Dumpster Oracle**;
- Microwave Brute → **Tax Blender**;
- Scrap Collector → **Receipt Mimic**;
- Mutant Conveyor → **Escalator Hydra**;
- Signal Golem → **Wi-Fi Basilisk**;
- Grinning Fridge → **Expired Freezer**;
- Rubber Duck Choir → **Invoice Geese**.

These are content-efficient stat-shape variants using the existing generic enemy presentation path, not eight pseudo-bosses. Boss mechanics remain reserved for the authored six boss families.

## Campaign and Corrupted Loops
Campaign = four worlds × three encounters. Bosses end each world and can grant a three-choice perk.

After encounter 12:
- **Escape / Cash Out** ends the run and locks score;
- **Go Deeper** preserves hero, backpack, items and perks for another 12-encounter cycle.

Entering a loop commits the player until the next cycle boundary. Loop depth scales enemy HP/damage/speed and payouts, stacks more mutations, adds more deterministic events and rotates boss families. From Loop 3, it also unlocks the expanded anomaly modifier pool and alternate non-boss enemy families. Persistence resumes a committed loop after quitting.

## Balance model
The seeded build/combat QA model uses the same public item/perk/profile pools and boss wrapper as runtime. Fusion sampling is progression-aware:
- campaign checkpoints may sample base + first-stage fusion results;
- Corrupted Loop checkpoints may sample the complete fusion pool, including all four second-stage transformations.

This keeps campaign reports free of impossible early late-run power while exercising secret evolutions in deep-run QA. Wave 5 deliberately leaves campaign enemy templates and the six launch campaign mutations intact; the new anomaly pressure is concentrated in deep loops.

## Persistence and discovery
Current save schema: **v8**. Active run persists run seed, hero ID, economy/shop state, backpack placements/rotations, generated sequence, progression/loop state, claim-once encounter rewards, selected perks and deterministic event state.

Legacy v1–v7 saves migrate forward. Discovery persists item IDs and successful recipe IDs. Boss cadence/targeting, expanded event selection, second-stage fusion availability, deep-loop anomaly selection and the Junk Archive require no new save fields; they derive from existing stable run seed, progression and content IDs.

## P4 milestone and expansion
The original content-efficient-depth milestone was complete at prototype scope. Wave 5 expands the systemic pools without increasing authored item count:
- 36 base items;
- 24 fusion recipes;
- 10 spatial synergy rules;
- 4 heroes;
- 6 boss families;
- **27 perks**;
- **15 run events**;
- 6 launch world mutations + 6 deep-loop anomaly modifiers = **12 mutation candidates at Loop 3+**;
- **8 alternate non-boss deep-loop enemy families**;
- 4 second-stage transformations.

The expansion is intentionally biased toward deep-run combinatorics rather than more campaign stages, atlas assets or HP-only padding. Further raw content should still be justified by playtest/retention evidence or an explicit product-direction change.

## Meta / Junk Archive
The first P5 retention layer is implemented as the **Junk Archive** with two tabs:

- **Itemdex** — 60 stable item slots. Unknown entries remain anonymous; discovered entries reveal name, rarity, source, tags, description and compact shape preview.
- **Recipe Book** — 24 stable recipe slots. Unknown recipes do not reveal ingredient or result definitions. Successful real fusions reveal ingredients/result, with second-stage transformations called out only after discovery.

Both tabs show discovered/total progress and percentage. Progress is calculated against the current catalog, so stale IDs in old saves do not inflate completion.

The archive is intentionally read-only. It grants no stats, currency or items and therefore creates an unfinished collection goal without permanent power creep. It can be opened between active decisions but not during combat or over hero/perk/event choices.

Remaining P5 layers are unlock milestones, Daily seeded run and achievements. Deepest completed Corrupted Loop and score foundations already persist.

## Visual identity
Original absurd junk-surrealism: laser cats, cursed appliances, mutant ducks, tactical food, junk monsters, slime electronics, grinning refrigerators and impossible celestial creatures. Avoid direct copies of branded or recognizable third-party meme IP.

## Monetization hooks
Rewarded: revive, post-boss reward multiplier, reroll, bonus chest/attempt. Interstitials only at natural transitions and subject to portal policy. Never interrupt active combat or backpack manipulation.

## Non-goals for launch
Real-time PvP, guilds/chat, open world, large story campaign, server-heavy economy, battle pass, dozens of heroes or hundreds of handmade stages.

## Success criterion for MVP
A player can choose a hero without class lock-in, complete materially different runs from a compact content pool, understand why a build works, discover multiple second-stage fusions, track unfinished item/recipe collection goals without spoilers, experience six mechanically distinct boss families, encounter varied short event decisions, reach the first boss quickly, keep modifying the build after 15–20 minutes and have a credible reason to risk the same successful build for a 30–60+ minute Corrupted Loop session whose later cycles introduce new mutation combinations and enemy families rather than merely larger health bars.

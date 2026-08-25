# Junkpack: Boss Rush — Game Design v0.12

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
11. Repeat deeper loops while mutations and boss-family rotations force new adaptations.

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
Launch target: 35–45 base/shop items. Current prototype: **24 base/shop items + 21 fusion-only results = 45 total item definitions**.

Current content deliberately reuses the same tag vocabulary rather than creating isolated one-off subsystems. The latest cross-family wave adds:
- Alarm Hamster — Pet / Battery / Chaos;
- Toxic Umbrella — Weapon / Poison / Metal;
- Satellite Fork — Weapon / Metal / Antenna;
- Canned Lightning — Battery / Laser / Chaos;
- Slime Donut — Food / Slime / Poison;
- Catellite Dish — Pet / Cat / Antenna / Metal;
- Emergency Microwave — Device / Food / Metal;
- Laser Mop — Weapon / Laser / Metal.

These items are designed to create multiple existing interactions each: spatial synergies, hero/perk tag bonuses, fusion decisions and boss-specific valuation changes.

## Synergies
Implemented spatial synergy family uses **orthogonal side contact** between occupied item cells. Diagonal proximity does not count.

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

A single contact may activate multiple rules in opposite directions. Example: Alarm Hamster beside Emergency Microwave activates `BATTERY → DEVICE` on the microwave and `FOOD → PET` on the hamster.

Physical contact can also matter independently of tag synergy: Closet Monster uses contact for anchoring, while Border Shark values perimeter occupancy.

## Fusion and discovery
Launch target: 20–30 recipes. Current prototype: **21 recipes**, so the lower launch target is reached.

First-stage recipes:
- Angry Battery + Cursed Toaster → **Shock Toaster**
- Laser Cat + Angry Battery → **Cyber Cat**
- Suspicious Flask + Toxic Fan → **Biohazard Turbine**
- Mutant Duck + Scrap Magnet → **Polarity Duck**
- Fish Blaster + Suspicious Flask → **Toxic Fish Cannon**
- Cursed Toaster + Scrap Magnet → **Gravity Toaster**
- Feral Router + Angry Battery → **Turbo Router**
- Slime Can + Wrench Sword → **Slime Sword**
- Tactical Banana + Laser Cat → **Laser Banana**
- Pocket Radio + Mutant Duck → **Radio Duck**
- Panic Noodles + Toxic Fan → **Noodle Fan**
- Battery Snail + Disco Orb → **Disco Snail**
- Alarm Hamster + Angry Battery → **Reactor Hamster**
- Toxic Umbrella + Slime Can → **Acid Parasol**
- Satellite Fork + Pocket Radio → **Broadcast Trident**
- Canned Lightning + Disco Orb → **Storm Disco**
- Slime Donut + Tactical Banana → **Bio Snack Pack**
- Catellite Dish + Feral Router → **Orbital Cat**
- Emergency Microwave + Panic Noodles → **Apocalypse Microwave**
- Laser Mop + Scrap Magnet → **Rail Mop**

### Second-stage evolution
The first late-run transformation is implemented:

**Gravity Toaster + Shock Toaster → Singularity Toaster**.

Both ingredients are fusion-only results. The inventory itself is therefore the prerequisite: the player must first assemble two independent first-stage fusions before this recipe can become actionable. No extra save flag or gating subsystem is required.

Second-stage recipes should stay sparse and memorable. They are discovery payoffs, not a linear upgrade tree.

Fusion unlocks after Boss 1. Ingredients are consumed only if the resulting item has a legal placement in the current backpack. Locked cells still count as blocked. Successful recipes/results are recorded in persistent discovery state.

Fusion also creates boss counterplay: Copycat Auditor fines exact duplicates, so transforming repeated base items into distinct fusion definitions can reduce Duplicate Debt while changing the build identity.

## Run events
One deterministic event occurs after the first combat of each world: four in campaign and four more per Corrupted Loop. Events are seeded from run seed + event index, persisted before presentation and cannot be rerolled by reload.

Current pool:
- Cursed Vending Machine;
- Cat Courier;
- Duck Tax Office;
- Microwave Oracle;
- Slime Pawnshop;
- Shrine of the Armed Fish.

Choices affect real currency and/or backpack items. Item rewards fail safely if there is no legal space.

## Heroes
Four prototype heroes are implemented as light rule-benders rather than classes:
- **Scrapster / Scavenger** — +25 starting coins.
- **Socket / Engineer** — Device junk triggers 12% faster.
- **Moldwitch / Alchemist** — Poison junk applies +1 poison.
- **Snacklord / Beastfriend** — Pet junk triggers 15% faster.

Build resolution order: spatial synergy → hero bonus → run perks → immutable combat snapshot. A hero must never make off-tag items unusable.

## Perks
Launch target: 20–25. Current prototype: **16 perks**.

Existing families cover devices, pets, weapons, chaos, metal, antenna, slime, food and global speed. The latest wave adds:
- Battery Rage — Battery trigger speed;
- Catnip Optics — Cat bonus laser shot;
- Poison Pension — Poison-tag poison output;
- Duck Tape Doctrine — Duck-tag scrap armor;
- Antenna Afterlife — Antenna speed + armor hybrid;
- Magnet School — Magnet-tag scrap armor.

Perks should reinforce build identity more often than generic percentages, while still allowing pivots.

## Bosses
Launch target: 6 major boss families plus modifiers. **All six prototype families are implemented.**

Base campaign:
1. **TV Tyrant** — Channel Jam, Slime Signal, Magnet Scramble; attacks spatial reliability.
2. **Deadline Snail** — Time Tax; delays the next trigger of the fastest meaningful item.
3. **Closet Monster** — Clutter Crush; damages geometrically loose items that touch nothing.
4. **Baby Moon** — Tag Eclipse; suppresses the most represented build tag temporarily.

Corrupted-loop alternates:
5. **Copycat Auditor** — Duplicate Debt; fines exact-definition copies beyond the first.
6. **Border Shark** — Edge Rent; charges pressure per item touching the backpack perimeter.

Even Corrupted Loops use TV Tyrant → Copycat Auditor → Border Shark → Baby Moon. Odd loops use TV Tyrant → Deadline Snail → Closet Monster → Baby Moon. This exposes all six families without increasing the 12-encounter cycle.

Every boss must have readable telegraphing and multiple viable counters. Boss damage/disruption must never require one specific item to survive.

## World mutations
Current six seeded risk/reward rules:
- Greedy Signal;
- Glass Reality;
- Rage Network;
- Thick Slime;
- Bad Reception;
- Coupon Apocalypse.

Campaign gets one stable mutation per world. Corrupted loops stack 2 mutations in Loop 2, 3 in Loop 3 and up to 4 deeper.

## Campaign and Corrupted Loops
Campaign = four worlds × three encounters. Bosses end each world and can grant a three-choice perk.

After encounter 12:
- **Escape / Cash Out** ends the run and locks score;
- **Go Deeper** preserves hero, backpack, items and perks for another 12-encounter cycle.

Entering a loop commits the player until the next cycle boundary. Loop depth scales enemy HP/damage/speed and payouts, stacks more mutations, adds four more deterministic events and rotates boss families. Quitting the app does not destroy the run; persistence resumes the committed loop.

## Persistence and discovery
Current save schema: **v8**. Active run persists run seed, hero ID, economy/shop state, backpack placements/rotations, generated sequence, progression/loop state, claim-once encounter rewards, selected perks and deterministic event state.

Legacy v1–v7 saves migrate forward. Discovery persists item IDs and successful recipe IDs. Boss cadence/targeting and second-stage fusion availability require no new save fields; they derive from current inventory, immutable combat snapshot and stable enemy/loop IDs.

## Meta
Planned/partial meta: Itemdex, Recipe Book, achievements, Daily seeded run, deepest completed Corrupted Loop and score. Permanent power creep should remain limited.

## Visual identity
Original absurd junk-surrealism: laser cats, cursed appliances, mutant ducks, tactical food, junk monsters, slime electronics, grinning refrigerators and impossible celestial creatures. Avoid direct copies of branded or recognizable third-party meme IP.

## Monetization hooks
Rewarded: revive, post-boss reward multiplier, reroll, bonus chest/attempt. Interstitials only at natural transitions and subject to portal policy. Never interrupt active combat or backpack manipulation.

For long sessions, preferred ad moments are boss clears, world transitions and voluntary reward moments rather than arbitrary timers.

## Non-goals for launch
Real-time PvP, guilds/chat, open world, large story campaign, server-heavy economy, battle pass, dozens of heroes or hundreds of handmade stages.

## Success criterion for MVP
A player can choose a hero without class lock-in, complete materially different runs from a compact content pool, understand why a build works, discover first- and second-stage fusions, experience six mechanically distinct boss families, reach the first boss quickly, keep modifying the build after 15–20 minutes and have a credible reason to risk the same successful build for a 30–60+ minute Corrupted Loop session.

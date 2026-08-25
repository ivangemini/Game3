# Junkpack: Boss Rush — Game Design v0.11

## Elevator pitch
A compact roguelite inventory autobattler where the player picks a light rule-bending junk pilot, packs absurd junk into a constrained backpack, discovers synergies and fusion recipes, then fights surreal bosses that directly interfere with the backpack's rules.

## Target
Web-first: Yandex Games, CrazyGames and compatible HTML5 portals. Short onboarding, landscape presentation, desktop + touch.

## Core loop
1. Choose one of four light rule-bender heroes for the run.
2. Receive/shop for junk items.
3. Place and rotate them in a constrained backpack with locked pocket cells.
4. Form adjacency and tag synergies.
5. Fight a short automatic battle with readable item triggers.
6. Earn currency and hit occasional surreal choice-events.
7. Rearrange, buy or fuse junk to pivot the build.
8. Defeat a boss, open more backpack space and choose one of three perks.
9. Continue through four compact worlds.
10. After the campaign finale, Escape/Cash Out or take the same build into a full Corrupted Loop.
11. Repeat deeper loops while mutations and boss-family rotations force new build adaptations.

## Pacing target
- Meaningful decision or payoff roughly every 20–45 seconds.
- First normal fight: within ~1–2 minutes including setup.
- First boss: ~3–5 minutes from run start.
- Campaign: 4 worlds × 3 encounters = 12 encounters total.
- Target first full campaign: ~20–25 minutes.
- Target strong session: ~30–50 minutes if the player enters Loop 2.
- Deep session: 60+ minutes through additional corrupted loops.
- Do not extend session length with HP sponges alone. Length must come from repacking, purchases, perks, events, fusions, mutations, pocket growth and repeated build pivots.

The first boss is a checkpoint, not the end of the run. A player should understand the fantasy quickly, then spend the rest of the session making the backpack increasingly powerful and increasingly strange.

## Core differentiator
Bosses attack inventory rules and build structure, not only player HP. Current families interfere with cells/rows/items, delay a hyper-fast carry, punish isolated junk, eclipse a dominant tag, fine exact duplicates and charge rent for perimeter-heavy packing.

## Launch systems
### Backpack
The prototype board is 6×5, but three lower pocket cells start locked. Boss 1, Boss 2 and Boss 3 each unlock one cell. World 4 therefore begins with the full normal backpack.

Newly opened space changes placement possibilities, synergy geometry and purchase value, forcing the player to reconsider an already-functioning build during the same long run. Later loops may introduce cursed or conditional pocket variants, but launch should avoid permanently growing the grid beyond a readable mobile-friendly footprint.

### Items
Launch target: 35–45 base items across weapons, devices, materials/potions, defensive junk and pets/creatures. Each item has stable ID, shape, tags, rarity and effects.

The prototype currently has **16 base/shop items plus 12 fusion-only results**. The second content wave adds tactical food, antenna electronics and slime junk so early shop choices can cross-link with existing pet/device/poison/weapon/laser families. Fusion results intentionally do not enter the normal shop pool; their value comes from discovery, sacrificing ingredients and changing the build's spatial geometry.

### Synergies
The implemented synergy family uses **orthogonal side contact** between occupied item cells. Diagonal proximity does not count. This makes placement itself part of build power rather than treating the backpack as passive storage.

Current rules:
- `CAT → LASER`: adjacent Laser grants the Cat +1 laser shot.
- `BATTERY → DEVICE`: adjacent Device triggers 25% faster.
- `POISON → WEAPON`: adjacent Weapon applies +2 poison.
- `DUCK → CHAOS`: touching Chaos grants the Duck +1 chaos power.
- `MAGNET → METAL`: each adjacent Metal item grants the Magnet +1 scrap armor.
- `FOOD → PET`: adjacent Pet triggers 20% faster.
- `ANTENNA → DEVICE`: adjacent Device triggers 15% faster.
- `SLIME → POISON`: Slime gains +2 poison-on-hit from touching Poison.
- `METAL → WEAPON`: adjacent Weapon contributes +1 scrap armor.
- `CHAOS → LASER`: adjacent Laser fires +1 unstable bonus shot.

Rules resolve deterministically from stable item instance IDs. Multiple valid contacts may stack where the rule is designed to stack. The families deliberately reuse the existing combat bonus vocabulary, so content depth grows without creating a bespoke combat subsystem for every item.

A single contact may activate multiple readable rules when tags justify it. Tactical Banana next to Laser Cat, for example, can activate both `FOOD → PET` and `CHAOS → LASER`.

Physical contact is also allowed to matter independently of a tag synergy. Closet Monster uses orthogonal contact as an anchoring rule: unrelated items can protect each other from Clutter Crush simply by being packed together. Border Shark independently values perimeter occupancy, so shape and rotation remain relevant even when two layouts produce identical synergy links.

Future synergy families may add directional arcs or row/column rules, but they must stay visually readable and testable without Phaser.

### Fusion/discovery
Launch target remains 20–30 recipes. Fusion is a build pivot, not a linear `Item I + Item I = Item II` ladder.

Implemented recipes:
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

Fusion unlocks after Boss 1. Both ingredients are consumed only when the resulting item has a legal placement in the current backpack. Locked pocket cells still count as blocked, so fusion cannot bypass spatial progression. If the result cannot fit, the original items remain untouched.

The result has its own definition, tags and combat profile, so a fusion may destroy one synergy, create another, change backpack geometry or push the player into a different build family. Successful recipes/results are recorded in persistent discovery state for the future Recipe Book and Itemdex.

Fusion now also creates boss counterplay. Copycat Auditor fines exact repeated definitions, so sacrificing repeated ingredients to create a different fusion definition can reduce Duplicate Debt while changing the build's combat identity.

Later-run transformations may add second-stage or secret recipes tied to perks/loop conditions, but they should remain sparse and memorable rather than forming a large linear upgrade tree.

### Run events
A long session needs short decisions that are not all combat/shop screens. The prototype schedules one deterministic event after the first combat of each world: four in the base campaign and four more in every Corrupted Loop.

Events are seeded from `runSeed + eventIndex`, persisted before presentation and cannot be rerolled by reloading. A pending event blocks the next encounter until one choice resolves. Choices spend or award real run currency and may add real items to the backpack; an item-reward choice cannot complete if there is no legal backpack space.

Implemented prototype event pool:
- **Cursed Vending Machine** — mystery purchase or coin gamble.
- **Cat Courier** — expensive guaranteed Laser Cat or cheaper random parcel.
- **Duck Tax Office** — buy into duck bureaucracy or file a risky appeal.
- **Microwave Oracle** — purchase appliance junk or harvest free static coins.
- **Slime Pawnshop** — mystery crate or sell fabricated advice.
- **Shrine of the Armed Fish** — buy a Fish Blaster or take a free Suspicious Flask.

Immediate repeats are suppressed when alternatives exist. Events should resolve in seconds, create a build/economy decision, then return the player to packing rather than becoming a dialogue-heavy subsystem.

### Heroes
Four prototype heroes are implemented as **light rule-benders rather than hard classes**. Hero choice happens once per run and is persisted.

- **Scrapster — The Scavenger:** starts with +25 coins. Pure flexibility/economy; no combat tag requirement.
- **Socket — The Engineer:** Device-tag junk triggers 12% faster.
- **Moldwitch — The Alchemist:** Poison-tag junk applies +1 poison when it triggers.
- **Snacklord — The Beastfriend:** Pet-tag junk triggers 15% faster.

The combat build resolves spatial synergies first, hero bonus second and run perks third. Because all bonuses use the same deterministic stat vocabulary, heroes multiply existing item decisions instead of creating four separate content silos.

A hero must never make non-matching items unusable. The player should still be able to pivot from Engineer into pets, from Beastfriend into poison, or from Scavenger into any tag family when the shop/recipes demand it.

### Bosses
Launch target: 6 major boss families plus modifiers. **All six prototype families are implemented.** Each changes item valuation, tempo, geometry or composition and has readable telegraphs plus multiple viable counters.

Base campaign families:
- **TV Tyrant** attacks spatial reliability with Channel Jam, Slime Signal and Magnet Scramble.
- **Deadline Snail** attacks tempo concentration with **Time Tax**. It targets the fastest meaningful combat item, telegraphs its footprint, then shifts only that item's next queued trigger by +1.2s.
- **Closet Monster** attacks loose geometry with **Clutter Crush**. Items that touch no other item orthogonally are telegraphed; impact deals 3 pressure per loose item, with shield absorbing pressure first. Any side contact anchors the item even when no tag synergy exists.
- **Baby Moon** attacks build concentration with **Tag Eclipse**. It telegraphs the most represented tag family and temporarily suppresses triggers from matching items while other families remain live.

Corrupted-loop alternate families:
- **Copycat Auditor** attacks exact-definition repetition with **Duplicate Debt**. It groups the immutable build by definition ID, targets the most repeated exact item and deals 4 shield-aware pressure for each copy beyond the first. No exact duplicates means a readable zero-damage audit. Counterplay includes varying exact item definitions, fusing duplicates into a new definition, preserving shield or deliberately accepting the cost of a high-output duplicate engine.
- **Border Shark** attacks perimeter-heavy packing with **Edge Rent**. Every item touching the 6×5 outer border is telegraphed; impact deals 2 shield-aware pressure per affected item. The mechanic counts items rather than occupied border cells, so large shapes can act as efficient perimeter buffers. Counterplay includes moving the productive core inward, rotating/fusing small edge clutter, using larger edge pieces or intentionally paying part of the rent with shield.

Deadline Snail's counterplay is to distribute trigger-speed investment across multiple productive items, preserve a slower secondary engine or deliberately accept the tax when one carry is still efficient enough. Corrupted variants shorten tax cadence while keeping the +1.2s delay stable.

Closet Monster's counterplay is spatial: pack items into connected clusters, use multi-cell junk as bridges and rotate/fuse around isolated pockets. A player may still leave a high-value item loose, but that becomes an explicit recurring HP/shield cost. Corrupted variants increase cadence without raising the per-item damage rule.

Tag Eclipse uses stable tie-breaking and shows the affected item count before impact. Its counterplay is to diversify damage/poison/shield families or pivot tags through shop/fusion choices before World 4. Corrupted Baby Moon shortens Eclipse cadence rather than inheriting unrelated boss attacks, preserving boss-family identity.

The base campaign therefore teaches four adaptation lessons in order: survive spatial disruption, avoid a single hyper-fast carry, pack into defensible geometry, then avoid over-concentrating the entire build in one tag family.

Corrupted Loops add two more mastery lessons without increasing encounter count. In **even loops**, World 2 swaps Deadline Snail for Copycat Auditor and World 3 swaps Closet Monster for Border Shark. In **odd loops**, Deadline Snail and Closet Monster return. World 1 stays TV Tyrant and World 4 stays Baby Moon. This alternating rotation exposes all six families across long sessions while preserving a compact 12-encounter cycle.

### Perks
Launch target: 20–25 run perks. The prototype currently has **10** perks covering devices, pets, weapons, chaos, metal, antenna, slime, food and global trigger speed. Perks should modify build identity more often than provide generic flat percentages, but lightweight tag bonuses remain useful while the content pool is still being validated.

### World mutations
Campaign mutations are seeded per run and stay stable across a world so the player can adapt instead of facing arbitrary per-fight noise. They alter real enemy/reward values and therefore create risk/reward decisions cheaply.

Implemented pool:
- Greedy Signal — enemies gain HP, payout rises strongly.
- Glass Reality — enemies lose HP but hit much harder.
- Rage Network — enemies attack faster for higher rewards.
- Thick Slime — enemies gain substantial HP for a reward premium.
- Bad Reception — enemy damage rises for a smaller premium.
- Coupon Apocalypse — small enemy HP increase for a large payout increase.

The four campaign worlds receive deterministic non-repeating mutations from the seed. Corrupted loops stack multiple different mutations simultaneously: 2 in Loop 2, 3 in Loop 3 and up to 4 in deeper loops.

### Campaign and Corrupted Loops
Campaign is four worlds with three encounters each. Bosses sit at the end of each world and can grant a three-choice perk. Between encounters the player can repack, spend rewards, resolve scheduled events and fuse compatible junk.

After encounter 12:
- **Escape / Cash Out** — end the run and lock the score; or
- **Go Deeper** — keep the exact hero, backpack, items and perks for another four-world cycle.

Going deeper is a commitment. The next safe cash-out appears only after all 12 encounters of that corrupted loop are cleared. Quitting the app does not destroy the run; persistence allows the committed loop to resume later.

Each deeper loop increases enemy pressure and payouts, stacks more world mutations, inserts four additional deterministic events and preserves fusion/discovery/perk opportunities. Boss slots also rotate deterministically: even loops introduce Copycat Auditor and Border Shark in Worlds 2–3, while odd loops restore Deadline Snail and Closet Monster. This gives long sessions new counter-build pressure without adding bespoke stages or more than 12 encounters per cycle.

### Persistence and discovery
Active-run persistence is schema-versioned. **Save v8** stores backpack/shop/perks/progression/events plus the selected hero ID. Legacy v1–v7 saves migrate forward; a migrated active v7 run receives `heroId: null`, then asks for one hero choice without resetting the existing backpack, coins, events or progression.

Persistent discovery records item IDs and successful fusion recipe IDs. The UI for Itemdex/Recipe Book is future work, but discovery state is already generated by real gameplay rather than being retrofitted later.

Boss-family cadence and targeting require no new save fields. They derive from the immutable combat-start build and stable enemy/loop IDs, so save schema remains v8.

### Meta
Itemdex/Recipe Book, achievements, Daily seeded run, deepest completed Corrupted Loop and score. Keep permanent power creep limited.

## Visual identity
Original absurd junk-surrealism: laser cats, cursed appliances, mutant ducks, tactical food, junk monsters, slime electronics, grinning refrigerators and impossible celestial creatures. Avoid direct copies of existing meme characters or branded objects.

## Monetization hooks
Rewarded: revive, post-boss reward multiplier, reroll, bonus chest/attempt. Interstitial: only natural transitions subject to platform policy. No forced interruption during active combat or backpack manipulation.

For long sessions, ad pacing must respect the run rhythm. Boss clear / world transition / voluntary reward moments are preferred over arbitrary timers. Run events themselves should not silently become ad prompts.

## Non-goals for launch
Real-time PvP, guilds/chat, open world, large story campaign, server-heavy economy, battle pass, dozens of heroes, hundreds of handmade stages.

## Success criterion for MVP
A player can choose a hero without being class-locked, complete materially different runs using the same compact content pool, understand why a build works, experience six mechanically distinct boss families changing backpack valuation or rules, reach the first boss quickly, keep modifying the build after 15–20 minutes through events/fusions/pocket growth, and have a credible reason to risk the same successful build for a 30–60+ minute session through Corrupted Loops.

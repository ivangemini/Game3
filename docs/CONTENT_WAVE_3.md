# Content Wave 3 — Cross-Family Junk

## Goal
Expand the build space without adding another combat subsystem. Every new item reuses the existing deterministic stat vocabulary and intersects at least two existing tag, synergy, perk, fusion or boss-valuation systems.

## Pool size after this wave
- 24 base/shop items.
- 21 fusion-only results.
- 21 fusion recipes.
- 16 run perks.
- 45 total item definitions with combat profiles.

## New base items
- **Alarm Hamster** — Pet / Battery / Chaos. Creates two-way contacts with Food and Device junk.
- **Toxic Umbrella** — Weapon / Poison / Metal. Can self-identify as a poison weapon while still valuing adjacent Poison/Metal rules.
- **Satellite Fork** — Weapon / Metal / Antenna. Connects weapon defense and antenna/device layouts.
- **Canned Lightning** — Battery / Laser / Chaos. Makes Battery and Chaos placement compete for the same compact shape.
- **Slime Donut** — Food / Slime / Poison. Cross-links Food/Pet and Slime/Poison families.
- **Catellite Dish** — Pet / Cat / Antenna / Metal. A large pet that creates laser, food, antenna and metal decisions.
- **Emergency Microwave** — Device / Food / Metal. Can be accelerated by Battery/Antenna while accelerating adjacent Pets through Food.
- **Laser Mop** — Weapon / Laser / Metal. A long shape that trades edge exposure against strong weapon/laser scaling.

## New first-stage fusions
- Alarm Hamster + Angry Battery → **Reactor Hamster**
- Toxic Umbrella + Slime Can → **Acid Parasol**
- Satellite Fork + Pocket Radio → **Broadcast Trident**
- Canned Lightning + Disco Orb → **Storm Disco**
- Slime Donut + Tactical Banana → **Bio Snack Pack**
- Catellite Dish + Feral Router → **Orbital Cat**
- Emergency Microwave + Panic Noodles → **Apocalypse Microwave**
- Laser Mop + Scrap Magnet → **Rail Mop**

## First second-stage evolution
**Gravity Toaster + Shock Toaster → Singularity Toaster**.

Both ingredients are fusion-only results. The recipe therefore cannot appear as an actionable fusion until the player has already assembled two independent first-stage recipes. No new save field or gating flag is needed: the inventory state itself is the prerequisite.

This establishes the late-run transformation pattern while keeping it rare. Second-stage recipes should remain memorable rather than becoming a linear upgrade ladder.

## New perks
- Battery Rage — Battery trigger speed.
- Catnip Optics — Cat bonus laser shot.
- Poison Pension — Poison-tag poison output.
- Duck Tape Doctrine — Duck-tag scrap armor.
- Antenna Afterlife — Antenna speed + armor hybrid.
- Magnet School — Magnet-tag scrap armor.

## Boss interactions
The wave deliberately changes boss valuation:
- Copycat Auditor makes repeated cheap base items riskier and increases the value of fusing duplicates into distinct definitions.
- Border Shark makes the larger Catellite Dish, Laser Mop and fusion shapes meaningful perimeter buffers/tradeoffs.
- Baby Moon can punish the multi-tag fusion results when a build over-concentrates one family.
- Deadline Snail pressures very fast fusion carries such as Orbital Cat, Rail Mop and Singularity Toaster.
- Closet Monster rewards using the larger shapes as bridges that anchor otherwise loose junk.

## QA contract
Every item definition must have a combat profile. Every recipe result and ingredient must resolve to a known item definition. IDs across items, perks and recipes must remain unique. The second-stage recipe must require two fusion-only definitions.

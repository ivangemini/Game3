# Junkpack: Boss Rush — Game Design v0.2

## Elevator pitch
A compact roguelite inventory autobattler where the player packs absurd junk into a constrained backpack, discovers synergies and fusion recipes, then fights surreal bosses that directly interfere with the backpack's rules.

## Target
Web-first: Yandex Games, CrazyGames and compatible HTML5 portals. Short onboarding, landscape presentation, desktop + touch.

## Core loop
1. Receive/shop for junk items.
2. Place and rotate them in a 6×5-style backpack with some locked/blocked cells.
3. Form adjacency, direction and tag synergies.
4. Fight a 20–35 second automatic battle with readable item triggers.
5. Earn currency/item choice/event.
6. Rearrange or pivot the build.
7. Defeat a boss and choose one of three perks/world modifiers.
8. Continue to the next world or Endless.

Target full run: ~10–15 minutes. Target first boss: ~3–5 minutes.

## Core differentiator
Bosses attack the inventory rules, not only player HP. Examples: magnetizing metal items, sliming cells, scrambling a row after a telegraph, freezing slots, duplicating junk, or temporarily corrupting a tag.

## Launch systems
### Backpack
Grid-based item shapes, rotation, blocked/locked cells and deterministic placement.

### Items
Launch target: 35–45 base items across weapons, devices, materials/potions, defensive junk and pets/creatures. Each item has stable ID, shape, tags, rarity and effects.

### Synergies
The first implemented synergy family uses **orthogonal side contact** between occupied item cells. Diagonal proximity does not count. This makes placement itself part of build power rather than treating the backpack as passive storage.

Prototype rules:
- `CAT → LASER`: an adjacent laser-compatible item grants the Cat +1 laser shot.
- `BATTERY → DEVICE`: an adjacent Battery makes a Device trigger 25% faster.
- `POISON → WEAPON`: adjacent Poison makes a Weapon apply +2 poison.
- `DUCK → CHAOS`: touching a Chaos item grants the Duck +1 chaos power.
- `MAGNET → METAL`: each adjacent Metal item grants the Magnet +1 scrap armor.

Rules resolve deterministically from stable item instance IDs. Multiple valid contacts may stack where the rule is designed to stack. The combat system consumes these derived bonuses later; Phaser rendering is not the source of truth.

Future synergy families may add directional arcs or row/column rules, but they must stay visually readable and testable without Phaser.

### Fusion/discovery
20–30 launch recipes. Some are obvious; some appear as `???` in a Recipe Book until discovered. Fusion should create meaningful build branches rather than linear +1 tiers only.

### Heroes
Launch target: 4 heroes, each a light rule-bender rather than a hard class lock: Scavenger, Engineer, Alchemist/Witch, Beastmaster-like archetype. Names/art are provisional.

### Bosses
Launch target: 6 major boss families plus modifiers. Each boss changes backpack valuation/positioning and has clear telegraphs and counterplay.

### Perks
20–25 run perks. Examples: Big Pockets, Overclock, Laser Pet, Pyromaniac/chaos-style effects. Perks should modify rules and build identity more often than flat percentages.

### World mutations
~15 cheap run modifiers that reshape choices: Tiny Backpack, Inflation, Glass Cannon, Greedy Shop, Poison-Resistant World, Chaos Stock.

### Meta
Itemdex/Recipe Book, achievements, Daily seeded run, Endless score. Keep permanent power creep limited.

## Visual identity
Original absurd junk-surrealism: laser cats, cursed appliances, mutant ducks, tactical food, junk monsters, slime electronics. Avoid direct copies of existing meme characters or branded objects.

## Monetization hooks
Rewarded: revive, post-boss reward multiplier, reroll, bonus chest/attempt. Interstitial: only natural transitions subject to platform policy. No forced interruption during active combat or backpack manipulation.

## Non-goals for launch
Real-time PvP, guilds/chat, open world, large story campaign, server-heavy economy, battle pass, dozens of heroes, hundreds of handmade stages.

## Success criterion for MVP
A player can complete multiple materially different runs using the same small item pool, understands why a build works, experiences at least one boss changing backpack rules, and immediately has a reason to start another run.

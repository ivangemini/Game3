# Hero Mastery & Boss Grudges

## Purpose

Retention R2 adds long-term unfinished goals without adding permanent combat-stat inflation. The system answers two different return questions:

- **Hero Mastery:** “What have I still not mastered with this Junk Pilot?”
- **Boss Grudges:** “Which boss still owes me a revenge win?”

Both systems are local/save-v9 meta progression. They do not require an account or backend.

## Hero Mastery

Each of the four launch heroes has an independent 20-level mastery track:

- Scavenger
- Engineer
- Alchemist
- Beastfriend

Mastery XP is awarded for meaningful gameplay actions rather than elapsed play time:

| Action | Base mastery XP |
| --- | ---: |
| Normal encounter victory | 12 |
| Elite victory | 22 |
| Boss victory | 55 plus bounded loop-depth scaling |
| Fusion | 12 |
| Event choice | 8 |
| Claimed Daily Contract | 18 |
| Six-world campaign clear | 120 |
| Corrupted Loop clear | 145 plus bounded loop-depth scaling |
| Cash out at a legal cycle boundary | 25 plus bounded loop-depth scaling |

The XP curve grows per level and caps at mastery level 20. There is no passive-time XP.

### Rewards

Each hero has seven authored reward milestones at levels 2, 4, 7, 10, 13, 16 and 20. The launch reward vocabulary is deliberately cosmetic/expression-oriented:

- titles;
- portrait frames;
- trail variants;
- VFX variants.

The mastery track does **not** award permanent damage, HP, attack speed or other combat multipliers. The point is to make a hero worth learning, not to invalidate backpack skill or boss balance.

### Runtime presentation

`TROPHIES` now opens the combined **Mastery & Grudges** surface first. Hero cards show:

- authored hero portrait;
- current level / 20;
- current XP and next-level threshold;
- progress bar;
- next cosmetic reward;
- unlocked cosmetic count.

The pre-existing Archive Trophy Shelf remains reachable from the `ARCHIVE TROPHIES` action inside the overlay, so this does not add another permanent top-HUD button.

Level-up feedback is intentionally rare. Small XP gains do not create modal/toast spam; a mastery reveal appears only when a level or reward milestone is crossed. Reduced Motion removes the entrance/fade movement while preserving the information.

## Boss Grudges

History is tracked per authored boss family, including corrupted-loop IDs mapped back to the same family:

1. TV Tyrant
2. Deadline Snail
3. Closet Monster
4. Baby Moon
5. Copycat Auditor
6. Border Shark

Each history entry stores:

- wins;
- losses;
- fastest valid victory time;
- current win streak;
- best win streak;
- whether revenge is pending.

### Revenge lifecycle

A defeat against a tracked boss family marks that family as `REVENGE ACTIVE`. Repeated defeats do not create duplicate grudge records; they increment losses and keep the same pending revenge state.

The next victory against that same family resolves revenge. Revenge is cosmetic/meta motivation only: it does not make the next attempt easier and does not grant permanent combat power.

The runtime shows restrained `GRUDGE MARKED` and `REVENGE COMPLETE` feedback. The Boss Grudges tab uses authored boss portraits and a non-color-only `REVENGE ACTIVE` label. With Reduced Motion enabled the label remains static instead of pulsing.

## Boss mastery tiers

The first R2 pass derives three simple mastery tiers from existing history instead of introducing another persistence schema:

- **Tier 1:** first victory;
- **Tier 2:** at least three victories;
- **Tier 3:** at least three victories and a best win streak of three.

This is intentionally compact. Arrangement-specific boss challenge stars can build on the same surface later without invalidating save v9.

## Persistence and idempotence

R1 already reserved `heroMasteryXp` and `bossHistory` in save v9, so R2 does not require another schema bump.

Important runtime boundaries:

- encounter victory XP is awarded only after the current encounter ID matches the active progression state;
- boss history updates only for the active tracked boss family;
- defeat persists the grudge before returning to the retry state;
- campaign/loop clear XP is awarded on the transition into `deep-choice`, not by repeatedly viewing the choice screen;
- cash-out mastery is guarded by `progress.mode === 'deep-choice'`;
- Daily mastery XP is awarded on successful contract claim, which is already idempotent in the Daily retention domain.

Persistence tests cover non-default mastery/grudge round trips and reject malformed negative XP / invalid boss timing values.

## Authored art and performance

R2 adds two UI sources:

- `public/assets/art/ui/mastery.svg`
- `public/assets/art/ui/grudge.svg`

Together with the already-merged World 5/6 hazard symbols, the production `junk-ui` contract becomes 16 frames. Item and portrait atlases remain unchanged, and the game still uses three runtime atlas requests total.

## Telemetry

The event schema supports only low-volume progression transitions:

- `hero_mastery_level_up` — bounded hero ID, level 2–20 and reward count;
- `boss_grudge_changed` — one of six boss families and `started` / `resolved`.

The receiver rejects unknown heroes/bosses and out-of-range levels. Raw XP ticks are intentionally not emitted. This keeps analytics focused on retention milestones rather than producing a high-volume action log.

These events are operational progression metrics; they are not a substitute for real D1/D7 cohort retention.

## Validation

Automated coverage includes:

- 20-level XP thresholds and capping;
- 28 cosmetic reward definitions;
- meaningful-action award values;
- boss-family normalization;
- revenge start/resolve behavior;
- fastest-win and streak updates;
- boss mastery tiers;
- save-v9 persistence and malformed-state rejection;
- authored UI atlas registration;
- client telemetry event typing;
- strict telemetry receiver validation.

Real-device visual/touch acceptance remains part of P6/P8 and real retention impact still requires portal traffic.

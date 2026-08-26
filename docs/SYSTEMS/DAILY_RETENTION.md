# Daily Retention R1

## Goal

Retention R1 gives a returning player a visible reason to play today without increasing permanent combat power. It reuses the existing deterministic run, inventory, fusion, event, boss and economy systems so that one small daily layer creates many different build decisions.

The launch contract is deliberately local-first and backend-free. Reality Stamps, streak state and reward-track progress persist in the versioned local save. None of these fields increase permanent damage, HP, attack speed or starting stats outside the current Daily Rule.

## Daily identity

Daily identity remains the existing UTC key:

- key: `YYYY-MM-DD`
- run seed: `daily:YYYY-MM-DD`
- contracts seed namespace: `daily-contracts:<key>`
- Reality Rule seed namespace: `daily-reality:<key>`

A reload on the same UTC day must regenerate the same three contracts and same Reality Rule. Crossing into a new UTC day resets only that day's counters/completion/claim list; long-lived stamps, streak momentum and reward-track state remain.

## Three-contract board

Each UTC day has exactly three contracts from three separate lanes:

1. progression — boss/world/score/loop objectives;
2. build — fusion/perk objectives;
3. discovery/economy — event/shop objectives.

This lane split is a validity/diversity guard. A day cannot accidentally contain three fusion tasks or three shop tasks that all ask the player to make the same type of build. Contract templates only reference systems that exist in the current launch content.

Tracked counters are compact and deterministic:

- boss victories;
- fusion uses;
- event choices;
- shop purchases;
- perk choices.

World completion, run score and loop entry are derived from the existing `RunProgressState` instead of duplicating run progression inside retention state.

Completed contracts are claimable explicitly. Every contract claim grants one Reality Stamp. Completion and claim IDs are persisted separately so reloads cannot duplicate rewards.

## Reality Stamps

Reality Stamps are a meta currency for expression/collection rewards. R1 deliberately does not spend them on combat power yet. R2/R3 may use them for cosmetic seals, frames, VFX variants or collection presentation, but not permanent stat inflation.

## Non-punitive streak

The first claimed contract of an UTC day qualifies that day.

- consecutive day: streak increases by one;
- skipped days: missed momentum is subtracted rather than hard-resetting a long streak;
- same day: additional claims do not advance the streak again.

The mechanic is intended to create a return prompt without making one missed day feel like a destroyed account.

## Seven-day momentum track

Track progress advances once per qualified UTC day and repeats in seven-day cycles.

- Day 3: +2 Reality Stamps
- Day 5: +3 Reality Stamps
- Day 7: +5 Reality Stamps

Milestone rewards use persisted `<cycle>:<day>` IDs and explicit claim state. Double claims are rejected by domain logic.

## Reality Rule of the Day

R1 ships 12 deterministic daily rules. A rule can alter bounded run-level knobs:

- enemy HP;
- enemy damage;
- enemy attack cadence;
- encounter reward/score scale;
- starting Scrap;
- paid reroll cost;
- boss perk choice count;
- one temporary early backpack pocket.

The rule is layered after the normal campaign/Corrupted Loop encounter definition so the combat panel, reward pipeline and actual combat snapshot all see the same values.

Daily-only economy knobs are also wired into the live systems:

- `startingCoinsForRun()` is used when a Daily run is created;
- `rerollCostForRun()` is passed to the real ShopPanel;
- `perkChoiceCountForRun()` controls real boss perk generation;
- `bonusPocketUnlocksForRun()` controls real BackpackBoard/fusion blocked cells.

Standard runs return the original values.

### Safety envelope

Every authored Reality Rule is validated against bounded launch constraints:

- HP: -20% to +25%;
- damage: -15% to +25%;
- attack speed: -15% to +20%;
- rewards: 0% to +35%;
- starting Scrap: 70–160 total;
- paid reroll: 3–12 Scrap;
- perk choices: 2–4;
- temporary pocket bonus: at most one;
- aggregate positive combat risk capped at 40 percentage points.

The intent is a build puzzle, not a seed that is structurally unwinnable.

## UI and authored presentation

The existing DAILY top-HUD action is reused instead of adding a seventh action.

- standard run: DAILY starts/replaces with today's Daily run using the existing confirm gesture;
- current Daily run: the same action becomes `DAILY BOARD` and opens the retention board.

The board contains:

- Reality Rule hero card and live rule badges;
- all three contract cards with numeric progress bars;
- explicit `IN PROGRESS`, `CLAIM` and `CLAIMED` labels so state is not color-only;
- Reality Stamp total;
- streak and current track day;
- seven-day rail with Day 3/5/7 milestone rewards;
- unclaimed milestone buttons.

Two authored SVG symbols were added to the production UI art source:

- `ui.contract` — junk paperwork/checkbox badge;
- `ui.stamp` — distorted Reality Stamp seal.

They are packed into the existing `junk-ui` atlas, preserving the atlas-first runtime network contract.

### Motion

Board open/close uses the shared overlay motion system. Claim feedback uses a short staged reward burst:

1. scale/fade reveal;
2. readable hold;
3. settle/fade;
4. expanding halo around the authored stamp mark.

Reduced Motion skips the scaling/halo animation and presents a short static confirmation instead.

## Save v9

R1 upgrades persistence from v8 to v9. Migration is automatic and preserves the complete active build/run state.

New v9 fields:

- `dailyRetention`;
- `heroMasteryXp` foundation for R2;
- `bossHistory` foundation for R2.

Hero mastery and boss history foundations contain no active power effects in R1.

The existing semantic migration for pre-six-world v8 campaign saves still runs after v8→v9 conversion. A historical four-world breakpoint at campaign index 11 resumes at World 5; a genuine current six-world breakpoint at index 17 remains unchanged.

## Telemetry and interpretation

Retention telemetry remains privacy-minimal and session-scoped. The strict receiver accepts bounded events for:

- Daily run start through the existing `run_started { mode: 'daily' }` event;
- Daily Board open with rule ID and coarse streak bucket;
- contract completion with archetype and bounded target;
- contract claim with archetype, streak bucket and reward-track day;
- Day 3/5/7 track reward claim.

No daily date, account identifier, persistent player ID, free-form text, email or device fingerprint is introduced.

The soft-launch summary deduplicates funnel reach by ephemeral session while retaining event totals. It reports:

- Daily start reach;
- Daily → Board open;
- Daily → contract completion;
- complete → claim;
- 3/5/7 reward claims;
- coarse streak-bucket mix.

Streak buckets and return-age buckets are operational state samples. They must never be labeled as D1/D7 cohort retention.

## R1 acceptance gate

R1 is code-complete when:

- the same UTC date deterministically regenerates the same board/rule;
- one normal Daily run can advance all supported counter types;
- all advertised rule knobs change their real runtime systems;
- reloads preserve progress and cannot duplicate claims;
- v8 saves migrate without build loss;
- authored contract/stamp art is present in the production UI atlas;
- claim feedback has a Reduced Motion path;
- receiver/report/tests understand the daily funnel;
- full quality and browser-matrix CI is green.

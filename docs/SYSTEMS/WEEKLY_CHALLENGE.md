# Weekly Challenge

## Purpose

Retention R3 adds one standardized replay target per ISO week without creating a backend identity, a global leaderboard or another permanent HUD action. The Weekly Challenge answers: **“How far can I push this week’s same-for-everyone constraint, and can I beat my own result?”**

Weekly is intentionally built from the existing six-world run rather than a separate mini-game. Shops, backpack arrangement, fusions, events, bosses, campaign clear and Corrupted Loops all remain the normal gameplay surface.

## Weekly identity

A challenge is identified by the ISO-8601 UTC week key `YYYY-Www` and uses the run seed `weekly:YYYY-Www`.

The identity is deterministic across reloads and clients for the same week. ISO week-year rollover is handled explicitly, including weeks that cross calendar-year boundaries.

## Curated loadout constraint

Each week deterministically selects one of eight authored launch constraints. The constraint fixes one of the four existing heroes, one existing starting perk and a short authored rule description.

| Constraint | Hero | Starting perk |
| --- | --- | --- |
| Salvage Plating | Scavenger | Scrap Plating |
| Engineer Overclock | Engineer | Overclock |
| Toxic Warranty | Alchemist | Toxic Warranty |
| Pet Laser License | Beastfriend | Laser Pet |
| Salvage Bad Idea | Scavenger | Bad Idea Energy |
| Signal Engineer | Engineer | Signal Booster |
| Slime Alchemist | Alchemist | Slime Rights |
| Catnip Beastfriend | Beastfriend | Catnip Optics |

A Weekly attempt starts with this fixed hero/perk instead of opening Hero Choice. The run then follows the same deterministic campaign pipeline as Standard/Daily play. Hero starting-coin bonuses are still applied so the authored hero contract is preserved.

## Personal tiers

| Tier | Score | Cosmetic record |
| --- | ---: | --- |
| Bronze | 2,500 | Bronze Receipt |
| Silver | 5,000 | Silver Static |
| Gold | 8,000 | Gold Glitch |
| Reality-Broken | 11,000 | Reality Broken |

Rewards are expression/collection markers only. Weekly does not grant permanent damage, HP, trigger-speed or other combat-stat inflation. Thresholds are launch tuning values and can be retuned from real score distributions.

## Retry and local history

Weekly attempts are unlimited. Starting a new attempt increments the current week’s attempt counter; improving score, loop depth or tier updates the same record and never downgrades an existing best.

The save keeps the most recent **12 weeks**. Each history row records week key, attempts, best score, deepest loop, fixed hero/perk constraint, best earned tier and cosmetic reward IDs implied by that tier.

This is deliberately local meta progression. There is no account requirement and no backend player identity.

## Navigation

The previous Daily top-HUD slot is now a **Challenges** entry point. It opens the Daily Board, which provides explicit Daily start/resume plus a route to Weekly Challenge.

This preserves the existing six-action responsive HUD instead of adding a seventh permanent action that would worsen compact-landscape touch density. Starting Daily or Weekly is explicit because either mode replaces the current active run; merely opening Challenges is non-destructive.

## Persistence

Weekly history extends save v9 through an optional `weeklyChallenge` field. Existing v9 saves that predate R3 remain valid and normalize to an empty Weekly history on load; v8 migration also initializes an empty state.

Validation rejects impossible week keys, negative/unbounded counters, forged hero/perk loadouts, invalid tiers and malformed reward IDs. History is capped to 12 entries.

## Telemetry and soft-launch reporting

R3 emits bounded, privacy-minimal events:

- `weekly_board_opened` — best tier + attempt-count bucket;
- `weekly_attempt_started` — one of the eight whitelisted constraint IDs + attempt-count bucket;
- `weekly_attempt_finished` — tier, score bucket, deepest loop and attempt-count bucket;
- `run_started` supports `weekly` alongside `standard` and `daily`.

The Weekly event does not transmit raw exact score. Score/retry volume uses bounded buckets, and the receiver strictly rejects unknown constraints, tiers and buckets.

The soft-launch report aggregates Weekly start reach, board reach, sessions finishing an attempt, start/finish volume, retry-state distribution, score-bucket distribution and tier distribution. Ephemeral session IDs make these operational replay signals, not persistent-player cohort statistics.

## Backend / leaderboard decision

Global leaderboard and backend identity remain deliberately deferred. Add them only if real Weekly participation, retries and score competition justify the platform/backend complexity and moderation/privacy surface.

## Validation

Automated coverage includes ISO-week rollover, deterministic challenge selection, curated loadout integrity, tier thresholds, monotonic best-score/history updates, 12-week trimming, old-save-v9 normalization, malformed-save rejection, client telemetry typing, strict receiver validation, report aggregation and Markdown reporting.

The final R3 executable tree passed `npm run typecheck`, **282/282 unit tests**, and `npm run build` before documentation closure. Physical-device/portal acceptance remains the next roadmap gate.

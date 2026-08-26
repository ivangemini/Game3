from pathlib import Path

roadmap = Path('ROADMAP.md')
text = roadmap.read_text(encoding='utf-8')

old_priority = """## Current execution priority
1. **Retention Wave R3:** Weekly Challenge + personal weekly history/tiers; no backend leaderboard until real behavior justifies it.
2. **Release acceptance:** physical-device presentation/performance review and real Yandex/CrazyGames tester compliance.
3. **R2 measurement:** use real Archive/fusion/mastery behavior to decide whether conditional/forbidden fusion content is justified.
4. Real traffic then decides whether the next investment is balance, additional gameplay content, social competition or another retention layer.
"""
new_priority = """## Current execution priority
1. **Release acceptance:** physical-device presentation/performance review and real Yandex/CrazyGames tester compliance.
2. **R1–R3 measurement:** use real Daily, mastery, Archive and Weekly behavior to validate retention lift and tune thresholds/rewards.
3. **Evidence-gated gameplay multipliers:** world-specific event flavor, late-boss escalation or conditional fusion expansion only where real six-world/retention data shows a need.
4. Real traffic decides whether the next major investment is balance, additional gameplay content, social competition or backend services.
"""
if old_priority not in text:
    raise RuntimeError('current execution priority block changed')
text = text.replace(old_priority, new_priority, 1)

old_r3 = """### R3 — Weekly replay layer [PLANNED]
- [ ] Deterministic **Weekly Challenge** with one weekly seed plus a curated rule/loadout constraint assembled from existing systems.
- [ ] Personal Bronze/Silver/Gold/Reality-Broken score tiers tuned by simulation first and real traffic later.
- [ ] Local weekly history for recent weeks: best score, deepest checkpoint, hero/rule and earned tier.
- [ ] Weekly reward track remains cosmetic/collection-focused and cannot invalidate normal-run balance.
- [ ] Weekly challenge telemetry: entry rate, completion, score distribution, retry count and tier distribution.
- [ ] Defer global leaderboard/backend identity until weekly participation and replay rates justify the added platform/backend complexity.

**R3 gate:** the game has a daily reason to return, a multi-week personal progression reason to continue, and a weekly standardized challenge reason to replay.
"""
new_r3 = """### R3 — Weekly replay layer [DONE]
- [x] Deterministic **Weekly Challenge** uses an ISO-UTC `weekly:YYYY-Www` seed and one of 8 curated fixed hero + starting-perk loadouts assembled from existing launch systems.
- [x] Personal Bronze/Silver/Gold/Reality-Broken score tiers at 2,500 / 5,000 / 8,000 / 11,000 points; thresholds are explicit launch targets and remain tunable from real traffic.
- [x] Local **12-week history** stores attempts, best score, deepest loop, fixed hero/perk constraint, best tier and earned cosmetic reward IDs; retries are unlimited and best results never downgrade.
- [x] Weekly tier rewards are cosmetic/collection-facing only (`Bronze Receipt`, `Silver Static`, `Gold Glitch`, `Reality Broken`) and cannot invalidate normal-run combat balance.
- [x] Existing Daily HUD slot is now a **Challenges** entry point for Daily + Weekly, avoiding a seventh permanent mobile HUD action; Weekly reuses the full six-world shop/fusion/event/boss/loop pipeline.
- [x] Weekly challenge telemetry + soft-launch report cover entry, board reach, finished attempts, bounded retry/score buckets and tier distribution using ephemeral session IDs rather than persistent player identity.
- [x] Global leaderboard/backend identity is deliberately deferred until Weekly participation and retry behavior justify the platform/backend complexity.

**R3 gate:** complete in code. The game now has a daily return loop, multi-week mastery/discovery progression and a standardized weekly replay target with local history and cosmetic tiers. Real portal traffic is the next gate before leaderboard/backend investment or threshold/reward retuning.
"""
if old_r3 not in text:
    raise RuntimeError('R3 roadmap block changed')
text = text.replace(old_r3, new_r3, 1)

old_p9 = '- [x] P5R R2 mastery/revenge/discovery foundation: 4×20 Hero Mastery, 28 cosmetic milestones, six-family grudge history/revenge, Trophy UI, Junk Archive silhouettes/traces/almost-solved breadcrumbs and bounded transition/exposure telemetry/report aggregation.\n'
new_p9 = old_p9 + '- [x] P5R R3 Weekly replay layer: ISO-week challenge seed, 8 curated hero+perk loadouts, four personal score tiers, 12-week local history, cosmetic rewards and privacy-minimal entry/retry/score/tier reporting.\n'
if old_p9 not in text:
    raise RuntimeError('P9 R2 marker changed')
text = text.replace(old_p9, new_p9, 1)

old_measure = '- [ ] measure tutorial/help usage/hero choice/first boss/six-world campaign duration/world continuation/event choice/fusion usage/daily participation/contract completion/mastery level-up reach/grudge start-resolve volumes/Archive reach/Recipe Book reach/almost-solved exposure/loop-entry/loop-completion/return behavior on real traffic\n'
new_measure = '- [ ] measure tutorial/help usage/hero choice/first boss/six-world campaign duration/world continuation/event choice/fusion usage/daily participation/contract completion/mastery level-up reach/grudge start-resolve volumes/Archive reach/Recipe Book reach/almost-solved exposure/**Weekly entry, completion, retries, score/tier distribution**/loop-entry/loop-completion/return behavior on real traffic\n'
if old_measure not in text:
    raise RuntimeError('P9 measurement marker changed')
text = text.replace(old_measure, new_measure, 1)
roadmap.write_text(text, encoding='utf-8')

Path('docs/SYSTEMS/WEEKLY_CHALLENGE.md').write_text("""# Weekly Challenge

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
""", encoding='utf-8')

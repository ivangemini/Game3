# Daily Seeded Run

## Goal
Daily Run gives every player the same deterministic run inputs for one UTC calendar day while reusing the normal campaign, shop, event, perk, mutation, fusion and boss systems.

It is a retention layer, not a second ruleset.

## Identity
`src/game/domain/dailyRun.ts` defines the canonical identity:

- day key: `YYYY-MM-DD` in UTC;
- run seed: `daily:YYYY-MM-DD`.

UTC is intentional so timezone presentation cannot create different challenges for players on the same server day.

The domain validates explicit keys as real calendar dates. Malformed dates such as February 30 are rejected.

## Runtime behavior
The main HUD exposes a `DAILY RUN` entry point showing today's UTC key.

Starting it:
1. preserves meta discovery, Archive Ranks, achievements and settings;
2. replaces only the active run with a fresh run using today's daily seed;
3. returns to hero selection;
4. runs the existing 12-encounter campaign normally;
5. allows Corrupted Loop continuation using the same daily seed if the player chooses to go deeper.

Because all run-affecting generators already derive from `runSeed`, the daily seed automatically fixes shop offers, rerolls, perk offers, events, mutations and encounter variation without dedicated daily copies of those systems.

## Visibility
An active Daily Run is explicitly labeled in the run identity line as `DAILY YYYY-MM-DD` and the HUD button changes to an active state.

The daily entry point cannot replace a run while combat or another blocking meta/event overlay is active.

## Persistence
No Save v9 migration is required for the current foundation. The daily identity is encoded in the existing `activeRun.runSeed`, so reload resumes the same daily run through normal active-run persistence.

Historical daily leaderboards, per-day personal bests or limited-attempt state are intentionally not persisted yet. Those should be added only together with platform leaderboard/cloud requirements rather than inventing a local-only contract that later conflicts with portal APIs.

## Fairness contract
For a given UTC date and game content version, two players using the same decisions should receive the same seeded generated choices. Hero choice and player decisions remain free variables; Daily Run is a shared deterministic challenge, not a prerecorded build.

## QA
Regression tests cover:
- UTC midnight rollover;
- key → seed round-trip;
- daily seed recognition;
- rejection of malformed/impossible dates.

Future portal leaderboard work must include a content/build version in score submission metadata so scores from materially different balance versions are not compared blindly.

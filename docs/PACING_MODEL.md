# Seeded Pacing Model

## Purpose
The pacing simulator is a deterministic QA model for the target session envelope. It exists to stop campaign length from drifting accidentally when the run structure changes.

It is **not player telemetry** and it does not claim that a human will take exactly the modeled time. Runtime playtests and portal analytics remain the release gate.

## What it uses
`src/game/simulation/pacing.ts` resolves the real campaign and Corrupted Loop encounter definitions, so encounter kind/world changes are reflected automatically. A seeded RNG then samples time budgets for:

- first setup;
- shop/repack decisions, with later worlds taking longer as the build becomes denser;
- fight/elite/boss combat;
- six deterministic event decisions during the 18-encounter campaign and four during each 12-encounter loop;
- six campaign boss-perk decisions and four per loop;
- fusion opportunities after Boss 1;
- the Escape / Go Deeper decision between cycles.

The base campaign now has **6 worlds × 3 encounters = 18 encounters**. Corrupted Loops intentionally remain **4 worlds × 3 encounters = 12 encounters**, so extending the first campaign does not multiply every deep cycle by the same amount. Loop 3 also gets additional combat-time pressure so deep sessions do not stay flat as corruption scales.

## Current target envelope
The default target profile is calibrated around a substantially longer first successful run while retaining a fast first boss:

- first boss: **3–5 min**;
- six-world base campaign: **32–42 min**;
- campaign + completed Loop 2: **55–75 min**;
- campaign + Loop 2 + Loop 3: **80+ min**.

The automated report samples 512 deterministic seeds in regression tests and tracks mean, P10, P50, P90 and target hit rate for the four checkpoints. The soft-launch telemetry report uses the same **32–42 minute** campaign p50 band once its minimum completion sample is met.

## Why this is useful
The report catches structural pacing regressions cheaply. Examples:

- adding several mandatory decisions to World 1 can push the first boss past five minutes;
- shortening all later repack windows can make an 18-fight campaign feel too small despite its encounter count;
- extending Corrupted Loops to six worlds by accident would inflate deep-session time far beyond the intended envelope;
- excessive loop scaling can make one corrupted cycle overshoot the intended strong-session band;
- removing events/perks/fusion opportunities can silently reduce decision density even when encounter count stays unchanged.

## What it deliberately does not model yet
- actual player input speed;
- tutorial hesitation;
- real combat duration from a sampled backpack build;
- losses/retries/revives;
- ad time;
- platform loading/network delays;
- accessibility/reduced-motion effects on decision time.

The deterministic combat/build simulation remains the separate balance layer. Soft-launch telemetry should replace pacing assumptions with measured distributions while this model remains a structural regression guard.

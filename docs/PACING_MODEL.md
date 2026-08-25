# Seeded Pacing Model

## Purpose
The pacing simulator is a deterministic QA model for the target session envelope. It exists to stop campaign length from drifting accidentally when the run structure changes.

It is **not player telemetry** and it does not claim that a human will take exactly the modeled time. Runtime playtests and portal analytics remain the release gate.

## What it uses
`src/game/simulation/pacing.ts` resolves the real campaign and Corrupted Loop encounter definitions, so encounter kind/world changes are reflected automatically. A seeded RNG then samples time budgets for:

- first setup;
- shop/repack decisions, with later worlds taking longer as the build becomes denser;
- fight/elite/boss combat;
- the four deterministic event decisions in each cycle;
- boss perk decisions;
- fusion opportunities after Boss 1;
- the Escape / Go Deeper decision between cycles.

Loop 3 also gets additional combat-time pressure so deep sessions do not stay flat as corruption scales.

## Current target envelope
The default target profile is calibrated around the current product decision that a session should be materially longer than the original tiny prototype:

- first boss: **3–5 min**;
- base campaign: **20–25 min**;
- campaign + completed Loop 2: usually inside **30–50 min**;
- campaign + Loop 2 + Loop 3: **60+ min**.

The automated report samples 512 deterministic seeds in regression tests and tracks mean, P10, P50, P90 and target hit rate for the four checkpoints.

## Why this is useful
The report catches structural pacing regressions cheaply. Examples:

- adding several mandatory decisions to World 1 can push the first boss past five minutes;
- shortening all later repack windows can make a 12-fight campaign feel too small;
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

The next balance-simulation layer should sample real legal builds and run deterministic combat against the encounter table. Soft launch telemetry should then replace pacing assumptions with measured distributions while keeping this model as a structural regression guard.

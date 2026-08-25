# Campaign Orientation & Continuation Funnel

## Purpose
The six-world base campaign is long enough that the player must always understand how far the current build has travelled and what remains before the safe exit. This layer adds orientation and measurement without changing combat power, rewards, save shape or portal payload requirements.

## Runtime presentation contract
The run panel presents the base campaign as six explicit world segments.

- completed worlds use a completed-state segment;
- the current campaign world uses a distinct active-state segment;
- future worlds remain muted;
- state is not communicated by color alone: segment labels use `✓n` for completed worlds and `>n` for the active world;
- campaign encounter position is shown as `n/18`;
- Corrupted Loop encounter position is shown separately as `n/12`;
- after a non-final campaign boss, the status area holds `WORLD n CLEARED` until the next fight begins;
- after World 6, the existing Escape / Go Deeper breakpoint remains the primary action.

The rail is intentionally compact and secondary to the current encounter/boss state. It must not compete with the backpack or combat HUD.

## Progress derivation
`completedCampaignWorldCount()` derives campaign world completion from the existing `RunProgressState` and the shared `ENCOUNTERS_PER_WORLD` constant. No extra persistent field is introduced. Completed campaign progress therefore survives through the existing run save automatically and cannot diverge from encounter progression.

The helper derives completed encounters from the stored campaign index rather than assuming every non-campaign state came from the current six-world structure. This keeps old archived/loop states honest when inspecting legacy data.

## Pre-expansion v8 compatibility
The campaign extension kept save schema v8 because no fields changed, but the meaning of one previously valid state did change. Before the extension, `deep-choice + loopNumber 1 + campaignEncounterIndex 11` meant the four-world campaign had just been cleared. In the six-world build that state would otherwise offer an early cash-out/loop before Worlds 5–6.

`loadSave()` therefore performs an idempotent semantic normalization for exactly that impossible-in-the-new-build breakpoint. It resumes the run at campaign encounter index 12, the first encounter of World 5, while preserving the backpack, coins, seed, score, discoveries, selected/pending perks, claimed rewards and event state. Genuine six-world breakpoints at index 17 and existing deeper-loop runs are left unchanged.

## Analytics contract
The soft-launch summary derives a six-row campaign continuation funnel from the existing victorious campaign-boss `combat_finished` events:

1. TV Tyrant
2. Deadline Snail
3. Closet Monster
4. Baby Moon
5. Copycat Auditor
6. Border Shark

For each world the report exposes:

- sessions that cleared the world;
- clear rate versus observed session starts;
- continuation rate from the previous cleared world;
- average, p50 and p90 time from `run_started` to that boss victory.

No new telemetry event or persistent analytics identity is required. This keeps the privacy surface unchanged while making the 18-encounter campaign diagnosable world by world.

## Interpretation
A sharp continuation drop between two adjacent worlds is a stronger signal than full-campaign completion alone. Diagnose it together with the relevant boss win rate, combat duration, event/fusion usage and the overall pacing envelope before changing difficulty.

Partial telemetry exports can omit an earlier world. In that case previous-world continuation is reported as unavailable rather than inventing a denominator.

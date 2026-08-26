# Late World Identity — teach → test → boss

## Goal

Worlds 5–6 should feel like authored late-campaign districts rather than four more stat-scaled encounters before the final bosses. They now introduce the arrangement concept that the following boss will weaponize, but use a lighter reversible surcharge instead of copying the boss's direct punishment.

The campaign remains 6 worlds / 18 encounters. This system does not lengthen the run and must not become an HP-sponging layer.

## World 5 — Duplicate District

### Carbon Copy Clerks — Carbon Audit
- Reads the largest exact-definition duplicate stack from the immutable combat snapshot.
- Each copy beyond the first adds **+6% enemy HP**, capped at **+24%**.
- No direct player damage.
- Counter: diversify exact item definitions before starting combat.

### Mirror Mule — Mirror Overtime
- Reads the same largest exact-definition duplicate stack.
- Each copy beyond the first adds **+8% enemy attack speed**, capped at **+24%**.
- Counter: break up the largest duplicate stack.

### Copycat Auditor — Duplicate Debt → Final Audit
The first cycle uses the familiar **4 damage per extra exact copy**. From cycle 2 onward, the telegraph explicitly changes to **FINAL AUDIT** and announces **6 damage per extra copy** before impact. The target rule never changes: diversify exact definitions to erase the debt, or use shield as the secondary mitigation path. The two preceding fights have already taught the player which items create the duplicate stack.

## World 6 — Perimeter District

### Edge Eel Syndicate — Perimeter Current
- Counts unique items touching the outer backpack perimeter.
- Each edge item adds **+3% enemy attack speed**, capped at **+21%**.
- Counter: move important/large items inward where possible.

### Rent Collector Crab — Security Deposit
- Counts the same perimeter-touching items.
- Each edge item adds **+3% enemy HP**, capped at **+30%**.
- Counter: reduce perimeter occupancy rather than simply buying more power.

### Border Shark — Edge Rent → Border Lockdown
The first cycle charges **2 damage per perimeter item**. From cycle 2 onward, the telegraph explicitly changes to **BORDER LOCKDOWN** and announces **3 damage per perimeter item** before impact. The geometry remains identical: move items inward to erase rent, or use shield as the secondary mitigation path. World 6 therefore teaches the same readable counter twice before the final escalating test.

## Event affinity

The strange-event pool remains the same **15 authored events**. Campaign Worlds 5–6 now bias selection toward existing events whose fiction reinforces the district the player is in, instead of adding bespoke one-off encounters or increasing run length.

- **World 5 / Duplicate District:** `Duck Tax Office`, `Banana Compliance Desk`, `Forbidden Printer Support`.
- **World 6 / Perimeter District:** `Pigeon Signal Tower`, `Taxidermy Wi-Fi Cafe`, `Emergency Moon Laundromat`.

Each preferred event has selection weight **3** versus **1** for a generic event. Immediate-repeat prevention is applied before weighting. Worlds 1–4 keep the original unweighted selection behavior. Corrupted Loop worlds remain unweighted because their local world indices are 1–4 and their identity already comes from stacked mutations/anomalies.

Selection still uses the existing seeded `runSeed + eventIndex` RNG and persists only the chosen `pendingEventId`. Therefore reloading cannot reroll the event or change its outcome. The feature changes flavor frequency, not rewards, event count, save schema or campaign duration.

## Snapshot contract

Late-world pressure is evaluated from `CombatBuildItem` data after hero/perk/synergy build creation and before `createCombatState()`.

This means:
- rearranging before **START FIGHT** can change the surcharge;
- the value is frozen for that fight;
- frame rate cannot change the result;
- rewards are not increased by the surcharge;
- Daily Reality Rules remain a separate deterministic layer on the encounter definition.

## Presentation contract

The mechanic must never exist only as hidden arithmetic.

Before combat:
- the RUN encounter subtitle names the district hazard and explains the affected arrangement pattern.

At combat start:
- World 5 uses warm audit/coral treatment;
- World 6 uses cyan/electric treatment;
- an authored UI emblem appears from the production `junk-ui` atlas;
- affected backpack items receive a short cell overlay;
- status text states the measured pressure count and exact resulting percentage;
- a restrained enemy entrance pulse reinforces the state change.

Authored sources:
- `ui.world5-audit` → `public/assets/art/ui/world5-audit.svg`
- `ui.world6-edge` → `public/assets/art/ui/world6-edge.svg`

Reduced Motion keeps the emblem and color/state text but removes the looping pulse.

## Balance constraints

- Non-boss pressure may alter enemy HP/damage/cadence only; no surprise direct damage.
- Every pressure has an arrangement counter available before combat.
- Caps are deliberately below the corresponding boss threat's qualitative severity.
- Copycat Auditor and Border Shark phase two begins on mechanic cycle 2, not at a hidden HP threshold, so the stronger price is fully telegraphed and render-chunk invariant.
- The system should create a decision, not force a single exact layout.
- Do not raise base campaign length or add mandatory extra encounters to support this feature.

## Validation

Automated coverage must verify:
- unrelated enemies receive no pressure;
- duplicate counting uses exact definition IDs and extra copies only;
- perimeter counting is per item, not per occupied cell;
- all percentage caps;
- applying pressure preserves enemy identity;
- authored hazard art remains part of the UI atlas budget.

Physical-device acceptance remains part of the broader P6/P8 visual/performance review.

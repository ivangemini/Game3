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

### Copycat Auditor — Duplicate Debt
The boss keeps the stronger existing rule: periodic telegraph + direct duplicate pressure. The two preceding fights have already taught the player what exact copies are and which items are causing the problem.

## World 6 — Perimeter District

### Edge Eel Syndicate — Perimeter Current
- Counts unique items touching the outer backpack perimeter.
- Each edge item adds **+3% enemy attack speed**, capped at **+21%**.
- Counter: move important/large items inward where possible.

### Rent Collector Crab — Security Deposit
- Counts the same perimeter-touching items.
- Each edge item adds **+3% enemy HP**, capped at **+30%**.
- Counter: reduce perimeter occupancy rather than simply buying more power.

### Border Shark — Edge Rent
The boss keeps the stronger existing rule: periodic telegraph + direct perimeter rent damage. World 6 therefore teaches the geometry twice before the final test.

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

# Deadline Snail Boss Family — Time Tax

## Fantasy
Deadline Snail is the third real boss family and replaces the repeated World 2 TV Tyrant remix. It punishes a backpack that pours all trigger-speed investment into one hyper-efficient carry item.

## Core rule
`Time Tax` looks at the immutable combat-start item snapshot and selects the fastest meaningful combat item by trigger interval. Ties resolve by stable item instance ID.

The campaign rule uses:
- 4.8s cadence;
- 0.9s telegraph;
- +1.2s delay to the target's next queued trigger.

At each cycle:
1. the target item is selected deterministically;
2. its occupied backpack cells telegraph before impact;
3. normal combat advances exactly to the impact timestamp;
4. any trigger already due at that exact timestamp resolves normally;
5. the target's next still-pending trigger is shifted forward by 1.2s;
6. every other item remains untouched.

Time Tax is a one-shot queue delay, not a silence window. That keeps it mechanically different from Channel Jam, Slime Signal and Tag Eclipse.

## Counterplay
The player can respond before the boss by:
- spreading trigger-speed investment across several useful items;
- keeping a slower secondary damage/poison engine instead of relying on one carry;
- using fusions that redistribute power into a different item profile;
- accepting the tax if the carry is powerful enough to remain efficient even after occasional delays.

The rule should make tempo distribution a build consideration without making fast items undesirable everywhere else.

## Determinism
`src/game/domain/bossCombat.ts` wraps the generic combat engine. It derives all telegraph and impact boundaries from absolute combat time, advances generic combat to those boundaries, then applies the queue transform.

No extra mutable boss clock is persisted. This means one 12-second update and 120 updates of 100ms converge to the same combat state.

If Time Tax impact shares a timestamp with a normal item trigger, generic combat resolves that queued trigger first; Time Tax then shifts the next queued trigger. This ordering is intentional and test-covered.

## Corrupted Loop escalation
Corrupted Deadline Snail keeps the same +1.2s tax but increases cadence using the same loop speed curve used by encounter pressure, with a 3.2s interval floor.

The mechanic therefore becomes more frequent rather than stronger per hit, avoiding opaque escalating delay values.

## Audio / VFX contract
Semantic audio hooks:
- `boss.time-tax.telegraph` — priority 3;
- `boss.time-tax.impact` — priority 4.

The backpack telegraph uses the target item's occupied cells. Impact flashes the same footprint briefly. Reduced-motion mode keeps the state/color change without pulsing.

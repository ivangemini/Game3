# Baby Moon Boss Family — Tag Eclipse

## Fantasy
Baby Moon is the second real boss family. It does not reuse TV Tyrant's Channel Jam, Slime Signal or Magnet Scramble. It watches which combat tag the backpack relies on most, eclipses that family, then forces the rest of the build to carry the fight temporarily.

## Core rule
`Tag Eclipse` counts tags across the immutable combat-start backpack snapshot and selects the most represented tag. Ties resolve through a stable tag priority and then lexical order, so the same build always produces the same target.

The boss then:
1. telegraphs the targeted tag and affected item count;
2. highlights every occupied backpack cell belonging to matching items;
3. after the telegraph, suppresses triggers from matching items for a fixed duration;
4. leaves all other tag families active;
5. repeats on a deterministic cadence.

The first campaign Baby Moon uses a 5.2s cadence, 1.2s telegraph and 3.0s eclipse duration.

## Counterplay
Tag Eclipse must teach a build lesson rather than create an unavoidable shutdown.

Primary counters:
- diversify the main damage engine across two or more tag families;
- keep a secondary poison/damage/shield branch that remains productive during an eclipse;
- use fusions to change a dominant item's tag mix before the final boss;
- value items that bridge several synergies without making every combat item share the same dominant tag.

A mono-tag build can still win through enough power, but it accepts a clear boss-specific risk.

## Determinism
Combat items carry their stable gameplay tags into the immutable combat snapshot. The combat domain owns target selection, telegraph timing, eclipse state and trigger suppression. Phaser only renders presentation events and cannot change the chosen tag or outcome.

`Tag Eclipse` adds these presentation events:
- `boss-tag-telegraph`;
- `boss-tag-eclipsed`;
- `item-eclipsed`.

## Corrupted Loop escalation
Corrupted Baby Moon keeps the same readable rule. Loop depth reduces the interval using the existing loop speed scale with a 3.4s floor; it does not gain TV Tyrant attacks merely to become harder.

This preserves boss-family identity and avoids difficulty through HP inflation alone.

## Audio / VFX contract
Semantic audio hooks:
- `boss.eclipse.telegraph` — priority 3;
- `boss.eclipse.impact` — priority 4;
- `item.eclipsed` — priority 2 with cooldown.

The UI telegraph highlights the complete affected tag footprint in pale moonlight, then holds a stronger violet overlay during suppression. Reduced-motion mode removes pulsing but keeps color/state readability.

# Archive Ranks and Trophy Shelf

## Purpose
P5 meta progression turns existing discovery and Corrupted Loop mastery into long-term goals without adding permanent combat power or another currency.

## Source data
The system is fully derived from existing Save v8 fields:
- `discoveredItemIds`;
- `discoveredRecipeIds`;
- `bestCorruptedLoop`.

No milestone or achievement completion booleans are persisted. Loading an older save immediately reconstructs the correct current rank and trophy state. Stale IDs that no longer exist in the current catalog are ignored.

## Archive ranks
Five sequential cosmetic ranks are available:
1. Dumpster Intern — baseline Paper Clip Seal;
2. Scrap Scout — early Itemdex progress;
3. Junk Curator — meaningful Itemdex + Recipe Book progress;
4. Fusion Librarian — deep collection progress plus at least one secret second-stage evolution;
5. Void Archivist — complete current Itemdex, complete current Recipe Book, all current secret evolutions and completion of Corrupted Loop 2.

Thresholds are calculated against the current catalog size where appropriate. Adding future content therefore changes completion requirements without requiring a save migration.

The rewards are identity/cosmetic archive seals and titles only. They never modify combat stats, shop prices or run RNG.

## Achievements
The Trophy Shelf currently derives thirteen achievements across four families:
- Itemdex discovery;
- Recipe Book discovery;
- secret second-stage evolution discovery;
- Corrupted Loop depth.

Achievements expose current/target progress before completion and switch to an unlocked presentation when complete.

## Runtime presentation
`MetaProgressOverlay` is opened from the main HUD through `TROPHY SHELF`.

The overlay shows:
- current archive rank and cosmetic seal;
- five rank milestones and their requirements;
- unlocked achievement count;
- secret-evolution progress;
- paginated achievement cards.

Like the Junk Archive, the Trophy Shelf is a between-decisions meta pause. It cannot open over combat, hero selection, perk selection or a pending run event. While open it blocks encounter start, fusion, cash-out and Corrupted Loop entry.

## Architecture
`src/game/domain/metaProgression.ts` owns all threshold calculation, stale-ID filtering and completion rules. It has no Phaser or persistence dependency.

`src/game/ui/MetaProgressOverlay.ts` renders the returned snapshot and never writes completion state.

`PrototypeScene` only supplies current Save v8 discovery/loop values and enforces modal exclusivity.

## Retention principle
Milestones create visible unfinished goals from systems the player already engages with. They intentionally unlock identity and collection status rather than stacking permanent power, preserving run mastery and build experimentation as the main progression axis.

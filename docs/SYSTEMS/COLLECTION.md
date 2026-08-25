# Itemdex + Recipe Book

## Purpose
The Junk Archive turns persistent discovery into a visible retention loop without permanent combat power. The player can see that more junk and recipes exist, but unknown entries do not reveal the answer before the player earns it.

## Itemdex
- Covers every current item definition: base/shop items and fusion-only results.
- Unknown entries expose only a locked slot and generic discovery prompt.
- Discovered entries reveal name, rarity text, source (`RUN DROP` or `FUSION`), tags, description and a compact shape preview.
- Rarity is communicated by text plus border treatment; color is not the only signal.
- Pagination keeps cards readable at the fixed 1600×900 design surface and therefore survives FIT scaling better than a single 60-card wall.

Current prototype scope: **60 item slots**.

## Recipe Book
- Covers all current fusion recipes.
- Unknown entries show `??? + ???` and do not expose ingredient/result definitions.
- A recipe becomes visible only after a successful real fusion records its stable recipe ID in discovery persistence.
- Discovered entries reveal both ingredient names, result name/tags and whether the recipe is a normal first-stage fusion or a secret second-stage evolution.

Current prototype scope: **24 recipe slots**, including 4 second-stage transformations.

## Progress
The archive displays item and recipe completion independently as discovered/total plus percentage.

Progress is derived against the current content catalog rather than raw save-array length. Stale IDs left by removed content therefore do not inflate completion percentages or crash the archive.

## Persistence
No save migration is required. `SaveV8.discoveredItemIds` and `SaveV8.discoveredRecipeIds` remain the source of durable collection progress.

Discovery continues to occur through real gameplay:
- buying or receiving a real item records its item ID;
- a successful fusion records the result item ID and recipe ID.

The collection UI is read-only. It cannot grant items, recipes, currency or combat bonuses.

## Runtime rules
- The archive is opened from the main prototype HUD between active decisions.
- It cannot be opened during combat or over hero/perk/event decisions.
- While open, encounter start, fusion, cash-out and loop-entry actions are blocked.
- Escape or the explicit Close button dismisses it.

## Architecture
`src/game/domain/collection.ts` creates a presentation-safe snapshot from content definitions plus discovery IDs. Unknown entries deliberately omit definition/recipe payloads, so presentation code cannot accidentally reveal hidden content.

`src/game/ui/CollectionOverlay.ts` renders and paginates that snapshot. It receives discovery through a callback from the scene and does not own persistence.

## QA contract
Automated tests cover:
- full 60-item / 24-recipe catalog shape;
- no payload leakage for unknown entries;
- shop-vs-fusion source classification after discovery;
- first-stage vs second-stage classification after recipe discovery;
- stale save IDs ignored by progress counts.

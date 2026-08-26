# Junk Archive Discovery Breadcrumbs

## Goal

Retention R2 turns the existing 60-item / 24-recipe Junk Archive into an unfinished-goal surface without increasing the launch recipe count or adding another persistent progression schema.

The Archive should answer three questions after a normal run:

1. **What junk have I still never seen?**
2. **Which recipes have I partially traced?**
3. **Which exact pairs can I try next?**

The system is derived entirely from the existing discovery IDs and recipe catalog, so save v9 remains sufficient.

## Item silhouettes

Undiscovered Itemdex entries no longer use an identical generic `???` card. They expose only the item's backpack shape as a muted silhouette.

The silhouette intentionally does **not** expose:

- item name;
- tags;
- rarity;
- source;
- description;
- authored item art.

This creates recognition value during later shops/events without revealing the payload in advance.

## Recipe clue states

Every undiscovered recipe derives one of three states from which ingredient definitions have already been discovered.

### LOCKED — zero ingredients known

Presentation:

- `??? + ???`;
- instruction to discover an ingredient first;
- result remains hidden.

No ingredient metadata is exposed.

### RECIPE TRACE — some ingredients known

Known ingredients are named. Missing ingredients remain unnamed but expose a bounded structural clue:

- rarity;
- primary tag;
- occupied cell count.

Example shape of the clue:

`LASER CAT + ???`

`MISSING TRACE • COMMON BATTERY • 1 CELL`

This is enough to make future shops and silhouettes meaningful without simply printing the answer.

### ALMOST SOLVED — all ingredients known, recipe not fused yet

The exact ingredient pair is now shown because both components are already in the player's discovered catalog. The recipe's authored hint is also shown.

The result identity still remains `???` until the fusion is actually performed.

Second-stage recipes use the stronger `FORBIDDEN PAIR` presentation so secret evolution chains remain visually distinct.

## Discovery counter

The Archive header derives two extra counts:

- `TRACES` — undiscovered recipes with partial ingredient knowledge;
- `ALMOST` — undiscovered recipes whose complete ingredient set has already been discovered.

These are not saved separately. They update automatically as normal item/recipe discovery changes.

## Persistence contract

No save-schema bump is required.

Source state remains:

- `discoveredItemIds`;
- `discoveredRecipeIds`.

All silhouettes and clue states are derived from the current content catalog at render time. A future recipe/content expansion therefore does not require migrating clue progress.

Stale discovery IDs continue to be ignored by the collection model.

## Privacy-minimal measurement

Opening the Archive or switching between `ITEMDEX` and `RECIPE BOOK` emits one bounded `archive_tab_viewed` event containing only:

- `tab`: `items` or `recipes`;
- aggregate number of traced recipes;
- aggregate number of almost-solved recipes.

Pagination does not emit another event. Recipe IDs, item IDs and hidden results are not transmitted.

The soft-launch summary derives:

- Archive session reach;
- Recipe Book session reach;
- Recipe-tab view count;
- sessions exposed to at least one `ALMOST SOLVED` recipe;
- maximum traced/almost-solved counts observed in an Archive view.

As with the rest of the privacy-minimal telemetry, these are ephemeral-session engagement signals rather than cross-session identity/cohort metrics.

## Balance / retention rule

Do not add more recipes merely to increase collection totals before this hint layer is tested with real traffic. First determine whether players:

- open the Archive;
- enter the Recipe Book;
- accumulate partial traces;
- see almost-solved recipes;
- subsequently increase fusion usage / recipe discovery.

Only then should conditional or forbidden recipes expand beyond the current 24-recipe catalog.

## Validation

Automated coverage verifies:

- zero-known recipes stay locked;
- unknown items expose only shape silhouettes;
- partial recipes reveal known ingredient names plus structural missing clues, not the missing ID/result;
- all-known undiscovered recipes become `ALMOST SOLVED` without revealing their result;
- discovered recipes retain full recipe payload;
- stale save IDs do not affect progress;
- telemetry payloads are bounded to the 24-recipe catalog and reject extra identifying fields;
- summary/report aggregation remains stable for exports captured before Archive telemetry existed.

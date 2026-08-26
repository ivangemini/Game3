from pathlib import Path
from textwrap import dedent


def read(path: str) -> str:
    return Path(path).read_text(encoding='utf-8')


def write(path: str, content: str) -> None:
    Path(path).write_text(content, encoding='utf-8')


def replace_one(path: str, old: str, new: str) -> None:
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one match, found {count}: {old[:100]!r}')
    write(path, text.replace(old, new))


def replace_section(path: str, start: str, end: str, replacement: str) -> None:
    text = read(path)
    a = text.find(start)
    if a < 0:
        raise RuntimeError(f'{path}: missing section start {start!r}')
    b = text.find(end, a)
    if b < 0:
        raise RuntimeError(f'{path}: missing section end {end!r}')
    write(path, text[:a] + replacement + text[b:])


# save v9: optional bounded field keeps existing v9 saves valid.
replace_one(
    'src/persistence/save.ts',
    "  readonly revengePending: boolean;\n}\n\nexport interface SaveV9 {",
    "  readonly revengePending: boolean;\n  readonly challengeStars?: 0 | 1 | 2 | 3;\n}\n\nexport interface SaveV9 {",
)
replace_one(
    'src/persistence/save.ts',
    "    && isNonNegativeInteger(history.bestWinStreak)\n    && typeof history.revengePending === 'boolean';",
    "    && isNonNegativeInteger(history.bestWinStreak)\n    && typeof history.revengePending === 'boolean'\n    && (history.challengeStars === undefined || isIntegerInRange(history.challengeStars, 0, 3));",
)

# Runtime: evaluate only a valid boss victory, using the same build construction as combat.
replace_one(
    'src/game/scenes/PrototypeScene.ts',
    "import { PROTOTYPE_FUSION_RECIPES, SECOND_STAGE_FUSION_RECIPE_IDS } from '../data/fusionRecipes';",
    "import { PROTOTYPE_COMBAT_PROFILE_MAP } from '../data/combatProfiles';\nimport { PROTOTYPE_FUSION_RECIPES, SECOND_STAGE_FUSION_RECIPE_IDS } from '../data/fusionRecipes';",
)
replace_one(
    'src/game/scenes/PrototypeScene.ts',
    "import { BACKPACK_HEIGHT, BACKPACK_WIDTH, blockedCellsForPocketUnlockCount } from '../domain/backpackLayout';\nimport { recordBossOutcome } from '../domain/bossGrudges';",
    "import { BACKPACK_HEIGHT, BACKPACK_WIDTH, blockedCellsForPocketUnlockCount } from '../domain/backpackLayout';\nimport { evaluateBossMasteryChallenge } from '../domain/bossMasteryChallenges';\nimport { recordBossMasteryChallenge, recordBossOutcome } from '../domain/bossGrudges';\nimport { createCombatBuild } from '../domain/combatBuild';",
)
scene_block = dedent('''\
        if (currentMatches && current?.kind === 'boss') {
          const grudge = recordBossOutcome(save.bossHistory, current.enemy.id, outcome, combatDurationMs);
          if (grudge.tracked) {
            let nextBossHistory = grudge.history;
            if (outcome === 'victory') {
              const challengeInventory: InventoryState = {
                width: BACKPACK_WIDTH,
                height: BACKPACK_HEIGHT,
                blockedCells: [],
                items: board.getSnapshot().items,
              };
              const challengeBuild = createCombatBuild(
                challengeInventory,
                PROTOTYPE_ITEM_MAP,
                PROTOTYPE_COMBAT_PROFILE_MAP,
                PROTOTYPE_PERK_MAP,
                activeRun.selectedPerkIds,
                activeRun.heroId ? PROTOTYPE_HERO_MAP.get(activeRun.heroId) : undefined,
              );
              const challenge = evaluateBossMasteryChallenge(current.enemy.id, challengeBuild.items);
              if (challenge) {
                const mastery = recordBossMasteryChallenge(nextBossHistory, current.enemy.id, challenge.stars);
                nextBossHistory = mastery.history;
                if (mastery.improved) metaFeedback.bossMastery(challenge.bossId, mastery.bestStars);
              }
            }
            save = { ...save, bossHistory: nextBossHistory };
            if (grudge.revengeStarted) metaFeedback.grudge(current.title, false);
            if (grudge.revengeResolved) metaFeedback.grudge(current.title, true);
          }
        }
''')
# dedent above is for readability; restore class-method indentation.
scene_block = ''.join(('        ' + line if line.strip() else line) for line in scene_block.splitlines(keepends=True))
replace_section(
    'src/game/scenes/PrototypeScene.ts',
    "        if (currentMatches && current?.kind === 'boss') {\n",
    "        activeCombatStartedAtMs = null;\n",
    scene_block,
)

# Roadmap: R2 core closes here; recipe expansion remains explicitly evidence-gated.
replace_one(
    'ROADMAP.md',
    "## Current execution priority\n1. **Finish Retention Wave R2 mastery challenges:** add arrangement-specific Boss Mastery challenges on top of the now-live mastery/grudge history; the Archive silhouette/trace/almost-solved discovery layer is implemented and ready for real engagement measurement.\n2. **Retention Wave R3:** Weekly Challenge + personal weekly history/tiers; no backend leaderboard until real behavior justifies it.\n3. **Release acceptance:** physical-device presentation/performance review and real Yandex/CrazyGames tester compliance.\n4. Real traffic then decides whether the next investment is balance, additional gameplay content, social competition or another retention layer.",
    "## Current execution priority\n1. **Retention Wave R3:** Weekly Challenge + personal weekly history/tiers; no backend leaderboard until real behavior justifies it.\n2. **Release acceptance:** physical-device presentation/performance review and real Yandex/CrazyGames tester compliance.\n3. **R2 measurement:** use real Archive/fusion/mastery behavior to decide whether conditional/forbidden fusion content is justified.\n4. Real traffic then decides whether the next investment is balance, additional gameplay content, social competition or another retention layer.",
)
replace_one('ROADMAP.md', '### R2 — Mastery, revenge and discovery [IN PROGRESS]', '### R2 — Mastery, revenge and discovery [DONE]')
replace_one(
    'ROADMAP.md',
    '- [ ] **Boss Mastery challenges** across the six families: arrangement/counterplay goals tied to each boss rule, with multi-star completion tiers beyond the current history-derived foundation.',
    '- [x] **Boss Mastery challenges** across all six families: deterministic arrangement/counterplay goals tied to each boss rule, three persistent stars per family, rare upgrade feedback and a dedicated counterplay readout beside rivalry history.',
)
replace_one(
    'ROADMAP.md',
    '- [ ] Add conditional/forbidden fusion discoveries only after the current 24-recipe archive proves that hint-driven discovery increases replay intent.',
    '- [x] Conditional/forbidden fusion expansion is deliberately **deferred behind real engagement evidence** from the current 24-recipe Archive; no speculative recipe-count inflation is required to close R2.',
)
replace_one(
    'ROADMAP.md',
    '**R2 gate:** mastery, revenge and discovery breadcrumbs are implemented. The remaining authored R2 gameplay layer is arrangement-specific Boss Mastery challenges; conditional recipe expansion is deliberately gated on real Archive/fusion engagement data rather than content-count pressure.',
    '**R2 gate:** complete in code. Hero Mastery, revenge, six-family counterplay challenge stars and Archive discovery breadcrumbs are implemented without permanent power creep. Conditional recipe expansion remains an evidence-gated future content decision, not unfinished R2 scope.',
)

# System documentation: replace the old history-only placeholder with the implemented challenge contract.
replace_one(
    'docs/SYSTEMS/HERO_MASTERY_GRUDGES.md',
    '- whether revenge is pending.',
    '- whether revenge is pending;\n- optional best counterplay challenge stars (`0–3`) for backward-compatible save-v9 persistence.',
)
mastery_docs = dedent('''\
## Boss mastery: rivalry + counterplay

Boss mastery now has two deliberately separate three-step tracks on the same card:

- **Rivalry** remains derived from history: first victory, three total victories, then a best win streak of three.
- **Counterplay** is a persistent best-of-three challenge result evaluated only on a valid victory from the immutable combat build snapshot.

Counterplay stars are boss-specific and use the same deterministic concepts as each boss rule:

| Boss | Challenge | ★ | ★★ | ★★★ |
| --- | --- | --- | --- | --- |
| TV Tyrant | Signal Split | 3 active items / 3 rows | 4 / 4 | 5 / all 5 rows |
| Deadline Snail | No Single Deadline | 2 items within 25% of fastest trigger | 3 | 4 |
| Closet Monster | Anchor the Clutter | ≤2 loose items | ≤1 | 0 |
| Baby Moon | Family Diversification | dominant tag affects ≤4 items | ≤3 | ≤2 |
| Copycat Auditor | Original Receipts | largest duplicate group has ≤2 extra copies | ≤1 | 0 exact duplicates |
| Border Shark | Own the Center | ≤4 Edge Rent items | ≤2 | 0 |

The thresholds are nested, deterministic and evaluated against the locked fight-start layout/build, so frame rate, combat animation timing and post-fight UI input cannot alter the result. Corrupted-loop boss IDs map back to the same six family records.

The saved value is best-ever stars per family and never downgrades. A star upgrade gets one restrained authored mastery toast; repeated equal/lower clears do not spam feedback.

''')
replace_section(
    'docs/SYSTEMS/HERO_MASTERY_GRUDGES.md',
    '## Boss mastery tiers\n',
    '## Persistence and idempotence',
    mastery_docs,
)
replace_one(
    'docs/SYSTEMS/HERO_MASTERY_GRUDGES.md',
    'R1 already reserved `heroMasteryXp` and `bossHistory` in save v9, so R2 does not require another schema bump.',
    'R1 already reserved `heroMasteryXp` and `bossHistory` in save v9. Counterplay stars extend each boss-history record with an optional bounded `challengeStars` field, so existing v9 saves remain valid and default missing stars to zero without another schema bump.',
)
replace_one(
    'docs/SYSTEMS/HERO_MASTERY_GRUDGES.md',
    '- boss mastery tiers;\n- save-v9 persistence and malformed-state rejection;',
    '- rivalry mastery tiers;\n- all six deterministic counterplay challenge evaluators and corrupted-family mapping;\n- best-star monotonic persistence (no downgrade);\n- save-v9 challenge-star round trip and malformed-state rejection;',
)

# Successful application removes the one-shot integration machinery from the final tree.
Path('.github/scripts/apply_boss_mastery_integration.py').unlink(missing_ok=True)
Path('.github/workflows/boss-mastery-integration.yml').unlink(missing_ok=True)
print('boss mastery integration applied')

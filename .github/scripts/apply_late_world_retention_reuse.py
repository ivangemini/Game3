from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding='utf-8')
    if old not in text:
        raise RuntimeError(f'marker not found in {path}: {old[:100]!r}')
    file.write_text(text.replace(old, new, 1), encoding='utf-8')


# Daily: reuse the existing campaignWorlds metric so late-world goals need no new persistence fields.
replace_once(
    'src/game/domain/dailyRetention.ts',
    "  { id: 'world-3', archetype: 'world', metric: 'campaignWorlds', title: 'THREE-WORLD WARRANTY', description: 'Clear World 3 in today\\'s run.', target: 3 },\n  { id: 'score-1200', archetype: 'score', metric: 'score', title: 'NUMBER GO UP', description: 'Reach 1,200 run score.', target: 1200 },\n",
    "  { id: 'world-3', archetype: 'world', metric: 'campaignWorlds', title: 'THREE-WORLD WARRANTY', description: 'Clear World 3 in today\\'s run.', target: 3 },\n  { id: 'world-5', archetype: 'world', metric: 'campaignWorlds', title: 'PASS THE FINAL AUDIT', description: 'Clear World 5 / Duplicate District in today\\'s Daily Run.', target: 5 },\n  { id: 'world-6', archetype: 'world', metric: 'campaignWorlds', title: 'PAY NO BORDER RENT', description: 'Clear World 6 / Perimeter District in today\\'s Daily Run.', target: 6 },\n  { id: 'score-1200', archetype: 'score', metric: 'score', title: 'NUMBER GO UP', description: 'Reach 1,200 run score.', target: 1200 },\n",
)

# Weekly: every existing fixed loadout gets one explicit late-world counterplay focus.
replace_once(
    'src/game/domain/weeklyChallenge.ts',
    "export type WeeklyTier = 'none' | 'bronze' | 'silver' | 'gold' | 'reality-broken';\nexport type WeeklyRewardKind = 'sticker' | 'title' | 'frame' | 'vfx';\n",
    "export type WeeklyTier = 'none' | 'bronze' | 'silver' | 'gold' | 'reality-broken';\nexport type WeeklyRewardKind = 'sticker' | 'title' | 'frame' | 'vfx';\nexport type WeeklyLateWorldFocusId = 'duplicate-district' | 'perimeter-district';\n",
)
replace_once(
    'src/game/domain/weeklyChallenge.ts',
    "  readonly heroId: HeroId;\n  readonly startingPerkId: string;\n}\n",
    "  readonly heroId: HeroId;\n  readonly startingPerkId: string;\n  readonly lateWorldFocus: WeeklyLateWorldFocusId;\n}\n\nexport interface WeeklyLateWorldFocusDefinition {\n  readonly id: WeeklyLateWorldFocusId;\n  readonly world: 5 | 6;\n  readonly name: string;\n  readonly kicker: string;\n  readonly description: string;\n}\n",
)
replace_once(
    'src/game/domain/weeklyChallenge.ts',
    "export const WEEKLY_LOADOUTS: readonly WeeklyLoadoutConstraint[] = [\n",
    "export const WEEKLY_LATE_WORLD_FOCUSES: Readonly<Record<WeeklyLateWorldFocusId, WeeklyLateWorldFocusDefinition>> = {\n  'duplicate-district': {\n    id: 'duplicate-district',\n    world: 5,\n    name: 'Duplicate Discipline',\n    kicker: 'WORLD 5 • FINAL AUDIT IS WATCHING',\n    description: 'Avoid leaning on exact duplicate stacks before Copycat Auditor escalates. Shield is the fallback, not the plan.',\n  },\n  'perimeter-district': {\n    id: 'perimeter-district',\n    world: 6,\n    name: 'Centerline Discipline',\n    kicker: 'WORLD 6 • BORDER LOCKDOWN IS COMING',\n    description: 'Keep valuable junk off the outer backpack cells before Border Shark escalates. Shield can soften mistakes.',\n  },\n};\n\nexport const WEEKLY_LOADOUTS: readonly WeeklyLoadoutConstraint[] = [\n",
)

focus_by_id = {
    'salvage-plating': 'perimeter-district',
    'engineer-overclock': 'duplicate-district',
    'toxic-warranty': 'perimeter-district',
    'pet-laser-license': 'duplicate-district',
    'salvage-bad-idea': 'duplicate-district',
    'signal-engineer': 'perimeter-district',
    'slime-alchemist': 'perimeter-district',
    'catnip-beastfriend': 'duplicate-district',
}
for constraint_id, focus in focus_by_id.items():
    path = Path('src/game/domain/weeklyChallenge.ts')
    text = path.read_text(encoding='utf-8')
    marker = f"    id: '{constraint_id}',"
    start = text.find(marker)
    if start < 0:
        raise RuntimeError(f'missing weekly loadout {constraint_id}')
    hero_line = "startingPerkId:"
    perk_pos = text.find(hero_line, start)
    line_end = text.find('\n', perk_pos)
    if perk_pos < 0 or line_end < 0:
        raise RuntimeError(f'missing perk line for {constraint_id}')
    line = text[perk_pos:line_end]
    if 'lateWorldFocus' in text[start:line_end + 100]:
        continue
    # Existing loadouts keep hero/perk IDs and order, so saved Weekly history remains valid.
    text = text[:line_end] + f"\n    lateWorldFocus: '{focus}'," + text[line_end:]
    path.write_text(text, encoding='utf-8')

replace_once(
    'src/game/domain/weeklyChallenge.ts',
    "export function weeklyChallengeForKey(key: string): WeeklyChallengeDefinition {\n",
    "export function weeklyLateWorldFocusForConstraint(\n  constraint: WeeklyLoadoutConstraint,\n): WeeklyLateWorldFocusDefinition {\n  return WEEKLY_LATE_WORLD_FOCUSES[constraint.lateWorldFocus];\n}\n\nexport function weeklyChallengeForKey(key: string): WeeklyChallengeDefinition {\n",
)

# Weekly board presents the late-world mastery target as part of the standardized challenge brief.
replace_once(
    'src/game/ui/WeeklyChallengeOverlay.ts',
    "import { weeklyAttemptsBucket, weeklyTierRank, type WeeklyBoardSnapshot, type WeeklyTier } from '../domain/weeklyChallenge';\n",
    "import { weeklyAttemptsBucket, weeklyLateWorldFocusForConstraint, weeklyTierRank, type WeeklyBoardSnapshot, type WeeklyTier } from '../domain/weeklyChallenge';\n",
)
replace_once(
    'src/game/ui/WeeklyChallengeOverlay.ts',
    "    const hero = PROTOTYPE_HERO_MAP.get(c.heroId);\n    const perk = PROTOTYPE_PERK_MAP.get(c.startingPerkId);\n    const y = 160;\n",
    "    const hero = PROTOTYPE_HERO_MAP.get(c.heroId);\n    const perk = PROTOTYPE_PERK_MAP.get(c.startingPerkId);\n    const focus = weeklyLateWorldFocusForConstraint(c);\n    const y = 160;\n",
)
replace_once(
    'src/game/ui/WeeklyChallengeOverlay.ts',
    "    this.content.add(this.scene.add.text(1010, y + 115, 'No permanent combat bonuses. Everyone gets the same seed and loadout this week.', {\n      fontSize: '10px', color: '#938c80', wordWrap: { width: 430 },\n    }));\n",
    "    this.content.add(this.scene.add.text(1010, y + 108, `WORLD ${focus.world} FOCUS • ${focus.name.toUpperCase()}`, {\n      fontSize: '10px', color: focus.world === 5 ? '#ffb27a' : '#8ceeff', fontStyle: 'bold', wordWrap: { width: 430 },\n    }));\n    this.content.add(this.scene.add.text(1010, y + 130, focus.description, {\n      fontSize: '9px', color: '#b5afaa', wordWrap: { width: 430 },\n    }));\n    this.content.add(this.scene.add.text(1010, y + 160, 'Same seed/loadout • no permanent combat bonus.', {\n      fontSize: '9px', color: '#746f68',\n    }));\n",
)

# Regression coverage.
replace_once(
    'tests/weeklyChallenge.test.ts',
    "  WEEKLY_HISTORY_LIMIT,\n",
    "  WEEKLY_HISTORY_LIMIT,\n  WEEKLY_LOADOUTS,\n",
)
replace_once(
    'tests/weeklyChallenge.test.ts',
    "  weeklyKeyFromSeed,\n",
    "  weeklyKeyFromSeed,\n  weeklyLateWorldFocusForConstraint,\n",
)
replace_once(
    'tests/weeklyChallenge.test.ts',
    "    expect(first.constraint.startingPerkId.length).toBeGreaterThan(0);\n  });\n",
    "    expect(first.constraint.startingPerkId.length).toBeGreaterThan(0);\n    expect(['duplicate-district', 'perimeter-district']).toContain(first.constraint.lateWorldFocus);\n  });\n\n  it('reuses both late-world counterplay families across the fixed Weekly loadout pool', () => {\n    const focuses = WEEKLY_LOADOUTS.map((constraint) => weeklyLateWorldFocusForConstraint(constraint));\n    expect(focuses.filter((focus) => focus.world === 5)).toHaveLength(4);\n    expect(focuses.filter((focus) => focus.world === 6)).toHaveLength(4);\n    expect(new Set(focuses.map((focus) => focus.id))).toEqual(new Set(['duplicate-district', 'perimeter-district']));\n  });\n",
)

replace_once(
    'tests/dailyRetention.test.ts',
    "    expect(nextDay.map((contract) => contract.id)).not.toEqual(first.map((contract) => contract.id));\n  });\n",
    "    expect(nextDay.map((contract) => contract.id)).not.toEqual(first.map((contract) => contract.id));\n  });\n\n  it('rotates deep-campaign World 5/6 goals into the Daily progression pool without new counters', () => {\n    const templateIds = new Set<string>();\n    const start = Date.UTC(2026, 0, 1);\n    for (let offset = 0; offset < 366; offset += 1) {\n      const key = new Date(start + offset * 86_400_000).toISOString().slice(0, 10);\n      templateIds.add(generateDailyContracts(key)[0]!.templateId);\n    }\n    expect(templateIds).toContain('world-5');\n    expect(templateIds).toContain('world-6');\n  });\n",
)

# System docs.
late_doc = Path('docs/SYSTEMS/LATE_WORLD_IDENTITY.md')
late_text = late_doc.read_text(encoding='utf-8')
marker = "## Snapshot contract\n"
section = """## Retention reuse\n\nLate-world mechanics also feed the existing retention surfaces instead of remaining one-off campaign content:\n\n- Daily progression contracts can now roll **PASS THE FINAL AUDIT** (clear World 5) or **PAY NO BORDER RENT** (clear World 6). They reuse the existing `campaignWorlds` metric, so there is no save migration or extra counter.\n- Every Weekly fixed loadout now carries one deterministic late-world focus: **Duplicate Discipline** for World 5 or **Centerline Discipline** for World 6. The board explains the relevant Final Audit / Border Lockdown counter before the run starts.\n- The eight launch Weekly loadouts are split 4/4 between the two focuses while keeping their existing hero/perk IDs and ordering, preserving old Weekly history validation.\n\nThese goals do not add combat power or bonus currency; they make the same six-world mechanics serve campaign mastery, Daily completion and Weekly planning.\n\n"""
if marker not in late_text:
    raise RuntimeError('late-world retention doc marker changed')
late_doc.write_text(late_text.replace(marker, section + marker, 1), encoding='utf-8')

weekly_doc = Path('docs/SYSTEMS/WEEKLY_CHALLENGE.md')
weekly_text = weekly_doc.read_text(encoding='utf-8')
marker = "A Weekly attempt starts with this fixed hero/perk instead of opening Hero Choice. The run then follows the same deterministic campaign pipeline as Standard/Daily play. Hero starting-coin bonuses are still applied so the authored hero contract is preserved.\n"
addition = marker + "\nEach fixed loadout also carries a deterministic late-world focus shown on the Weekly Board. Four loadouts point at World 5 **Duplicate Discipline** (prepare for Final Audit) and four point at World 6 **Centerline Discipline** (prepare for Border Lockdown). This is a planning/mastery goal only: it does not change score math, rewards, save history fields or combat stats.\n"
if marker not in weekly_text:
    raise RuntimeError('weekly doc loadout marker changed')
weekly_doc.write_text(weekly_text.replace(marker, addition, 1), encoding='utf-8')

replace_once(
    'ROADMAP.md',
    '- [ ] Feed new late-world mechanics into Daily Contract / Weekly Challenge archetypes so gameplay additions multiply retention content instead of becoming isolated one-off encounters.\n',
    '- [x] Feed late-world mechanics into retention (**Daily progression pool now includes World 5/6 clear contracts via existing campaign-world progress; all 8 Weekly loadouts expose a deterministic 4/4 Duplicate Discipline vs Centerline Discipline focus without new power or save fields**).\n',
)
replace_once(
    'ROADMAP.md',
    '**Parallel-lane rule:** core late-world identity is complete. Remaining items are optional multipliers and should not displace R2 discovery/R3 unless real six-world data identifies a late-campaign problem.\n',
    '**Parallel-lane rule:** complete in code. Worlds 5–6 now teach, flavor, escalate and reappear in Daily/Weekly planning without adding campaign length or permanent power. Further late-world expansion is evidence-gated behind real six-world traffic.\n',
)

print('late-world retention reuse applied')

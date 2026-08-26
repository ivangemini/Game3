from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding='utf-8')
    if old not in text:
        raise RuntimeError(f'marker not found in {path}: {old[:80]!r}')
    file.write_text(text.replace(old, new, 1), encoding='utf-8')


# Domain: optional authored world affinity + deterministic weighted selection.
replace_once(
    'src/game/domain/runEvents.ts',
    "export interface RunEventDefinition {\n  readonly id: string;\n  readonly title: string;\n  readonly body: string;\n  readonly choices: readonly RunEventChoice[];\n}\n",
    "export interface RunEventDefinition {\n  readonly id: string;\n  readonly title: string;\n  readonly body: string;\n  readonly choices: readonly RunEventChoice[];\n  readonly preferredWorlds?: readonly number[];\n}\n",
)
replace_once(
    'src/game/domain/runEvents.ts',
    "export function selectRunEvent(\n  events: readonly RunEventDefinition[],\n  runSeed: string | number,\n  eventIndex: number,\n  previousEventId?: string | null,\n): RunEventDefinition {\n  if (events.length === 0) throw new RangeError('Cannot select from an empty run-event pool');\n  const safeIndex = Math.max(0, Math.floor(eventIndex));\n  const ordered = [...events].sort((a, b) => a.id.localeCompare(b.id));\n  const eligible = ordered.length > 1 && previousEventId\n    ? ordered.filter((event) => event.id !== previousEventId)\n    : ordered;\n  return createSeededRng(`${String(runSeed)}:event:${safeIndex}`).pick(eligible);\n}\n",
    "export const PREFERRED_WORLD_EVENT_WEIGHT = 3;\n\nexport function runEventSelectionWeight(event: RunEventDefinition, world?: number): number {\n  if (typeof world !== 'number' || !Number.isFinite(world)) return 1;\n  const safeWorld = Math.max(1, Math.floor(world));\n  return event.preferredWorlds?.includes(safeWorld) ? PREFERRED_WORLD_EVENT_WEIGHT : 1;\n}\n\nexport function selectRunEvent(\n  events: readonly RunEventDefinition[],\n  runSeed: string | number,\n  eventIndex: number,\n  previousEventId?: string | null,\n  world?: number,\n): RunEventDefinition {\n  if (events.length === 0) throw new RangeError('Cannot select from an empty run-event pool');\n  const safeIndex = Math.max(0, Math.floor(eventIndex));\n  const ordered = [...events].sort((a, b) => a.id.localeCompare(b.id));\n  const eligible = ordered.length > 1 && previousEventId\n    ? ordered.filter((event) => event.id !== previousEventId)\n    : ordered;\n  const weighted = eligible.flatMap((event) =>\n    Array.from({ length: runEventSelectionWeight(event, world) }, () => event),\n  );\n  return createSeededRng(`${String(runSeed)}:event:${safeIndex}`).pick(weighted);\n}\n",
)

# Authored affinities: World 5 = audit/bureaucracy, World 6 = outer-district infrastructure.
for path, event_id, worlds in [
    ('src/game/data/runEvents.ts', 'duck-tax-office', '[5]'),
    ('src/game/data/runEvents.wave5.ts', 'banana-compliance-desk', '[5]'),
    ('src/game/data/runEvents.wave5.ts', 'forbidden-printer-support', '[5]'),
    ('src/game/data/runEvents.wave4.ts', 'pigeon-signal-tower', '[6]'),
    ('src/game/data/runEvents.wave5.ts', 'taxidermy-wifi-cafe', '[6]'),
    ('src/game/data/runEvents.wave5.ts', 'moon-laundromat', '[6]'),
]:
    replace_once(
        path,
        f"    id: '{event_id}',\n",
        f"    id: '{event_id}',\n    preferredWorlds: {worlds},\n",
    )

# Scene passes the authored campaign world into event selection. Persisted pendingEventId remains source of truth on reload.
replace_once(
    'src/game/scenes/PrototypeScene.ts',
    "          scheduledEventId = selectRunEvent(PROTOTYPE_RUN_EVENTS, activeRun.runSeed, activeRun.eventIndex, previousEventId).id;\n",
    "          scheduledEventId = selectRunEvent(\n            PROTOTYPE_RUN_EVENTS,\n            activeRun.runSeed,\n            activeRun.eventIndex,\n            previousEventId,\n            current.world,\n          ).id;\n",
)

# Tests: affinity integrity, stable baseline behavior, deterministic weighted behavior and repeat protection.
replace_once(
    'tests/runEvents.test.ts',
    "import { resolveRunEventChoice, selectRunEvent } from '../src/game/domain/runEvents';\n",
    "import { PREFERRED_WORLD_EVENT_WEIGHT, resolveRunEventChoice, runEventSelectionWeight, selectRunEvent } from '../src/game/domain/runEvents';\n",
)
replace_once(
    'tests/runEvents.test.ts',
    "    for (const event of PROTOTYPE_RUN_EVENTS) {\n      expect(event.choices.length).toBeGreaterThanOrEqual(2);\n",
    "    for (const event of PROTOTYPE_RUN_EVENTS) {\n      expect(event.choices.length).toBeGreaterThanOrEqual(2);\n      if (event.preferredWorlds) {\n        expect(new Set(event.preferredWorlds).size).toBe(event.preferredWorlds.length);\n        expect(event.preferredWorlds.every((world) => world === 5 || world === 6)).toBe(true);\n      }\n",
)
replace_once(
    'tests/runEvents.test.ts',
    "  it('avoids immediately repeating the previous event when alternatives exist', () => {\n    const previous = selectRunEvent(PROTOTYPE_RUN_EVENTS, 'repeat-seed', 0);\n    const next = selectRunEvent(PROTOTYPE_RUN_EVENTS, 'repeat-seed', 1, previous.id);\n    expect(next.id).not.toBe(previous.id);\n  });\n",
    "  it('avoids immediately repeating the previous event when alternatives exist', () => {\n    const previous = selectRunEvent(PROTOTYPE_RUN_EVENTS, 'repeat-seed', 0);\n    const next = selectRunEvent(PROTOTYPE_RUN_EVENTS, 'repeat-seed', 1, previous.id);\n    expect(next.id).not.toBe(previous.id);\n  });\n\n  it('weights only authored World 5/6 event affinities', () => {\n    const world5Ids = PROTOTYPE_RUN_EVENTS\n      .filter((event) => event.preferredWorlds?.includes(5))\n      .map((event) => event.id)\n      .sort();\n    const world6Ids = PROTOTYPE_RUN_EVENTS\n      .filter((event) => event.preferredWorlds?.includes(6))\n      .map((event) => event.id)\n      .sort();\n\n    expect(world5Ids).toEqual(['banana-compliance-desk', 'duck-tax-office', 'forbidden-printer-support']);\n    expect(world6Ids).toEqual(['moon-laundromat', 'pigeon-signal-tower', 'taxidermy-wifi-cafe']);\n\n    const audit = PROTOTYPE_RUN_EVENTS.find((event) => event.id === 'duck-tax-office');\n    const perimeter = PROTOTYPE_RUN_EVENTS.find((event) => event.id === 'pigeon-signal-tower');\n    if (!audit || !perimeter) throw new Error('Missing late-world affinity fixture');\n    expect(runEventSelectionWeight(audit, 5)).toBe(PREFERRED_WORLD_EVENT_WEIGHT);\n    expect(runEventSelectionWeight(audit, 6)).toBe(1);\n    expect(runEventSelectionWeight(perimeter, 6)).toBe(PREFERRED_WORLD_EVENT_WEIGHT);\n    expect(runEventSelectionWeight(perimeter, 4)).toBe(1);\n  });\n\n  it('keeps late-world weighted selection deterministic and repeat-safe', () => {\n    const first = selectRunEvent(PROTOTYPE_RUN_EVENTS, 'late-affinity-seed', 4, null, 5);\n    const reordered = selectRunEvent([...PROTOTYPE_RUN_EVENTS].reverse(), 'late-affinity-seed', 4, null, 5);\n    expect(reordered.id).toBe(first.id);\n\n    const next = selectRunEvent(PROTOTYPE_RUN_EVENTS, 'late-affinity-seed', 5, first.id, 5);\n    expect(next.id).not.toBe(first.id);\n  });\n\n  it('preserves unweighted event selection outside affinity worlds', () => {\n    const baseline = selectRunEvent(PROTOTYPE_RUN_EVENTS, 'baseline-event-seed', 7);\n    const earlyWorld = selectRunEvent(PROTOTYPE_RUN_EVENTS, 'baseline-event-seed', 7, null, 3);\n    expect(earlyWorld.id).toBe(baseline.id);\n  });\n",
)

# Documentation + roadmap closure for this parallel-lane item.
doc_path = Path('docs/SYSTEMS/LATE_WORLD_IDENTITY.md')
doc = doc_path.read_text(encoding='utf-8')
marker = "## Snapshot contract\n"
section = """## Event affinity\n\nThe strange-event pool remains the same **15 authored events**. Campaign Worlds 5–6 now bias selection toward existing events whose fiction reinforces the district the player is in, instead of adding bespoke one-off encounters or increasing run length.\n\n- **World 5 / Duplicate District:** `Duck Tax Office`, `Banana Compliance Desk`, `Forbidden Printer Support`.\n- **World 6 / Perimeter District:** `Pigeon Signal Tower`, `Taxidermy Wi-Fi Cafe`, `Emergency Moon Laundromat`.\n\nEach preferred event has selection weight **3** versus **1** for a generic event. Immediate-repeat prevention is applied before weighting. Worlds 1–4 keep the original unweighted selection behavior. Corrupted Loop worlds remain unweighted because their local world indices are 1–4 and their identity already comes from stacked mutations/anomalies.\n\nSelection still uses the existing seeded `runSeed + eventIndex` RNG and persists only the chosen `pendingEventId`. Therefore reloading cannot reroll the event or change its outcome. The feature changes flavor frequency, not rewards, event count, save schema or campaign duration.\n\n"""
if marker not in doc:
    raise RuntimeError('late-world doc marker changed')
doc_path.write_text(doc.replace(marker, section + marker, 1), encoding='utf-8')

replace_once(
    'ROADMAP.md',
    '- [ ] Add world-specific event weighting/flavor where it increases campaign identity while preserving deterministic reload behavior.\n',
    '- [x] Add world-specific event weighting/flavor (**World 5 biases audit/bureaucracy events; World 6 biases outer-district infrastructure events at 3× weight; event count/rewards/save schema stay unchanged and pending event IDs remain reload-stable**).\n',
)

print('late-world event affinity applied')

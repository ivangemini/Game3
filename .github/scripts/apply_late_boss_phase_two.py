from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding='utf-8')
    if old not in text:
        raise RuntimeError(f'marker not found in {path}: {old[:100]!r}')
    file.write_text(text.replace(old, new, 1), encoding='utf-8')


# Boss definitions gain a clearly bounded second-cycle escalation without changing target semantics.
replace_once(
    'src/game/domain/bossCombat.ts',
    "export interface DuplicateDebtDefinition {\n  readonly intervalMs: number;\n  readonly telegraphMs: number;\n  readonly damagePerExtraCopy: number;\n}\n\nexport interface EdgeRentDefinition {\n  readonly intervalMs: number;\n  readonly telegraphMs: number;\n  readonly damagePerEdgeItem: number;\n}\n",
    "export interface DuplicateDebtDefinition {\n  readonly intervalMs: number;\n  readonly telegraphMs: number;\n  readonly damagePerExtraCopy: number;\n  readonly phaseTwoStartsAtCycle: number;\n  readonly phaseTwoDamagePerExtraCopy: number;\n}\n\nexport interface EdgeRentDefinition {\n  readonly intervalMs: number;\n  readonly telegraphMs: number;\n  readonly damagePerEdgeItem: number;\n  readonly phaseTwoStartsAtCycle: number;\n  readonly phaseTwoDamagePerEdgeItem: number;\n}\n",
)
replace_once(
    'src/game/domain/bossCombat.ts',
    "      readonly copyCount: number;\n      readonly extraCopyCount: number;\n    }\n  | {\n      readonly kind: 'boss-duplicate-impact';\n",
    "      readonly copyCount: number;\n      readonly extraCopyCount: number;\n      readonly phase?: 1 | 2;\n      readonly damagePerExtraCopy?: number;\n    }\n  | {\n      readonly kind: 'boss-duplicate-impact';\n",
)
replace_once(
    'src/game/domain/bossCombat.ts',
    "      readonly extraCopyCount: number;\n      readonly damagePerExtraCopy: number;\n      readonly totalDamage: number;\n",
    "      readonly extraCopyCount: number;\n      readonly damagePerExtraCopy: number;\n      readonly phase?: 1 | 2;\n      readonly totalDamage: number;\n",
)
replace_once(
    'src/game/domain/bossCombat.ts',
    "      readonly impactAtMs: number;\n      readonly affectedItemCount: number;\n    }\n  | {\n      readonly kind: 'boss-edge-impact';\n",
    "      readonly impactAtMs: number;\n      readonly affectedItemCount: number;\n      readonly phase?: 1 | 2;\n      readonly damagePerEdgeItem?: number;\n    }\n  | {\n      readonly kind: 'boss-edge-impact';\n",
)
replace_once(
    'src/game/domain/bossCombat.ts',
    "      readonly affectedItemCount: number;\n      readonly damagePerEdgeItem: number;\n      readonly totalDamage: number;\n",
    "      readonly affectedItemCount: number;\n      readonly damagePerEdgeItem: number;\n      readonly phase?: 1 | 2;\n      readonly totalDamage: number;\n",
)
replace_once(
    'src/game/domain/bossCombat.ts',
    "const COPYCAT_AUDITOR_BASE_RULE: DuplicateDebtDefinition = {\n  intervalMs: 5600,\n  telegraphMs: 1100,\n  damagePerExtraCopy: 4,\n};\n\nconst BORDER_SHARK_BASE_RULE: EdgeRentDefinition = {\n  intervalMs: 6500,\n  telegraphMs: 1300,\n  damagePerEdgeItem: 2,\n};\n",
    "const COPYCAT_AUDITOR_BASE_RULE: DuplicateDebtDefinition = {\n  intervalMs: 5600,\n  telegraphMs: 1100,\n  damagePerExtraCopy: 4,\n  phaseTwoStartsAtCycle: 2,\n  phaseTwoDamagePerExtraCopy: 6,\n};\n\nconst BORDER_SHARK_BASE_RULE: EdgeRentDefinition = {\n  intervalMs: 6500,\n  telegraphMs: 1300,\n  damagePerEdgeItem: 2,\n  phaseTwoStartsAtCycle: 2,\n  phaseTwoDamagePerEdgeItem: 3,\n};\n",
)

# Duplicate Debt telegraphs and impacts use the same cycle-derived phase, preventing surprise escalation between tell and hit.
replace_once(
    'src/game/domain/bossCombat.ts',
    "    const target = duplicateDebtTarget(setup.items);\n    const definitionId = target?.definitionId ?? null;\n    const itemInstanceIds = target?.itemInstanceIds ?? [];\n    const copyCount = target?.copyCount ?? 0;\n    const extraCopyCount = target?.extraCopyCount ?? 0;\n\n    if (boundary.kind === 'telegraph') {\n",
    "    const target = duplicateDebtTarget(setup.items);\n    const definitionId = target?.definitionId ?? null;\n    const itemInstanceIds = target?.itemInstanceIds ?? [];\n    const copyCount = target?.copyCount ?? 0;\n    const extraCopyCount = target?.extraCopyCount ?? 0;\n    const phase: 1 | 2 = boundary.cycle >= rule.phaseTwoStartsAtCycle ? 2 : 1;\n    const damagePerExtraCopy = phase === 2 ? rule.phaseTwoDamagePerExtraCopy : rule.damagePerExtraCopy;\n\n    if (boundary.kind === 'telegraph') {\n",
)
replace_once(
    'src/game/domain/bossCombat.ts',
    "        copyCount,\n        extraCopyCount,\n      });\n      continue;\n    }\n\n    const incoming = extraCopyCount * rule.damagePerExtraCopy;\n",
    "        copyCount,\n        extraCopyCount,\n        phase,\n        damagePerExtraCopy,\n      });\n      continue;\n    }\n\n    const incoming = extraCopyCount * damagePerExtraCopy;\n",
)
replace_once(
    'src/game/domain/bossCombat.ts',
    "      copyCount,\n      extraCopyCount,\n      damagePerExtraCopy: rule.damagePerExtraCopy,\n      totalDamage: incoming,\n",
    "      copyCount,\n      extraCopyCount,\n      damagePerExtraCopy,\n      phase,\n      totalDamage: incoming,\n",
)

# Edge Rent follows the same explicit cycle-phase contract.
replace_once(
    'src/game/domain/bossCombat.ts',
    "    const edgeIds = edgeRentItems(setup.items).map((item) => item.instanceId);\n    if (boundary.kind === 'telegraph') {\n",
    "    const edgeIds = edgeRentItems(setup.items).map((item) => item.instanceId);\n    const phase: 1 | 2 = boundary.cycle >= rule.phaseTwoStartsAtCycle ? 2 : 1;\n    const damagePerEdgeItem = phase === 2 ? rule.phaseTwoDamagePerEdgeItem : rule.damagePerEdgeItem;\n    if (boundary.kind === 'telegraph') {\n",
)
replace_once(
    'src/game/domain/bossCombat.ts',
    "        impactAtMs: boundary.impactAtMs,\n        affectedItemCount: edgeIds.length,\n      });\n      continue;\n    }\n\n    const incoming = edgeIds.length * rule.damagePerEdgeItem;\n",
    "        impactAtMs: boundary.impactAtMs,\n        affectedItemCount: edgeIds.length,\n        phase,\n        damagePerEdgeItem,\n      });\n      continue;\n    }\n\n    const incoming = edgeIds.length * damagePerEdgeItem;\n",
)
replace_once(
    'src/game/domain/bossCombat.ts',
    "      affectedItemCount: edgeIds.length,\n      damagePerEdgeItem: rule.damagePerEdgeItem,\n      totalDamage: incoming,\n",
    "      affectedItemCount: edgeIds.length,\n      damagePerEdgeItem,\n      phase,\n      totalDamage: incoming,\n",
)

# Boundaries expose their deterministic cycle number to phase logic.
replace_once(
    'src/game/domain/bossCombat.ts',
    "interface BossBoundary {\n  readonly kind: 'telegraph' | 'impact';\n  readonly atMs: number;\n  readonly impactAtMs: number;\n}\n",
    "interface BossBoundary {\n  readonly kind: 'telegraph' | 'impact';\n  readonly atMs: number;\n  readonly impactAtMs: number;\n  readonly cycle: number;\n}\n",
)
replace_once(
    'src/game/domain/bossCombat.ts',
    "      boundaries.push({ kind: 'telegraph', atMs: telegraphAtMs, impactAtMs });\n",
    "      boundaries.push({ kind: 'telegraph', atMs: telegraphAtMs, impactAtMs, cycle });\n",
)
replace_once(
    'src/game/domain/bossCombat.ts',
    "      boundaries.push({ kind: 'impact', atMs: impactAtMs, impactAtMs });\n",
    "      boundaries.push({ kind: 'impact', atMs: impactAtMs, impactAtMs, cycle });\n",
)

# Presentation clearly names phase two and communicates the increased per-item price before impact.
replace_once(
    'src/game/ui/CombatPanel.ts',
    "        this.bossStatusText.setText(`DUPLICATE DEBT → ${label} • IMPACT IN ${((event.impactAtMs - event.atMs) / 1000).toFixed(1)}s`);\n        this.showBackpackItems(event.itemInstanceIds, 0xffb86b, Math.max(120, event.impactAtMs - event.atMs), true);\n        this.pushLog(`${this.seconds(event.atMs)} • auditor finds ${event.extraCopyCount} duplicate debt`);\n",
    "        const phaseLabel = event.phase === 2 ? 'FINAL AUDIT' : 'DUPLICATE DEBT';\n        const rate = event.damagePerExtraCopy ?? 4;\n        this.bossStatusText.setText(`${phaseLabel} → ${label} • ${rate}/EXTRA • IMPACT IN ${((event.impactAtMs - event.atMs) / 1000).toFixed(1)}s`);\n        this.showBackpackItems(event.itemInstanceIds, event.phase === 2 ? 0xff785b : 0xffb86b, Math.max(120, event.impactAtMs - event.atMs), true);\n        this.pushLog(`${this.seconds(event.atMs)} • ${event.phase === 2 ? 'FINAL AUDIT' : 'auditor'} finds ${event.extraCopyCount} duplicate debt`);\n",
)
replace_once(
    'src/game/ui/CombatPanel.ts',
    "      this.bossStatusText.setText(`DUPLICATE DEBT → ${event.totalDamage} fine • ${event.absorbedByShield} shielded`);\n",
    "      this.bossStatusText.setText(`${event.phase === 2 ? 'FINAL AUDIT' : 'DUPLICATE DEBT'} → ${event.totalDamage} fine • ${event.absorbedByShield} shielded`);\n",
)
replace_once(
    'src/game/ui/CombatPanel.ts',
    "        this.bossStatusText.setText(`EDGE RENT → ${label} • IMPACT IN ${((event.impactAtMs - event.atMs) / 1000).toFixed(1)}s`);\n        this.showBackpackItems(event.itemInstanceIds, 0x6be7ff, Math.max(120, event.impactAtMs - event.atMs), true);\n        this.pushLog(`${this.seconds(event.atMs)} • shark rents ${event.affectedItemCount} edge items`);\n",
    "        const phaseLabel = event.phase === 2 ? 'BORDER LOCKDOWN' : 'EDGE RENT';\n        const rate = event.damagePerEdgeItem ?? 2;\n        this.bossStatusText.setText(`${phaseLabel} → ${label} • ${rate}/EDGE • IMPACT IN ${((event.impactAtMs - event.atMs) / 1000).toFixed(1)}s`);\n        this.showBackpackItems(event.itemInstanceIds, event.phase === 2 ? 0x2fc8ff : 0x6be7ff, Math.max(120, event.impactAtMs - event.atMs), true);\n        this.pushLog(`${this.seconds(event.atMs)} • ${event.phase === 2 ? 'BORDER LOCKDOWN' : 'shark'} rents ${event.affectedItemCount} edge items`);\n",
)
replace_once(
    'src/game/ui/CombatPanel.ts',
    "      this.bossStatusText.setText(`EDGE RENT → ${event.totalDamage} rent • ${event.absorbedByShield} shielded`);\n",
    "      this.bossStatusText.setText(`${event.phase === 2 ? 'BORDER LOCKDOWN' : 'EDGE RENT'} → ${event.totalDamage} rent • ${event.absorbedByShield} shielded`);\n",
)

# Existing first-cycle expectations become explicit, plus second-cycle escalation tests.
test = Path('tests/loopBossFamilies.test.ts')
text = test.read_text(encoding='utf-8')
text = text.replace(
    "      copyCount: 3,\n      extraCopyCount: 2,\n    });\n",
    "      copyCount: 3,\n      extraCopyCount: 2,\n      phase: 1,\n      damagePerExtraCopy: 4,\n    });\n",
    1,
)
text = text.replace(
    "      extraCopyCount: 2,\n      damagePerExtraCopy: 4,\n      totalDamage: 8,\n",
    "      extraCopyCount: 2,\n      damagePerExtraCopy: 4,\n      phase: 1,\n      totalDamage: 8,\n",
    1,
)
text = text.replace(
    "      extraCopyCount: 0,\n      damagePerExtraCopy: 4,\n      totalDamage: 0,\n",
    "      extraCopyCount: 0,\n      damagePerExtraCopy: 4,\n      phase: 1,\n      totalDamage: 0,\n",
    1,
)
text = text.replace(
    "      impactAtMs: 6500,\n      affectedItemCount: 3,\n    });\n",
    "      impactAtMs: 6500,\n      affectedItemCount: 3,\n      phase: 1,\n      damagePerEdgeItem: 2,\n    });\n",
    1,
)
text = text.replace(
    "      affectedItemCount: 3,\n      damagePerEdgeItem: 2,\n      totalDamage: 6,\n",
    "      affectedItemCount: 3,\n      damagePerEdgeItem: 2,\n      phase: 1,\n      totalDamage: 6,\n",
    1,
)
marker = "  it('keeps both new boss clocks invariant to render/update chunk size', () => {\n"
insert = """  it('escalates Copycat Auditor from Duplicate Debt to a telegraphed Final Audit on cycle two', () => {
    const setup = duplicateSetup();
    const result = advanceCombatWithBossRules(createCombatState(setup), setup, 11200);
    expect(result.events).toContainEqual(expect.objectContaining({
      kind: 'boss-duplicate-telegraph',
      atMs: 10100,
      impactAtMs: 11200,
      phase: 2,
      damagePerExtraCopy: 6,
      extraCopyCount: 2,
    }));
    expect(result.events).toContainEqual(expect.objectContaining({
      kind: 'boss-duplicate-impact',
      atMs: 11200,
      phase: 2,
      damagePerExtraCopy: 6,
      totalDamage: 12,
    }));
  });

  it('escalates Border Shark from Edge Rent to a telegraphed Border Lockdown on cycle two', () => {
    const setup = edgeSetup();
    const result = advanceCombatWithBossRules(createCombatState(setup), setup, 13000);
    expect(result.events).toContainEqual(expect.objectContaining({
      kind: 'boss-edge-telegraph',
      atMs: 11700,
      impactAtMs: 13000,
      phase: 2,
      damagePerEdgeItem: 3,
      affectedItemCount: 3,
    }));
    expect(result.events).toContainEqual(expect.objectContaining({
      kind: 'boss-edge-impact',
      atMs: 13000,
      phase: 2,
      damagePerEdgeItem: 3,
      totalDamage: 9,
    }));
  });

"""
if marker not in text:
    raise RuntimeError('loop boss test insertion marker changed')
text = text.replace(marker, insert + marker, 1)
test.write_text(text, encoding='utf-8')

# Docs and roadmap.
doc = Path('docs/SYSTEMS/LATE_WORLD_IDENTITY.md')
doc_text = doc.read_text(encoding='utf-8')
doc_text = doc_text.replace(
    "### Copycat Auditor — Duplicate Debt\nThe boss keeps the stronger existing rule: periodic telegraph + direct duplicate pressure. The two preceding fights have already taught the player what exact copies are and which items are causing the problem.\n",
    "### Copycat Auditor — Duplicate Debt → Final Audit\nThe first cycle uses the familiar **4 damage per extra exact copy**. From cycle 2 onward, the telegraph explicitly changes to **FINAL AUDIT** and announces **6 damage per extra copy** before impact. The target rule never changes: diversify exact definitions to erase the debt, or use shield as the secondary mitigation path. The two preceding fights have already taught the player which items create the duplicate stack.\n",
    1,
)
doc_text = doc_text.replace(
    "### Border Shark — Edge Rent\nThe boss keeps the stronger existing rule: periodic telegraph + direct perimeter rent damage. World 6 therefore teaches the geometry twice before the final test.\n",
    "### Border Shark — Edge Rent → Border Lockdown\nThe first cycle charges **2 damage per perimeter item**. From cycle 2 onward, the telegraph explicitly changes to **BORDER LOCKDOWN** and announces **3 damage per perimeter item** before impact. The geometry remains identical: move items inward to erase rent, or use shield as the secondary mitigation path. World 6 therefore teaches the same readable counter twice before the final escalating test.\n",
    1,
)
doc_text = doc_text.replace(
    "- Caps are deliberately below the corresponding boss threat's qualitative severity.\n",
    "- Caps are deliberately below the corresponding boss threat's qualitative severity.\n- Copycat Auditor and Border Shark phase two begins on mechanic cycle 2, not at a hidden HP threshold, so the stronger price is fully telegraphed and render-chunk invariant.\n",
    1,
)
doc.write_text(doc_text, encoding='utf-8')

replace_once(
    'ROADMAP.md',
    '- [ ] Evaluate a second escalation phase for Copycat Auditor and Border Shark so the late campaign feels climactic, with deterministic telegraphs and at least two viable counters.\n',
    '- [x] Add second escalation phases for Copycat Auditor / Border Shark (**cycle 2+ Final Audit raises duplicate debt 4→6 per extra copy; Border Lockdown raises edge rent 2→3 per perimeter item; both are explicitly telegraphed, chunk-invariant, and retain arrangement + shield counterplay**).\n',
)

print('late boss phase two applied')

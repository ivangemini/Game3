import { BACKPACK_HEIGHT, BACKPACK_WIDTH } from './backpackLayout';
import {
  advanceCombat,
  type CombatAdvanceResult,
  type CombatBuildItem,
  type CombatPresentationEvent,
  type CombatSetup,
  type CombatState,
} from './combat';

export interface TimeTaxDefinition {
  readonly intervalMs: number;
  readonly telegraphMs: number;
  readonly delayMs: number;
}

export interface ClutterCrushDefinition {
  readonly intervalMs: number;
  readonly telegraphMs: number;
  readonly damagePerLooseItem: number;
}

export interface DuplicateDebtDefinition {
  readonly intervalMs: number;
  readonly telegraphMs: number;
  readonly damagePerExtraCopy: number;
  readonly phaseTwoStartsAtCycle: number;
  readonly phaseTwoDamagePerExtraCopy: number;
}

export interface EdgeRentDefinition {
  readonly intervalMs: number;
  readonly telegraphMs: number;
  readonly damagePerEdgeItem: number;
  readonly phaseTwoStartsAtCycle: number;
  readonly phaseTwoDamagePerEdgeItem: number;
}

export interface DuplicateDebtTarget {
  readonly definitionId: string;
  readonly itemInstanceIds: readonly string[];
  readonly copyCount: number;
  readonly extraCopyCount: number;
}

export type TimeTaxPresentationEvent =
  | {
      readonly kind: 'boss-time-tax-telegraph';
      readonly atMs: number;
      readonly itemInstanceId: string;
      readonly impactAtMs: number;
      readonly triggerIntervalMs: number;
    }
  | {
      readonly kind: 'boss-time-tax-impact';
      readonly atMs: number;
      readonly itemInstanceId: string;
      readonly delayMs: number;
      readonly previousDueAtMs: number;
      readonly nextDueAtMs: number;
    };

export type ClutterCrushPresentationEvent =
  | {
      readonly kind: 'boss-clutter-telegraph';
      readonly atMs: number;
      readonly itemInstanceIds: readonly string[];
      readonly impactAtMs: number;
      readonly affectedItemCount: number;
    }
  | {
      readonly kind: 'boss-clutter-impact';
      readonly atMs: number;
      readonly itemInstanceIds: readonly string[];
      readonly affectedItemCount: number;
      readonly damagePerLooseItem: number;
      readonly totalDamage: number;
      readonly absorbedByShield: number;
      readonly healthDamage: number;
    };

export type DuplicateDebtPresentationEvent =
  | {
      readonly kind: 'boss-duplicate-telegraph';
      readonly atMs: number;
      readonly definitionId: string | null;
      readonly itemInstanceIds: readonly string[];
      readonly impactAtMs: number;
      readonly copyCount: number;
      readonly extraCopyCount: number;
      readonly phase?: 1 | 2;
      readonly damagePerExtraCopy?: number;
    }
  | {
      readonly kind: 'boss-duplicate-impact';
      readonly atMs: number;
      readonly definitionId: string | null;
      readonly itemInstanceIds: readonly string[];
      readonly copyCount: number;
      readonly extraCopyCount: number;
      readonly damagePerExtraCopy: number;
      readonly phase?: 1 | 2;
      readonly totalDamage: number;
      readonly absorbedByShield: number;
      readonly healthDamage: number;
    };

export type EdgeRentPresentationEvent =
  | {
      readonly kind: 'boss-edge-telegraph';
      readonly atMs: number;
      readonly itemInstanceIds: readonly string[];
      readonly impactAtMs: number;
      readonly affectedItemCount: number;
      readonly phase?: 1 | 2;
      readonly damagePerEdgeItem?: number;
    }
  | {
      readonly kind: 'boss-edge-impact';
      readonly atMs: number;
      readonly itemInstanceIds: readonly string[];
      readonly affectedItemCount: number;
      readonly damagePerEdgeItem: number;
      readonly phase?: 1 | 2;
      readonly totalDamage: number;
      readonly absorbedByShield: number;
      readonly healthDamage: number;
    };

export type BossCombatPresentationEvent =
  | CombatPresentationEvent
  | TimeTaxPresentationEvent
  | ClutterCrushPresentationEvent
  | DuplicateDebtPresentationEvent
  | EdgeRentPresentationEvent;

export interface BossCombatAdvanceResult extends Omit<CombatAdvanceResult, 'events'> {
  readonly events: readonly BossCombatPresentationEvent[];
}

const DEADLINE_SNAIL_BASE_RULE: TimeTaxDefinition = {
  intervalMs: 4800,
  telegraphMs: 900,
  delayMs: 1200,
};

const CLOSET_MONSTER_BASE_RULE: ClutterCrushDefinition = {
  intervalMs: 6000,
  telegraphMs: 1200,
  damagePerLooseItem: 3,
};

const COPYCAT_AUDITOR_BASE_RULE: DuplicateDebtDefinition = {
  intervalMs: 5600,
  telegraphMs: 1100,
  damagePerExtraCopy: 4,
  phaseTwoStartsAtCycle: 2,
  phaseTwoDamagePerExtraCopy: 6,
};

const BORDER_SHARK_BASE_RULE: EdgeRentDefinition = {
  intervalMs: 6500,
  telegraphMs: 1300,
  damagePerEdgeItem: 2,
  phaseTwoStartsAtCycle: 2,
  phaseTwoDamagePerEdgeItem: 3,
};

export function timeTaxDefinitionForEnemyId(enemyId: string): TimeTaxDefinition | null {
  if (enemyId === 'deadline-snail') return DEADLINE_SNAIL_BASE_RULE;
  const loopNumber = loopNumberForEnemyId(enemyId, 'deadline-snail');
  if (loopNumber === null) return null;
  return {
    ...DEADLINE_SNAIL_BASE_RULE,
    intervalMs: scaledLoopInterval(DEADLINE_SNAIL_BASE_RULE.intervalMs, loopNumber, 3200),
  };
}

export function clutterCrushDefinitionForEnemyId(enemyId: string): ClutterCrushDefinition | null {
  if (enemyId === 'closet-monster') return CLOSET_MONSTER_BASE_RULE;
  const loopNumber = loopNumberForEnemyId(enemyId, 'closet-monster');
  if (loopNumber === null) return null;
  return {
    ...CLOSET_MONSTER_BASE_RULE,
    intervalMs: scaledLoopInterval(CLOSET_MONSTER_BASE_RULE.intervalMs, loopNumber, 4000),
  };
}

export function duplicateDebtDefinitionForEnemyId(enemyId: string): DuplicateDebtDefinition | null {
  if (enemyId === 'copycat-auditor') return COPYCAT_AUDITOR_BASE_RULE;
  const loopNumber = loopNumberForEnemyId(enemyId, 'copycat-auditor');
  if (loopNumber === null) return null;
  return {
    ...COPYCAT_AUDITOR_BASE_RULE,
    intervalMs: scaledLoopInterval(COPYCAT_AUDITOR_BASE_RULE.intervalMs, loopNumber, 3600),
  };
}

export function edgeRentDefinitionForEnemyId(enemyId: string): EdgeRentDefinition | null {
  if (enemyId === 'border-shark') return BORDER_SHARK_BASE_RULE;
  const loopNumber = loopNumberForEnemyId(enemyId, 'border-shark');
  if (loopNumber === null) return null;
  return {
    ...BORDER_SHARK_BASE_RULE,
    intervalMs: scaledLoopInterval(BORDER_SHARK_BASE_RULE.intervalMs, loopNumber, 4200),
  };
}

export function isBossRuleEnemy(enemyId: string): boolean {
  return timeTaxDefinitionForEnemyId(enemyId) !== null
    || clutterCrushDefinitionForEnemyId(enemyId) !== null
    || duplicateDebtDefinitionForEnemyId(enemyId) !== null
    || edgeRentDefinitionForEnemyId(enemyId) !== null;
}

export function fastestTimeTaxTarget(items: ReadonlyMap<string, CombatBuildItem>): CombatBuildItem | null {
  const ordered = [...items.values()].sort(
    (a, b) => a.triggerIntervalMs - b.triggerIntervalMs || a.instanceId.localeCompare(b.instanceId),
  );
  const meaningful = ordered.filter(
    (item) => item.damage > 0
      || item.poisonOnHit > 0
      || item.shieldOnTrigger > 0
      || item.bonusLaserShots > 0
      || item.chaosPower > 0,
  );
  return meaningful[0] ?? ordered[0] ?? null;
}

export function looseClutterItems(items: ReadonlyMap<string, CombatBuildItem>): readonly CombatBuildItem[] {
  const cellOwner = new Map<string, string>();
  for (const item of [...items.values()].sort((a, b) => a.instanceId.localeCompare(b.instanceId))) {
    for (const cell of item.occupiedCells) cellOwner.set(`${cell.x}:${cell.y}`, item.instanceId);
  }

  return [...items.values()]
    .sort((a, b) => a.instanceId.localeCompare(b.instanceId))
    .filter((item) => !item.occupiedCells.some((cell) => {
      const neighbors = [
        `${cell.x - 1}:${cell.y}`,
        `${cell.x + 1}:${cell.y}`,
        `${cell.x}:${cell.y - 1}`,
        `${cell.x}:${cell.y + 1}`,
      ];
      return neighbors.some((key) => {
        const owner = cellOwner.get(key);
        return owner !== undefined && owner !== item.instanceId;
      });
    }));
}

export function duplicateDebtTarget(items: ReadonlyMap<string, CombatBuildItem>): DuplicateDebtTarget | null {
  const groups = new Map<string, string[]>();
  for (const item of [...items.values()].sort((a, b) => a.instanceId.localeCompare(b.instanceId))) {
    const group = groups.get(item.definitionId) ?? [];
    group.push(item.instanceId);
    groups.set(item.definitionId, group);
  }

  const ranked = [...groups.entries()]
    .filter(([, instanceIds]) => instanceIds.length > 1)
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  const target = ranked[0];
  if (!target) return null;
  const [definitionId, itemInstanceIds] = target;
  return {
    definitionId,
    itemInstanceIds: [...itemInstanceIds].sort((a, b) => a.localeCompare(b)),
    copyCount: itemInstanceIds.length,
    extraCopyCount: Math.max(0, itemInstanceIds.length - 1),
  };
}

export function edgeRentItems(items: ReadonlyMap<string, CombatBuildItem>): readonly CombatBuildItem[] {
  return [...items.values()]
    .sort((a, b) => a.instanceId.localeCompare(b.instanceId))
    .filter((item) => item.occupiedCells.some((cell) =>
      cell.x === 0
      || cell.y === 0
      || cell.x === BACKPACK_WIDTH - 1
      || cell.y === BACKPACK_HEIGHT - 1,
    ));
}

export function isTimeTaxPresentationEvent(
  event: BossCombatPresentationEvent,
): event is TimeTaxPresentationEvent {
  return event.kind === 'boss-time-tax-telegraph' || event.kind === 'boss-time-tax-impact';
}

export function isClutterCrushPresentationEvent(
  event: BossCombatPresentationEvent,
): event is ClutterCrushPresentationEvent {
  return event.kind === 'boss-clutter-telegraph' || event.kind === 'boss-clutter-impact';
}

export function isDuplicateDebtPresentationEvent(
  event: BossCombatPresentationEvent,
): event is DuplicateDebtPresentationEvent {
  return event.kind === 'boss-duplicate-telegraph' || event.kind === 'boss-duplicate-impact';
}

export function isEdgeRentPresentationEvent(
  event: BossCombatPresentationEvent,
): event is EdgeRentPresentationEvent {
  return event.kind === 'boss-edge-telegraph' || event.kind === 'boss-edge-impact';
}

export function advanceCombatWithBossRules(
  inputState: CombatState,
  setup: CombatSetup,
  deltaMs: number,
): BossCombatAdvanceResult {
  const timeTax = timeTaxDefinitionForEnemyId(setup.enemy.id);
  if (timeTax) return advanceWithTimeTax(inputState, setup, deltaMs, timeTax);
  const clutterCrush = clutterCrushDefinitionForEnemyId(setup.enemy.id);
  if (clutterCrush) return advanceWithClutterCrush(inputState, setup, deltaMs, clutterCrush);
  const duplicateDebt = duplicateDebtDefinitionForEnemyId(setup.enemy.id);
  if (duplicateDebt) return advanceWithDuplicateDebt(inputState, setup, deltaMs, duplicateDebt);
  const edgeRent = edgeRentDefinitionForEnemyId(setup.enemy.id);
  if (edgeRent) return advanceWithEdgeRent(inputState, setup, deltaMs, edgeRent);
  return advanceCombat(inputState, setup, deltaMs);
}

function advanceWithTimeTax(
  inputState: CombatState,
  setup: CombatSetup,
  deltaMs: number,
  rule: TimeTaxDefinition,
): BossCombatAdvanceResult {
  if (inputState.outcome !== 'active' || deltaMs === 0) return advanceCombat(inputState, setup, deltaMs);
  validateDeltaMs(deltaMs);

  const targetTime = inputState.timeMs + deltaMs;
  const boundaries = bossBoundaries(inputState.timeMs, targetTime, rule.intervalMs, rule.telegraphMs);
  const events: BossCombatPresentationEvent[] = [];
  let state = inputState;

  for (const boundary of boundaries) {
    if (state.outcome !== 'active') break;
    const advanced = advanceToBoundary(state, setup, boundary.atMs);
    state = advanced.state;
    events.push(...advanced.events);
    if (state.outcome !== 'active' || state.timeMs !== boundary.atMs) break;

    const target = fastestTimeTaxTarget(setup.items);
    if (!target) continue;

    if (boundary.kind === 'telegraph') {
      events.push({
        kind: 'boss-time-tax-telegraph',
        atMs: boundary.atMs,
        itemInstanceId: target.instanceId,
        impactAtMs: boundary.impactAtMs,
        triggerIntervalMs: target.triggerIntervalMs,
      });
      continue;
    }

    const nextTrigger = state.queue.find(
      (effect) => effect.kind === 'item-trigger' && effect.itemInstanceId === target.instanceId,
    );
    if (!nextTrigger || nextTrigger.kind !== 'item-trigger') continue;
    const nextDueAtMs = nextTrigger.dueAtMs + rule.delayMs;
    state = {
      ...state,
      queue: state.queue
        .map((effect) => effect === nextTrigger ? { ...effect, dueAtMs: nextDueAtMs } : effect)
        .sort((a, b) => a.dueAtMs - b.dueAtMs || a.sequence - b.sequence),
    };
    events.push({
      kind: 'boss-time-tax-impact',
      atMs: boundary.atMs,
      itemInstanceId: target.instanceId,
      delayMs: rule.delayMs,
      previousDueAtMs: nextTrigger.dueAtMs,
      nextDueAtMs,
    });
  }

  return finishAdvance(state, setup, targetTime, events);
}

function advanceWithClutterCrush(
  inputState: CombatState,
  setup: CombatSetup,
  deltaMs: number,
  rule: ClutterCrushDefinition,
): BossCombatAdvanceResult {
  if (inputState.outcome !== 'active' || deltaMs === 0) return advanceCombat(inputState, setup, deltaMs);
  validateDeltaMs(deltaMs);

  const targetTime = inputState.timeMs + deltaMs;
  const boundaries = bossBoundaries(inputState.timeMs, targetTime, rule.intervalMs, rule.telegraphMs);
  const events: BossCombatPresentationEvent[] = [];
  let state = inputState;

  for (const boundary of boundaries) {
    if (state.outcome !== 'active') break;
    const advanced = advanceToBoundary(state, setup, boundary.atMs);
    state = advanced.state;
    events.push(...advanced.events);
    if (state.outcome !== 'active' || state.timeMs !== boundary.atMs) break;

    const looseIds = looseClutterItems(setup.items).map((item) => item.instanceId);
    if (boundary.kind === 'telegraph') {
      events.push({
        kind: 'boss-clutter-telegraph',
        atMs: boundary.atMs,
        itemInstanceIds: looseIds,
        impactAtMs: boundary.impactAtMs,
        affectedItemCount: looseIds.length,
      });
      continue;
    }

    const incoming = looseIds.length * rule.damagePerLooseItem;
    const damage = applyShieldedBossDamage(state, incoming);
    state = damage.state;
    events.push({
      kind: 'boss-clutter-impact',
      atMs: boundary.atMs,
      itemInstanceIds: looseIds,
      affectedItemCount: looseIds.length,
      damagePerLooseItem: rule.damagePerLooseItem,
      totalDamage: incoming,
      absorbedByShield: damage.absorbedByShield,
      healthDamage: damage.healthDamage,
    });
    if (state.outcome === 'defeat') {
      events.push({ kind: 'outcome', atMs: boundary.atMs, outcome: 'defeat' });
      break;
    }
  }

  return finishAdvance(state, setup, targetTime, events);
}

function advanceWithDuplicateDebt(
  inputState: CombatState,
  setup: CombatSetup,
  deltaMs: number,
  rule: DuplicateDebtDefinition,
): BossCombatAdvanceResult {
  if (inputState.outcome !== 'active' || deltaMs === 0) return advanceCombat(inputState, setup, deltaMs);
  validateDeltaMs(deltaMs);

  const targetTime = inputState.timeMs + deltaMs;
  const boundaries = bossBoundaries(inputState.timeMs, targetTime, rule.intervalMs, rule.telegraphMs);
  const events: BossCombatPresentationEvent[] = [];
  let state = inputState;

  for (const boundary of boundaries) {
    if (state.outcome !== 'active') break;
    const advanced = advanceToBoundary(state, setup, boundary.atMs);
    state = advanced.state;
    events.push(...advanced.events);
    if (state.outcome !== 'active' || state.timeMs !== boundary.atMs) break;

    const target = duplicateDebtTarget(setup.items);
    const definitionId = target?.definitionId ?? null;
    const itemInstanceIds = target?.itemInstanceIds ?? [];
    const copyCount = target?.copyCount ?? 0;
    const extraCopyCount = target?.extraCopyCount ?? 0;
    const phase: 1 | 2 = boundary.cycle >= rule.phaseTwoStartsAtCycle ? 2 : 1;
    const damagePerExtraCopy = phase === 2 ? rule.phaseTwoDamagePerExtraCopy : rule.damagePerExtraCopy;

    if (boundary.kind === 'telegraph') {
      events.push({
        kind: 'boss-duplicate-telegraph',
        atMs: boundary.atMs,
        definitionId,
        itemInstanceIds,
        impactAtMs: boundary.impactAtMs,
        copyCount,
        extraCopyCount,
        phase,
        damagePerExtraCopy,
      });
      continue;
    }

    const incoming = extraCopyCount * damagePerExtraCopy;
    const damage = applyShieldedBossDamage(state, incoming);
    state = damage.state;
    events.push({
      kind: 'boss-duplicate-impact',
      atMs: boundary.atMs,
      definitionId,
      itemInstanceIds,
      copyCount,
      extraCopyCount,
      damagePerExtraCopy,
      phase,
      totalDamage: incoming,
      absorbedByShield: damage.absorbedByShield,
      healthDamage: damage.healthDamage,
    });
    if (state.outcome === 'defeat') {
      events.push({ kind: 'outcome', atMs: boundary.atMs, outcome: 'defeat' });
      break;
    }
  }

  return finishAdvance(state, setup, targetTime, events);
}

function advanceWithEdgeRent(
  inputState: CombatState,
  setup: CombatSetup,
  deltaMs: number,
  rule: EdgeRentDefinition,
): BossCombatAdvanceResult {
  if (inputState.outcome !== 'active' || deltaMs === 0) return advanceCombat(inputState, setup, deltaMs);
  validateDeltaMs(deltaMs);

  const targetTime = inputState.timeMs + deltaMs;
  const boundaries = bossBoundaries(inputState.timeMs, targetTime, rule.intervalMs, rule.telegraphMs);
  const events: BossCombatPresentationEvent[] = [];
  let state = inputState;

  for (const boundary of boundaries) {
    if (state.outcome !== 'active') break;
    const advanced = advanceToBoundary(state, setup, boundary.atMs);
    state = advanced.state;
    events.push(...advanced.events);
    if (state.outcome !== 'active' || state.timeMs !== boundary.atMs) break;

    const edgeIds = edgeRentItems(setup.items).map((item) => item.instanceId);
    const phase: 1 | 2 = boundary.cycle >= rule.phaseTwoStartsAtCycle ? 2 : 1;
    const damagePerEdgeItem = phase === 2 ? rule.phaseTwoDamagePerEdgeItem : rule.damagePerEdgeItem;
    if (boundary.kind === 'telegraph') {
      events.push({
        kind: 'boss-edge-telegraph',
        atMs: boundary.atMs,
        itemInstanceIds: edgeIds,
        impactAtMs: boundary.impactAtMs,
        affectedItemCount: edgeIds.length,
        phase,
        damagePerEdgeItem,
      });
      continue;
    }

    const incoming = edgeIds.length * damagePerEdgeItem;
    const damage = applyShieldedBossDamage(state, incoming);
    state = damage.state;
    events.push({
      kind: 'boss-edge-impact',
      atMs: boundary.atMs,
      itemInstanceIds: edgeIds,
      affectedItemCount: edgeIds.length,
      damagePerEdgeItem,
      phase,
      totalDamage: incoming,
      absorbedByShield: damage.absorbedByShield,
      healthDamage: damage.healthDamage,
    });
    if (state.outcome === 'defeat') {
      events.push({ kind: 'outcome', atMs: boundary.atMs, outcome: 'defeat' });
      break;
    }
  }

  return finishAdvance(state, setup, targetTime, events);
}

function applyShieldedBossDamage(
  state: CombatState,
  incoming: number,
): { readonly state: CombatState; readonly absorbedByShield: number; readonly healthDamage: number } {
  const normalizedIncoming = Math.max(0, Math.round(incoming));
  const absorbedByShield = Math.min(state.playerShield, normalizedIncoming);
  const healthDamage = normalizedIncoming - absorbedByShield;
  const playerShield = state.playerShield - absorbedByShield;
  const playerHp = Math.max(0, state.playerHp - healthDamage);
  return {
    state: {
      ...state,
      playerShield,
      playerHp,
      ...(playerHp <= 0 ? { outcome: 'defeat' as const } : {}),
    },
    absorbedByShield,
    healthDamage,
  };
}

function advanceToBoundary(state: CombatState, setup: CombatSetup, boundaryAtMs: number): CombatAdvanceResult {
  const segmentMs = Math.max(0, boundaryAtMs - state.timeMs);
  return segmentMs > 0 ? advanceCombat(state, setup, segmentMs) : { state, events: [] };
}

function finishAdvance(
  state: CombatState,
  setup: CombatSetup,
  targetTime: number,
  events: BossCombatPresentationEvent[],
): BossCombatAdvanceResult {
  if (state.outcome === 'active' && state.timeMs < targetTime) {
    const advanced = advanceCombat(state, setup, targetTime - state.timeMs);
    return { state: advanced.state, events: [...events, ...advanced.events] };
  }
  return { state, events };
}

function validateDeltaMs(deltaMs: number): void {
  if (!Number.isFinite(deltaMs) || deltaMs < 0) throw new RangeError('deltaMs must be non-negative');
}

function loopNumberForEnemyId(enemyId: string, baseId: string): number | null {
  const match = new RegExp(`^loop-(\\d+)-${baseId}$`).exec(enemyId);
  if (!match) return null;
  return Math.max(2, Number.parseInt(match[1] ?? '2', 10));
}

function scaledLoopInterval(baseIntervalMs: number, loopNumber: number, floorMs: number): number {
  const depth = Math.max(1, loopNumber - 1);
  const speedScale = 1 + depth * 0.08;
  return Math.max(floorMs, Math.round(baseIntervalMs / speedScale));
}

interface BossBoundary {
  readonly kind: 'telegraph' | 'impact';
  readonly atMs: number;
  readonly impactAtMs: number;
  readonly cycle: number;
}

function bossBoundaries(
  startExclusiveMs: number,
  endInclusiveMs: number,
  intervalMs: number,
  telegraphMs: number,
): BossBoundary[] {
  const boundaries: BossBoundary[] = [];
  const maxCycle = Math.max(0, Math.ceil(endInclusiveMs / intervalMs));
  for (let cycle = 1; cycle <= maxCycle; cycle += 1) {
    const impactAtMs = cycle * intervalMs;
    const telegraphAtMs = impactAtMs - telegraphMs;
    if (telegraphAtMs > startExclusiveMs && telegraphAtMs <= endInclusiveMs) {
      boundaries.push({ kind: 'telegraph', atMs: telegraphAtMs, impactAtMs, cycle });
    }
    if (impactAtMs > startExclusiveMs && impactAtMs <= endInclusiveMs) {
      boundaries.push({ kind: 'impact', atMs: impactAtMs, impactAtMs, cycle });
    }
  }
  return boundaries.sort((a, b) => a.atMs - b.atMs || (a.kind === 'telegraph' ? -1 : 1));
}

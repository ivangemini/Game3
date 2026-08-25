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

export type BossCombatPresentationEvent =
  | CombatPresentationEvent
  | TimeTaxPresentationEvent
  | ClutterCrushPresentationEvent;

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

export function timeTaxDefinitionForEnemyId(enemyId: string): TimeTaxDefinition | null {
  if (enemyId === 'deadline-snail') return DEADLINE_SNAIL_BASE_RULE;
  const loopMatch = /^loop-(\d+)-deadline-snail$/.exec(enemyId);
  if (!loopMatch) return null;
  const loopNumber = Math.max(2, Number.parseInt(loopMatch[1] ?? '2', 10));
  const depth = loopNumber - 1;
  const speedScale = 1 + depth * 0.08;
  return {
    ...DEADLINE_SNAIL_BASE_RULE,
    intervalMs: Math.max(3200, Math.round(DEADLINE_SNAIL_BASE_RULE.intervalMs / speedScale)),
  };
}

export function clutterCrushDefinitionForEnemyId(enemyId: string): ClutterCrushDefinition | null {
  if (enemyId === 'closet-monster') return CLOSET_MONSTER_BASE_RULE;
  const loopMatch = /^loop-(\d+)-closet-monster$/.exec(enemyId);
  if (!loopMatch) return null;
  const loopNumber = Math.max(2, Number.parseInt(loopMatch[1] ?? '2', 10));
  const depth = loopNumber - 1;
  const speedScale = 1 + depth * 0.08;
  return {
    ...CLOSET_MONSTER_BASE_RULE,
    intervalMs: Math.max(4000, Math.round(CLOSET_MONSTER_BASE_RULE.intervalMs / speedScale)),
  };
}

export function isBossRuleEnemy(enemyId: string): boolean {
  return timeTaxDefinitionForEnemyId(enemyId) !== null
    || clutterCrushDefinitionForEnemyId(enemyId) !== null;
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

export function advanceCombatWithBossRules(
  inputState: CombatState,
  setup: CombatSetup,
  deltaMs: number,
): BossCombatAdvanceResult {
  const timeTax = timeTaxDefinitionForEnemyId(setup.enemy.id);
  if (timeTax) return advanceWithTimeTax(inputState, setup, deltaMs, timeTax);
  const clutterCrush = clutterCrushDefinitionForEnemyId(setup.enemy.id);
  if (clutterCrush) return advanceWithClutterCrush(inputState, setup, deltaMs, clutterCrush);
  return advanceCombat(inputState, setup, deltaMs);
}

function advanceWithTimeTax(
  inputState: CombatState,
  setup: CombatSetup,
  deltaMs: number,
  rule: TimeTaxDefinition,
): BossCombatAdvanceResult {
  if (inputState.outcome !== 'active' || deltaMs === 0) return advanceCombat(inputState, setup, deltaMs);
  if (!Number.isFinite(deltaMs) || deltaMs < 0) throw new RangeError('deltaMs must be non-negative');

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
  if (!Number.isFinite(deltaMs) || deltaMs < 0) throw new RangeError('deltaMs must be non-negative');

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
    const absorbedByShield = Math.min(state.playerShield, incoming);
    const healthDamage = incoming - absorbedByShield;
    const playerShield = state.playerShield - absorbedByShield;
    const playerHp = Math.max(0, state.playerHp - healthDamage);
    state = {
      ...state,
      playerShield,
      playerHp,
      ...(playerHp <= 0 ? { outcome: 'defeat' as const } : {}),
    };
    events.push({
      kind: 'boss-clutter-impact',
      atMs: boundary.atMs,
      itemInstanceIds: looseIds,
      affectedItemCount: looseIds.length,
      damagePerLooseItem: rule.damagePerLooseItem,
      totalDamage: incoming,
      absorbedByShield,
      healthDamage,
    });
    if (playerHp <= 0) {
      events.push({ kind: 'outcome', atMs: boundary.atMs, outcome: 'defeat' });
      break;
    }
  }

  return finishAdvance(state, setup, targetTime, events);
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

interface BossBoundary {
  readonly kind: 'telegraph' | 'impact';
  readonly atMs: number;
  readonly impactAtMs: number;
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
      boundaries.push({ kind: 'telegraph', atMs: telegraphAtMs, impactAtMs });
    }
    if (impactAtMs > startExclusiveMs && impactAtMs <= endInclusiveMs) {
      boundaries.push({ kind: 'impact', atMs: impactAtMs, impactAtMs });
    }
  }
  return boundaries.sort((a, b) => a.atMs - b.atMs || (a.kind === 'telegraph' ? -1 : 1));
}

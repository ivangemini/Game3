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

export type BossCombatPresentationEvent = CombatPresentationEvent | TimeTaxPresentationEvent;

export interface BossCombatAdvanceResult extends Omit<CombatAdvanceResult, 'events'> {
  readonly events: readonly BossCombatPresentationEvent[];
}

const DEADLINE_SNAIL_BASE_RULE: TimeTaxDefinition = {
  intervalMs: 4800,
  telegraphMs: 900,
  delayMs: 1200,
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

export function isBossRuleEnemy(enemyId: string): boolean {
  return timeTaxDefinitionForEnemyId(enemyId) !== null;
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

export function isTimeTaxPresentationEvent(
  event: BossCombatPresentationEvent,
): event is TimeTaxPresentationEvent {
  return event.kind === 'boss-time-tax-telegraph' || event.kind === 'boss-time-tax-impact';
}

export function advanceCombatWithBossRules(
  inputState: CombatState,
  setup: CombatSetup,
  deltaMs: number,
): BossCombatAdvanceResult {
  const rule = timeTaxDefinitionForEnemyId(setup.enemy.id);
  if (!rule || inputState.outcome !== 'active' || deltaMs === 0) {
    return advanceCombat(inputState, setup, deltaMs);
  }
  if (!Number.isFinite(deltaMs) || deltaMs < 0) throw new RangeError('deltaMs must be non-negative');

  const targetTime = inputState.timeMs + deltaMs;
  const boundaries = timeTaxBoundaries(inputState.timeMs, targetTime, rule);
  const events: BossCombatPresentationEvent[] = [];
  let state = inputState;

  for (const boundary of boundaries) {
    if (state.outcome !== 'active') break;
    const segmentMs = Math.max(0, boundary.atMs - state.timeMs);
    if (segmentMs > 0) {
      const advanced = advanceCombat(state, setup, segmentMs);
      state = advanced.state;
      events.push(...advanced.events);
    }
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

  if (state.outcome === 'active' && state.timeMs < targetTime) {
    const advanced = advanceCombat(state, setup, targetTime - state.timeMs);
    state = advanced.state;
    events.push(...advanced.events);
  }

  return { state, events };
}

interface TimeTaxBoundary {
  readonly kind: 'telegraph' | 'impact';
  readonly atMs: number;
  readonly impactAtMs: number;
}

function timeTaxBoundaries(
  startExclusiveMs: number,
  endInclusiveMs: number,
  rule: TimeTaxDefinition,
): TimeTaxBoundary[] {
  const boundaries: TimeTaxBoundary[] = [];
  const maxCycle = Math.max(0, Math.ceil(endInclusiveMs / rule.intervalMs));
  for (let cycle = 1; cycle <= maxCycle; cycle += 1) {
    const impactAtMs = cycle * rule.intervalMs;
    const telegraphAtMs = impactAtMs - rule.telegraphMs;
    if (telegraphAtMs > startExclusiveMs && telegraphAtMs <= endInclusiveMs) {
      boundaries.push({ kind: 'telegraph', atMs: telegraphAtMs, impactAtMs });
    }
    if (impactAtMs > startExclusiveMs && impactAtMs <= endInclusiveMs) {
      boundaries.push({ kind: 'impact', atMs: impactAtMs, impactAtMs });
    }
  }
  return boundaries.sort((a, b) => a.atMs - b.atMs || (a.kind === 'telegraph' ? -1 : 1));
}

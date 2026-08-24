import type { ItemBonuses } from './synergies';

export interface CombatItemProfile {
  readonly definitionId: string;
  readonly triggerIntervalMs: number;
  readonly damage: number;
  readonly poisonOnHit?: number;
  readonly shieldOnTrigger?: number;
  readonly extraLaserDamage?: number;
}

export interface CombatBuildItem {
  readonly instanceId: string;
  readonly definitionId: string;
  readonly triggerIntervalMs: number;
  readonly damage: number;
  readonly poisonOnHit: number;
  readonly shieldOnTrigger: number;
  readonly bonusLaserShots: number;
  readonly extraLaserDamage: number;
  readonly chaosPower: number;
  readonly scrapArmor: number;
}

export interface EnemyInterferenceDefinition {
  readonly kind: 'channel-jam';
  readonly intervalMs: number;
  readonly telegraphMs: number;
  readonly durationMs: number;
}

export interface EnemyCombatDefinition {
  readonly id: string;
  readonly name: string;
  readonly maxHp: number;
  readonly attackIntervalMs: number;
  readonly attackDamage: number;
  readonly interference?: EnemyInterferenceDefinition;
}

export type CombatOutcome = 'active' | 'victory' | 'defeat';

export type CombatQueuedEffect =
  | {
      readonly kind: 'item-trigger';
      readonly dueAtMs: number;
      readonly sequence: number;
      readonly itemInstanceId: string;
    }
  | {
      readonly kind: 'enemy-attack';
      readonly dueAtMs: number;
      readonly sequence: number;
    }
  | {
      readonly kind: 'poison-tick';
      readonly dueAtMs: number;
      readonly sequence: number;
    }
  | {
      readonly kind: 'boss-telegraph';
      readonly dueAtMs: number;
      readonly sequence: number;
      readonly itemInstanceId: string;
    }
  | {
      readonly kind: 'boss-interference';
      readonly dueAtMs: number;
      readonly sequence: number;
      readonly itemInstanceId: string;
    };

export type CombatPresentationEvent =
  | {
      readonly kind: 'item-triggered';
      readonly atMs: number;
      readonly itemInstanceId: string;
    }
  | {
      readonly kind: 'item-jammed';
      readonly atMs: number;
      readonly itemInstanceId: string;
    }
  | {
      readonly kind: 'enemy-damaged';
      readonly atMs: number;
      readonly itemInstanceId: string;
      readonly amount: number;
      readonly source: 'item' | 'poison';
    }
  | {
      readonly kind: 'poison-applied';
      readonly atMs: number;
      readonly itemInstanceId: string;
      readonly amount: number;
    }
  | {
      readonly kind: 'shield-gained';
      readonly atMs: number;
      readonly itemInstanceId: string;
      readonly amount: number;
    }
  | {
      readonly kind: 'player-damaged';
      readonly atMs: number;
      readonly amount: number;
      readonly absorbedByShield: number;
    }
  | {
      readonly kind: 'boss-telegraph';
      readonly atMs: number;
      readonly itemInstanceId: string;
      readonly impactAtMs: number;
    }
  | {
      readonly kind: 'boss-jammed';
      readonly atMs: number;
      readonly itemInstanceId: string;
      readonly durationMs: number;
    }
  | {
      readonly kind: 'outcome';
      readonly atMs: number;
      readonly outcome: Exclude<CombatOutcome, 'active'>;
    };

export interface CombatSetup {
  readonly playerMaxHp: number;
  readonly items: ReadonlyMap<string, CombatBuildItem>;
  readonly enemy: EnemyCombatDefinition;
}

export interface CombatState {
  readonly timeMs: number;
  readonly playerHp: number;
  readonly playerShield: number;
  readonly enemyHp: number;
  readonly enemyPoison: number;
  readonly outcome: CombatOutcome;
  readonly nextSequence: number;
  readonly queue: readonly CombatQueuedEffect[];
  readonly jammedUntilByItemId: Readonly<Record<string, number>>;
}

export interface CombatAdvanceResult {
  readonly state: CombatState;
  readonly events: readonly CombatPresentationEvent[];
}

const POISON_TICK_INTERVAL_MS = 1000;
const MIN_TRIGGER_INTERVAL_MS = 250;

function normalizeNonNegativeInt(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

export function createCombatBuildItem(
  instanceId: string,
  profile: CombatItemProfile,
  bonuses: ItemBonuses | undefined,
): CombatBuildItem {
  const triggerSpeedPct = Math.max(0, bonuses?.triggerSpeedPct ?? 0);
  const triggerIntervalMs = Math.max(
    MIN_TRIGGER_INTERVAL_MS,
    Math.round(profile.triggerIntervalMs / (1 + triggerSpeedPct / 100)),
  );

  return {
    instanceId,
    definitionId: profile.definitionId,
    triggerIntervalMs,
    damage: normalizeNonNegativeInt(profile.damage),
    poisonOnHit: normalizeNonNegativeInt((profile.poisonOnHit ?? 0) + (bonuses?.poisonOnHit ?? 0)),
    shieldOnTrigger: normalizeNonNegativeInt(profile.shieldOnTrigger ?? 0),
    bonusLaserShots: normalizeNonNegativeInt(bonuses?.bonusLaserShots ?? 0),
    extraLaserDamage: normalizeNonNegativeInt(profile.extraLaserDamage ?? profile.damage),
    chaosPower: normalizeNonNegativeInt(bonuses?.chaosPower ?? 0),
    scrapArmor: normalizeNonNegativeInt(bonuses?.scrapArmor ?? 0),
  };
}

export function createCombatState(setup: CombatSetup): CombatState {
  if (!Number.isFinite(setup.playerMaxHp) || setup.playerMaxHp <= 0) {
    throw new RangeError('playerMaxHp must be positive');
  }
  if (setup.enemy.maxHp <= 0 || setup.enemy.attackIntervalMs <= 0 || setup.enemy.attackDamage < 0) {
    throw new RangeError('Enemy combat values are invalid');
  }
  if (setup.enemy.interference) validateInterference(setup.enemy.interference);

  let nextSequence = 0;
  const queue: CombatQueuedEffect[] = [];
  let initialShield = 0;

  const orderedItems = [...setup.items.values()].sort((a, b) => a.instanceId.localeCompare(b.instanceId));
  for (const item of orderedItems) {
    queue.push({
      kind: 'item-trigger',
      dueAtMs: item.triggerIntervalMs,
      sequence: nextSequence,
      itemInstanceId: item.instanceId,
    });
    nextSequence += 1;
    initialShield += item.scrapArmor * 2;
  }

  queue.push({
    kind: 'enemy-attack',
    dueAtMs: setup.enemy.attackIntervalMs,
    sequence: nextSequence,
  });
  nextSequence += 1;

  queue.push({
    kind: 'poison-tick',
    dueAtMs: POISON_TICK_INTERVAL_MS,
    sequence: nextSequence,
  });
  nextSequence += 1;

  if (setup.enemy.interference) {
    nextSequence = scheduleInterference(
      queue,
      setup,
      setup.enemy.interference.intervalMs,
      nextSequence,
    );
  }

  return {
    timeMs: 0,
    playerHp: Math.round(setup.playerMaxHp),
    playerShield: initialShield,
    enemyHp: Math.round(setup.enemy.maxHp),
    enemyPoison: 0,
    outcome: 'active',
    nextSequence,
    queue: sortQueue(queue),
    jammedUntilByItemId: {},
  };
}

export function advanceCombat(
  inputState: CombatState,
  setup: CombatSetup,
  deltaMs: number,
): CombatAdvanceResult {
  if (!Number.isFinite(deltaMs) || deltaMs < 0) throw new RangeError('deltaMs must be non-negative');
  if (inputState.outcome !== 'active' || deltaMs === 0) {
    return { state: inputState, events: [] };
  }

  const targetTime = inputState.timeMs + deltaMs;
  let resolvedTimeMs = targetTime;
  let playerHp = inputState.playerHp;
  let playerShield = inputState.playerShield;
  let enemyHp = inputState.enemyHp;
  let enemyPoison = inputState.enemyPoison;
  let outcome: CombatOutcome = inputState.outcome;
  let nextSequence = inputState.nextSequence;
  const queue = [...inputState.queue];
  const jammedUntilByItemId: Record<string, number> = { ...inputState.jammedUntilByItemId };
  const events: CombatPresentationEvent[] = [];

  while (queue.length > 0 && outcome === 'active') {
    sortQueueInPlace(queue);
    const nextEffect = queue[0];
    if (!nextEffect || nextEffect.dueAtMs > targetTime) break;
    queue.shift();
    const atMs = nextEffect.dueAtMs;

    if (nextEffect.kind === 'item-trigger') {
      const item = setup.items.get(nextEffect.itemInstanceId);
      if (!item) continue;

      const jammedUntil = jammedUntilByItemId[item.instanceId] ?? 0;
      if (jammedUntil > atMs) {
        events.push({ kind: 'item-jammed', atMs, itemInstanceId: item.instanceId });
      } else {
        events.push({ kind: 'item-triggered', atMs, itemInstanceId: item.instanceId });
        const chaosDamage = item.chaosPower * 2;
        const laserDamage = item.bonusLaserShots * item.extraLaserDamage;
        const totalDamage = item.damage + chaosDamage + laserDamage;

        if (totalDamage > 0) {
          enemyHp = Math.max(0, enemyHp - totalDamage);
          events.push({
            kind: 'enemy-damaged',
            atMs,
            itemInstanceId: item.instanceId,
            amount: totalDamage,
            source: 'item',
          });
        }
        if (item.poisonOnHit > 0) {
          enemyPoison += item.poisonOnHit;
          events.push({
            kind: 'poison-applied',
            atMs,
            itemInstanceId: item.instanceId,
            amount: item.poisonOnHit,
          });
        }
        if (item.shieldOnTrigger > 0) {
          playerShield += item.shieldOnTrigger;
          events.push({
            kind: 'shield-gained',
            atMs,
            itemInstanceId: item.instanceId,
            amount: item.shieldOnTrigger,
          });
        }

        if (enemyHp <= 0) {
          outcome = 'victory';
          resolvedTimeMs = atMs;
          events.push({ kind: 'outcome', atMs, outcome });
          break;
        }
      }

      queue.push({
        kind: 'item-trigger',
        dueAtMs: atMs + item.triggerIntervalMs,
        sequence: nextSequence,
        itemInstanceId: item.instanceId,
      });
      nextSequence += 1;
      continue;
    }

    if (nextEffect.kind === 'enemy-attack') {
      const incoming = Math.max(0, Math.round(setup.enemy.attackDamage));
      const absorbedByShield = Math.min(playerShield, incoming);
      const healthDamage = incoming - absorbedByShield;
      playerShield -= absorbedByShield;
      playerHp = Math.max(0, playerHp - healthDamage);
      events.push({ kind: 'player-damaged', atMs, amount: healthDamage, absorbedByShield });

      if (playerHp <= 0) {
        outcome = 'defeat';
        resolvedTimeMs = atMs;
        events.push({ kind: 'outcome', atMs, outcome });
        break;
      }

      queue.push({
        kind: 'enemy-attack',
        dueAtMs: atMs + setup.enemy.attackIntervalMs,
        sequence: nextSequence,
      });
      nextSequence += 1;
      continue;
    }

    if (nextEffect.kind === 'boss-telegraph') {
      const interference = setup.enemy.interference;
      if (!interference) continue;
      events.push({
        kind: 'boss-telegraph',
        atMs,
        itemInstanceId: nextEffect.itemInstanceId,
        impactAtMs: atMs + interference.telegraphMs,
      });
      continue;
    }

    if (nextEffect.kind === 'boss-interference') {
      const interference = setup.enemy.interference;
      if (!interference) continue;
      jammedUntilByItemId[nextEffect.itemInstanceId] = atMs + interference.durationMs;
      events.push({
        kind: 'boss-jammed',
        atMs,
        itemInstanceId: nextEffect.itemInstanceId,
        durationMs: interference.durationMs,
      });
      nextSequence = scheduleInterference(
        queue,
        setup,
        atMs + interference.intervalMs,
        nextSequence,
      );
      continue;
    }

    if (enemyPoison > 0) {
      const poisonDamage = enemyPoison;
      enemyHp = Math.max(0, enemyHp - poisonDamage);
      events.push({
        kind: 'enemy-damaged',
        atMs,
        itemInstanceId: 'poison',
        amount: poisonDamage,
        source: 'poison',
      });
      enemyPoison = Math.max(0, enemyPoison - 1);
      if (enemyHp <= 0) {
        outcome = 'victory';
        resolvedTimeMs = atMs;
        events.push({ kind: 'outcome', atMs, outcome });
        break;
      }
    }

    queue.push({
      kind: 'poison-tick',
      dueAtMs: atMs + POISON_TICK_INTERVAL_MS,
      sequence: nextSequence,
    });
    nextSequence += 1;
  }

  for (const [itemInstanceId, jammedUntil] of Object.entries(jammedUntilByItemId)) {
    if (jammedUntil <= resolvedTimeMs) delete jammedUntilByItemId[itemInstanceId];
  }

  return {
    state: {
      timeMs: resolvedTimeMs,
      playerHp,
      playerShield,
      enemyHp,
      enemyPoison,
      outcome,
      nextSequence,
      queue: sortQueue(queue),
      jammedUntilByItemId,
    },
    events,
  };
}

function validateInterference(interference: EnemyInterferenceDefinition): void {
  if (
    interference.intervalMs <= 0
    || interference.telegraphMs < 0
    || interference.durationMs <= 0
    || interference.telegraphMs >= interference.intervalMs
  ) {
    throw new RangeError('Enemy interference values are invalid');
  }
}

function scheduleInterference(
  queue: CombatQueuedEffect[],
  setup: CombatSetup,
  impactAtMs: number,
  nextSequence: number,
): number {
  const interference = setup.enemy.interference;
  if (!interference) return nextSequence;

  const targetIds = interferenceTargets(setup.items);
  if (targetIds.length === 0) return nextSequence;
  const cycleIndex = Math.max(0, Math.round(impactAtMs / interference.intervalMs) - 1);
  const itemInstanceId = targetIds[cycleIndex % targetIds.length];
  if (!itemInstanceId) return nextSequence;

  queue.push({
    kind: 'boss-telegraph',
    dueAtMs: Math.max(0, impactAtMs - interference.telegraphMs),
    sequence: nextSequence,
    itemInstanceId,
  });
  nextSequence += 1;
  queue.push({
    kind: 'boss-interference',
    dueAtMs: impactAtMs,
    sequence: nextSequence,
    itemInstanceId,
  });
  return nextSequence + 1;
}

function interferenceTargets(items: ReadonlyMap<string, CombatBuildItem>): string[] {
  const meaningful = [...items.values()]
    .filter((item) =>
      item.damage > 0
      || item.poisonOnHit > 0
      || item.shieldOnTrigger > 0
      || item.bonusLaserShots > 0
      || item.chaosPower > 0,
    )
    .map((item) => item.instanceId)
    .sort((a, b) => a.localeCompare(b));
  if (meaningful.length > 0) return meaningful;
  return [...items.keys()].sort((a, b) => a.localeCompare(b));
}

function sortQueue(queue: readonly CombatQueuedEffect[]): CombatQueuedEffect[] {
  return [...queue].sort(compareEffects);
}

function sortQueueInPlace(queue: CombatQueuedEffect[]): void {
  queue.sort(compareEffects);
}

function compareEffects(a: CombatQueuedEffect, b: CombatQueuedEffect): number {
  return a.dueAtMs - b.dueAtMs || a.sequence - b.sequence;
}
